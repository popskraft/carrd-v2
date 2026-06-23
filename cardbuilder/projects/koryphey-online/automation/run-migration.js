#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const SOURCE_ID = "4544177104830762";
const TARGET_ID = "8089177104819774";
const DEFAULT_STYLE_FALLBACK = "Main";

const argv = process.argv.slice(2);
const EXECUTE = argv.includes("--execute");
const DRY_RUN = !EXECUTE;

const BASE_DIR = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(
  BASE_DIR,
  "data",
  "manifests",
  "SITE2_TO_SITE1_TRANSFER_MANIFEST.tsv"
);
const LOG_PATH = path.join(BASE_DIR, "data", "runs", "MIGRATION_AUTOMATION_RUN.json");

function parseManifest(tsv) {
  return tsv
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [action, reason, dataId, dataType, style, ...rest] = line.split("\t");
      return {
        action,
        reason,
        dataId,
        dataType,
        style,
        text: (rest || []).join("\t"),
      };
    })
    .filter((r) => r.action === "COPY");
}

async function getCarrdPages(browser) {
  const contexts = browser.contexts();
  if (!contexts.length) throw new Error("No browser contexts found in CDP session.");
  const pages = contexts.flatMap((c) => c.pages());
  const source = pages.find((p) => p.url().includes(`/dashboard/${SOURCE_ID}/build`));
  const target = pages.find((p) => p.url().includes(`/dashboard/${TARGET_ID}/build`));
  if (!source || !target) {
    throw new Error(
      "Could not find both source and target Carrd builder tabs. Open both URLs in Chrome first."
    );
  }
  return { source, target };
}

async function waitBuilderReady(page) {
  await page.waitForSelector("#canvas", { timeout: 20000 });
  await page.waitForSelector("#menu", { timeout: 20000 });
}

async function selectByDataId(page, dataId) {
  const exists = await page.locator(`#canvas .component-wrapper[data-id="${dataId}"]`).count();
  if (!exists) return false;
  await page.evaluate((id) => {
    const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
    if (!w) return;
    w.scrollIntoView({ block: "center", inline: "nearest" });
    const c = w.querySelector(":scope > .component") || w;
    c.click();
  }, dataId);
  await page.waitForTimeout(250);
  return true;
}

async function readSourceSnapshot(page, dataId) {
  const selected = await selectByDataId(page, dataId);
  if (!selected) return { ok: false, error: "source_not_found" };

  return page.evaluate((id) => {
    const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
    if (!w) return { ok: false, error: "source_not_found_after_select" };

    const text = (w.textContent || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    const type = w.getAttribute("data-type");

    let styleFromClass = null;
    const root = w.querySelector(":scope > .component > div");
    if (root) {
      for (const cls of root.classList) {
        if (cls.startsWith("--style-")) {
          styleFromClass = cls.replace("--style-", "");
          break;
        }
      }
    }

    return {
      ok: true,
      dataId: id,
      type,
      text,
      styleFromClass,
    };
  }, dataId);
}

async function openAddAndCreateType(target, dataType) {
  const action = `add-${dataType}`;
  const addToggle = target.locator('#menu > div:has(svg use[href*="icon-add"]), #menu > div:has(span.label:has-text("Add"))').first();
  if ((await addToggle.count()) > 0) {
    await addToggle.click({ timeout: 5000 });
  } else {
    await target.locator("#menu > div").last().click({ timeout: 5000 });
  }
  await target.waitForTimeout(180);

  const item = target.locator(`#menu [data-action="${action}"]`).first();
  if ((await item.count()) === 0) {
    return { ok: false, error: `add_action_not_found:${action}` };
  }
  await item.click();
  await target.waitForTimeout(500);

  const newId = await target.evaluate(() => {
    const active = document.querySelector("#canvas .component-wrapper .component.active");
    const w = active ? active.closest(".component-wrapper[data-id]") : null;
    return w ? w.getAttribute("data-id") : null;
  });
  return { ok: true, newId };
}

async function assignStyleIfPossible(target, styleName, fallback) {
  const desired = styleName && styleName !== "(none)" ? styleName : null;
  const wanted = desired || fallback;
  if (!wanted) return { ok: true, applied: null, note: "no_style" };

  return target.evaluate((styleWanted) => {
    const panel = document.querySelector("#properties-panel");
    if (!panel || !panel.classList.contains("visible")) {
      return { ok: false, error: "panel_not_visible" };
    }

    const box = panel.querySelector(".style-dropdown");
    if (!box) return { ok: false, error: "style_dropdown_not_found" };
    box.click();

    const allCandidates = Array.from(
      panel.querySelectorAll(".style-dropdown .item, .style-dropdown .option, .style-dropdown [data-value], .style-dropdown li")
    );
    const match = allCandidates.find((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      return t === styleWanted.toLowerCase();
    });

    if (match) {
      match.click();
      return { ok: true, applied: styleWanted };
    }

    const mainMatch = allCandidates.find((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      return t === "main";
    });
    if (mainMatch) {
      mainMatch.click();
      return { ok: true, applied: "Main", fallback: true };
    }

    return { ok: false, error: `style_not_found:${styleWanted}` };
  }, wanted);
}

async function writeSimpleContent(target, text) {
  if (!text) return { ok: true, note: "empty_text" };
  return target.evaluate((value) => {
    const panel = document.querySelector("#properties-panel");
    if (!panel || !panel.classList.contains("visible")) {
      return { ok: false, error: "panel_not_visible" };
    }

    const tabs = panel.querySelectorAll("header li");
    if (tabs[0]) tabs[0].click();

    const activeSection = panel.querySelector("form section.active") || panel.querySelector("form section");
    if (!activeSection) return { ok: false, error: "no_content_section" };

    const ta = activeSection.querySelector("textarea");
    if (ta) {
      ta.value = value;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, mode: "textarea" };
    }

    const ce = activeSection.querySelector('[contenteditable="true"]');
    if (ce) {
      ce.focus();
      ce.textContent = value;
      ce.dispatchEvent(new InputEvent("input", { bubbles: true }));
      ce.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, mode: "contenteditable" };
    }

    const input = activeSection.querySelector('input[type="text"]');
    if (input) {
      input.value = value.slice(0, 250);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, mode: "input" };
    }

    return { ok: false, error: "no_text_field_found" };
  }, text);
}

