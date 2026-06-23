#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const SOURCE_ID = "4544177104830762";
const TARGET_ID = "8089177104819774";

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
const LOG_PATH = path.join(BASE_DIR, "data", "runs", "MIGRATION_AUTOMATION_RUN_CP.json");

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
  if (!contexts.length) throw new Error("No browser contexts in CDP session.");
  const pages = contexts.flatMap((c) => c.pages());
  const source = pages.find((p) => p.url().includes(`/dashboard/${SOURCE_ID}/build`));
  const target = pages.find((p) => p.url().includes(`/dashboard/${TARGET_ID}/build`));
  if (!source || !target) {
    throw new Error("Open both source/target Carrd builder tabs in CDP Chrome.");
  }
  return { source, target };
}

async function waitReady(page) {
  await page.waitForSelector("#canvas", { timeout: 20000 });
  await page.waitForSelector("#menu", { timeout: 20000 });
}

async function selectById(page, id) {
  const ok = await page.evaluate((dataId) => {
    const w = document.querySelector(`#canvas .component-wrapper[data-id="${dataId}"]`);
    if (!w) return false;
    w.scrollIntoView({ block: "center", inline: "nearest" });
    const c = w.querySelector(":scope > .component") || w;
    c.click();
    return true;
  }, id);
  await page.waitForTimeout(220);
  return ok;
}

async function getActiveId(page) {
  return page.evaluate(() => {
    const active = document.querySelector("#canvas .component-wrapper .component.active");
    const w = active ? active.closest(".component-wrapper[data-id]") : null;
    return w ? w.getAttribute("data-id") : null;
  });
}

async function setMainStyleFallbackIfNoStyle(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("#properties-panel");
    if (!panel || !panel.classList.contains("visible")) {
      return { ok: false, error: "panel_not_visible" };
    }
    const dropdown = panel.querySelector(".style-dropdown");
    if (!dropdown) return { ok: false, error: "style_dropdown_not_found" };

    const txt = (dropdown.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const hasSomeStyle = txt && txt !== "(none)" && !txt.includes("add style");
    if (hasSomeStyle) return { ok: true, note: "style_present" };

    dropdown.click();
    const candidates = Array.from(
      panel.querySelectorAll(".style-dropdown .item, .style-dropdown .option, .style-dropdown li")
    );
    const main = candidates.find((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      return t === "main";
    });
    if (!main) return { ok: false, error: "main_style_not_found" };
    main.click();
    return { ok: true, applied: "Main" };
  });
}

async function run() {
  if (!fs.existsSync(MANIFEST_PATH)) throw new Error(`Manifest not found: ${MANIFEST_PATH}`);
  const manifest = parseManifest(fs.readFileSync(MANIFEST_PATH, "utf8"));

  const run = {
    startedAt: new Date().toISOString(),
    mode: DRY_RUN ? "dry-run" : "execute",
    strategy: "copy-paste",
    total: manifest.length,
    results: [],
  };

  console.log(`Mode: ${run.mode} (copy-paste)`);
  console.log(`Manifest rows: ${manifest.length}`);
  console.log("Connecting to Chrome via CDP at http://127.0.0.1:9222 ...");

  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  try {
    const { source, target } = await getCarrdPages(browser);
    await waitReady(source);
    await waitReady(target);
    console.log("Connected. Source and Target tabs detected.");

    for (const row of manifest) {
      const step = {
        dataId: row.dataId,
        dataType: row.dataType,
        sourceStyle: row.style,
        status: "pending",
      };

      try {
        const sourceSelected = await selectById(source, row.dataId);
        if (!sourceSelected) {
          step.status = "failed";
          step.error = "source_not_found";
          run.results.push(step);
          continue;
        }

        if (DRY_RUN) {
          step.status = "dry-run-ok";
          run.results.push(step);
          continue;
        }

        await source.bringToFront();
        await source.keyboard.press("Meta+c");
        await source.waitForTimeout(180);

        await target.bringToFront();
        const anchorSelected = await selectById(target, "control04");
        if (!anchorSelected) {
          step.status = "failed";
          step.error = "target_anchor_control04_not_found";
          run.results.push(step);
          continue;
        }

        await target.keyboard.press("Meta+v");
        await target.waitForTimeout(500);

        const createdId = await getActiveId(target);
        step.targetId = createdId;

        const styleResult = await setMainStyleFallbackIfNoStyle(target);
        step.targetStyle = styleResult;

        step.status = "ok";
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
  console.error("Copy-paste migration runner failed:", e);
  process.exit(1);
});
