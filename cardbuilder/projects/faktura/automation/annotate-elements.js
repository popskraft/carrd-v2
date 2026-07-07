// Аннотация элементов Carrd-мастера Faktura по §0.3 CARRD-V2-MASTER-PLAN.md (faktura-app).
// Dry-run по умолчанию: только выбирает элементы, читает текущие ID/Classes, печатает план.
// Запись: node annotate-elements.js --execute
// ЖЁСТКОЕ ПРАВИЛО: скрипт НИКОГДА не нажимает Save/Publish. Сохранение — вручную владельцем.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";
const EXECUTE = process.argv.includes("--execute");

// dataId = data-id враппера в билдере (совпадает с instance-N экспорта).
// expectId = ожидаемое текущее значение settings_element_id (фикс-ID) для самопроверки выбора.
const EDITS = [
  { dataId: "container13", expectId: "promos-header",   addClasses: ["section-header"] },
  { dataId: "container06", expectId: "fabrics-header",  addClasses: ["section-header"] },
  { dataId: "container08", expectId: "portfolio-header",addClasses: ["section-header"] },
  { dataId: "container09", expectId: "process-header",  addClasses: ["section-header"] },

  { dataId: "container31", expectId: "about",           addClasses: ["about-item"] },
  { dataId: "container29", addClasses: ["about-item"] },
  { dataId: "container30", addClasses: ["about-item"] },
  { dataId: "container32", addClasses: ["about-item"] },
  { dataId: "container33", addClasses: ["about-item"] },
  { dataId: "container34", addClasses: ["about-item"] },

  { dataId: "image24", setId: "image-fabrics" },
  { dataId: "image05", setId: "image-product-hero" },
  { dataId: "image02", setId: "image-page-cover" },
  { dataId: "image12", setId: "image-seo-text" },
  { dataId: "image22", setId: "image-category-grid" },

  { dataId: "container19", setId: "benefits-cards" },
  { dataId: "container01", setId: "seo-text" },
  { dataId: "container04", setId: "category-grid", addClasses: ["tpl-home", "tpl-category"] },

  { dataId: "container16", expectId: "product-hero", addClasses: ["tpl-product"] },
  { dataId: "gallery02",  addClasses: ["tpl-product"] },
  { dataId: "table01",    addClasses: ["tpl-product"] },
  { dataId: "container36", expectId: "page-filters", addClasses: ["tpl-category"] },
];

async function readSelection(page) {
  return page.evaluate(() => {
    const active = document.querySelector("#canvas .component.active");
    const w = active ? active.closest(".component-wrapper[data-id]") : null;
    const p = document.querySelector("#properties-panel");
    const idField = p ? p.querySelector('[name="settings_element_id"]') : null;
    const clsField = p ? p.querySelector('[name="settings_element_classes"]') : null;
    return {
      activeDataId: w ? w.getAttribute("data-id") : null,
      panelTitle: p ? ((p.querySelector("h1,h2,.title") || {}).textContent || "").trim() : null,
      currentId: idField ? idField.value : null,
      currentClasses: clsField ? clsField.value : null,
      hasFields: !!(idField && clsField),
    };
  });
}

async function selectElement(page, dataId) {
  const wrapper = page.locator(`#canvas .component-wrapper[data-id="${dataId}"]`).first();
  if ((await wrapper.count()) === 0) return { ok: false, reason: "wrapper-not-found" };
  await wrapper.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  // Врапперы (особенно грид-ячейки) перекрываются — ищем точки, где elementFromPoint
  // реально попадает в поддерево целевого враппера, и кликаем по ним с верификацией.
  const points = await page.evaluate((id) => {
    const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
    if (!w) return [];
    const r = w.getBoundingClientRect();
    const out = [];
    const vh = window.innerHeight, vw = window.innerWidth;
    for (let fy = 0.06; fy <= 0.95 && out.length < 8; fy += 0.11) {
      for (let fx = 0.04; fx <= 0.96 && out.length < 8; fx += 0.12) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (x < 2 || y < 2 || x > vw - 2 || y > vh - 2) continue;
        const el = document.elementFromPoint(x, y);
        // ближайший враппер от точки должен быть ИМЕННО целевым (не вложенный дочерний компонент)
        if (el && el.closest('.component-wrapper[data-id]') === w) out.push({ x, y });
      }
    }
    return out;
  }, dataId);
  let state = null;
  if (points.length) {
    for (const pt of points) {
      await page.mouse.click(pt.x, pt.y);
      await page.waitForTimeout(600);
      state = await readSelection(page);
      if (state.activeDataId === dataId) break;
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  }
  if (!state || state.activeDataId !== dataId) {
    // Фоллбэк: враппер полностью накрыт дочерними компонентами (full-bleed image в ячейке).
    // Временно глушим pointer-events у вложенных врапперов, кликаем центр, восстанавливаем.
    const pt = await page.evaluate((id) => {
      const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
      if (!w) return null;
      w.querySelectorAll(".component-wrapper").forEach((c) => { c.dataset._pe = c.style.pointerEvents || ""; c.style.pointerEvents = "none"; });
      const r = w.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: Math.min(r.top + r.height / 2, window.innerHeight - 5) };
    }, dataId);
    if (pt) {
      await page.mouse.click(pt.x, pt.y);
      await page.waitForTimeout(600);
      await page.evaluate((id) => {
        const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
        if (w) w.querySelectorAll(".component-wrapper").forEach((c) => { c.style.pointerEvents = c.dataset._pe || ""; delete c.dataset._pe; });
      }, dataId);
      state = await readSelection(page);
    }
  }
  if (!state || state.activeDataId !== dataId)
    return { ok: false, reason: `wrong-selection:${state ? state.activeDataId : "null"}`, state };
  if (!state.hasFields) return { ok: false, reason: "no-settings-fields", state };
  return { ok: true, state };
}