async function moveBlockAfterAnchor(target, movingId, anchorId) {
  const moving = target.locator(`#canvas .component-wrapper[data-id="${movingId}"]`).first();
  const anchor = target.locator(`#canvas .component-wrapper[data-id="${anchorId}"]`).first();
  if ((await moving.count()) === 0 || (await anchor.count()) === 0) {
    return { ok: false, error: "moving_or_anchor_missing" };
  }

  const movingBox = await moving.boundingBox();
  const anchorBox = await anchor.boundingBox();
  if (!movingBox || !anchorBox) return { ok: false, error: "no_bounding_box" };

  const from = {
    x: movingBox.x + movingBox.width / 2,
    y: movingBox.y + Math.min(24, movingBox.height / 2),
  };
  const to = {
    x: anchorBox.x + Math.min(80, anchorBox.width / 2),
    y: anchorBox.y + anchorBox.height + 20,
  };

  await target.mouse.move(from.x, from.y);
  await target.mouse.down();
  await target.mouse.move(to.x, to.y, { steps: 20 });
  await target.mouse.up();
  await target.waitForTimeout(450);
  return { ok: true };
}

async function run() {
  if (!fs.existsSync(MANIFEST_PATH)) throw new Error(`Manifest not found: ${MANIFEST_PATH}`);
  const manifest = parseManifest(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const run = {
    startedAt: new Date().toISOString(),
    mode: DRY_RUN ? "dry-run" : "execute",
    total: manifest.length,
    results: [],
  };

  console.log(`Mode: ${run.mode}`);
  console.log(`Manifest rows: ${manifest.length}`);
  console.log("Connecting to Chrome via CDP at http://127.0.0.1:9222 ...");

  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  try {
    const { source, target } = await getCarrdPages(browser);
    await waitBuilderReady(source);
    await waitBuilderReady(target);
    console.log("Connected. Source and Target tabs detected.");

    for (const row of manifest) {
      const step = {
        dataId: row.dataId,
        dataType: row.dataType,
        sourceStyle: row.style,
        status: "pending",
      };

      try {
        const sourceSnapshot = await readSourceSnapshot(source, row.dataId);
        step.source = sourceSnapshot;
        if (!sourceSnapshot.ok) {
          step.status = "failed";
          step.error = sourceSnapshot.error;
          run.results.push(step);
          continue;
        }

        if (DRY_RUN) {
          step.status = "dry-run-ok";
          run.results.push(step);
          continue;
        }

        const created = await openAddAndCreateType(target, row.dataType);
        step.targetCreate = created;
        if (!created.ok || !created.newId) {
          step.status = "failed";
          step.error = created.error || "create_failed";
          run.results.push(step);
          continue;
        }

        const moved = await moveBlockAfterAnchor(target, created.newId, "control04");
        step.targetMove = moved;

        const desiredStyle = row.style && row.style !== "(none)" ? row.style : null;
        const styled = await assignStyleIfPossible(target, desiredStyle, DEFAULT_STYLE_FALLBACK);
        step.targetStyle = styled;

        const content = await writeSimpleContent(target, sourceSnapshot.text || row.text || "");
        step.targetContent = content;

        step.status = "ok";
        step.targetId = created.newId;
      } catch (err) {
        step.status = "failed";
        step.error = err.message;
      }

      run.results.push(step);
      console.log(
        `[${run.results.length}/${manifest.length}] ${row.dataId} -> ${step.status}`
      );
    }
  } finally {
    run.finishedAt = new Date().toISOString();
    fs.writeFileSync(LOG_PATH, JSON.stringify(run, null, 2), "utf8");
    await browser.close();
  }

  const ok = run.results.filter((r) => r.status === "ok").length;
  const dry = run.results.filter((r) => r.status === "dry-run-ok").length;
  const fail = run.results.filter((r) => r.status === "failed").length;
  console.log(`Run complete. ok=${ok} dry=${dry} failed=${fail}`);
  console.log(`Report: ${LOG_PATH}`);
  console.log("Save/Publish not executed by this script.");
}

run().catch((e) => {
  console.error("Migration runner failed:", e);
  process.exit(1);
});