async function openSettingsTab(page) {
  const tab = page.locator('#properties-panel header li', { hasText: "Settings" }).last();
  if ((await tab.count()) === 0) return false;
  await tab.click();
  await page.waitForTimeout(300);
  return page.locator('#properties-panel [name="settings_element_id"]').first().isVisible();
}

// Carrd хранит классы в textarea по одному на строку — сохраняем этот формат.
function mergeClasses(existing, add) {
  const cur = String(existing || "").trim().split(/\s+/).filter(Boolean);
  for (const c of add) if (!cur.includes(c)) cur.push(c);
  return cur.join("\n");
}

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;
  if (!page) throw new Error("Вкладка билдера не найдена: " + BUILD_URL);

  const report = [];
  console.log(EXECUTE ? "=== EXECUTE MODE ===" : "=== DRY RUN (без записи) ===");

  for (const edit of EDITS) {
    const row = { dataId: edit.dataId, plan: edit, status: "", before: {}, after: {} };
    const sel = await selectElement(page, edit.dataId);
    if (!sel.ok) {
      row.status = "SKIP: " + sel.reason;
      if (sel.state) row.before = { id: sel.state.currentId, classes: sel.state.currentClasses, panel: sel.state.panelTitle };
      report.push(row);
      console.log("SKIP", edit.dataId, sel.reason);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      continue;
    }
    row.before = { id: sel.state.currentId, classes: sel.state.currentClasses, panel: sel.state.panelTitle };

    // проверка ожидаемого фикс-ID
    if (edit.expectId && sel.state.currentId !== edit.expectId) {
      row.status = `SKIP: expectId mismatch (got "${sel.state.currentId}")`;
      report.push(row);
      console.log("SKIP", edit.dataId, row.status);
      await page.keyboard.press("Escape");
      continue;
    }
    // защита: не перезаписываем уже занятый чужим значением ID
    if (edit.setId && sel.state.currentId && sel.state.currentId !== edit.setId) {
      row.status = `SKIP: id already set to "${sel.state.currentId}" — конфликт, решить вручную`;
      report.push(row);
      console.log("SKIP", edit.dataId, row.status);
      await page.keyboard.press("Escape");
      continue;
    }

    const newClasses = edit.addClasses ? mergeClasses(sel.state.currentClasses, edit.addClasses) : sel.state.currentClasses;
    const newId = edit.setId || sel.state.currentId;
    row.after = { id: newId, classes: newClasses };

    const noChange = newId === sel.state.currentId && newClasses === sel.state.currentClasses;
    if (noChange) {
      row.status = "OK: already-set";
    } else if (!EXECUTE) {
      row.status = "PLANNED";
    } else {
      if (!(await openSettingsTab(page))) {
        row.status = "SKIP: settings-tab-not-found";
        report.push(row);
        console.log("SKIP", edit.dataId, row.status);
        await page.keyboard.press("Escape");
        continue;
      }
      if (edit.setId && newId !== sel.state.currentId) {
        const idInput = page.locator('#properties-panel [name="settings_element_id"]:visible').first();
        await idInput.fill(newId);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(300);
      }
      if (edit.addClasses) {
        // Classes — это form-list-input: скрытая textarea-модель + строки .item + кнопка do-add
        const listInput = page.locator('#properties-panel .form-list-input:has(textarea[name="settings_element_classes"])');
        const items = listInput.locator(".items .item");
        // подчистить пустые строки
        for (let i = (await items.count()) - 1; i >= 0; i--) {
          const v = await items.nth(i).locator("input").inputValue();
          if (!v.trim()) { await items.nth(i).locator(".do-delete").click(); await page.waitForTimeout(250); }
        }
        const have = (await listInput.locator(".items .item input").evaluateAll((els) => els.map((e) => e.value.trim()))).filter(Boolean);
        for (const cls of edit.addClasses) {
          if (have.includes(cls)) continue;
          await listInput.locator(".do-add").click();
          await page.waitForTimeout(250);
          await listInput.locator(".items .item input").last().fill(cls);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(350);
        }
      }
      // перечитать значения для верификации
      const verify = await page.evaluate(() => ({
        id: document.querySelector('#properties-panel [name="settings_element_id"]').value,
        classes: document.querySelector('#properties-panel [name="settings_element_classes"]').value,
      }));
      row.status = verify.id === newId && verify.classes === newClasses ? "DONE" : "WARN: verify mismatch " + JSON.stringify(verify);
    }
    report.push(row);
    console.log(row.status.padEnd(12), edit.dataId.padEnd(14), "| id:", row.before.id || "—", "→", newId || "—", "| cls:", JSON.stringify(row.before.classes || ""), "→", JSON.stringify(newClasses || ""));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

  const out = path.join(__dirname, "runs", `annotate-${EXECUTE ? "execute" : "dry"}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log("\nReport:", out);
  console.log("Итого:", report.filter((r) => r.status === "DONE").length, "DONE,",
    report.filter((r) => r.status === "PLANNED").length, "PLANNED,",
    report.filter((r) => r.status.startsWith("SKIP")).length, "SKIP,",
    report.filter((r) => r.status.startsWith("OK")).length, "OK,",
    report.filter((r) => r.status.startsWith("WARN")).length, "WARN");
  console.log("ВАЖНО: Save/Publish скрипт не нажимает — сохранить в билдере вручную после ревью.");
  await browser.close();
})();
