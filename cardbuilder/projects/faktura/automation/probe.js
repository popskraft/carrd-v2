// Read-only разведка билдера Carrd (faktura): карта канваса + структура properties-panel.
// Ничего не кликает, кроме выбора ОДНОГО элемента для дампа панели (затем Escape).
const { chromium } = require("/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/koryphey-online/automation/node_modules/playwright-core");

const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const contexts = browser.contexts();
  let page = null;
  for (const ctx of contexts) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;
  if (!page) throw new Error("Вкладка билдера не найдена");

  // 1. Карта канваса: wrapper data-id -> внутренний id/классы отрендеренного элемента
  const canvasMap = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("#canvas .component-wrapper[data-id]").forEach((w) => {
      const c = w.querySelector(":scope > .component");
      const rendered = c ? c.querySelector("[id]") : null;
      out.push({
        dataId: w.getAttribute("data-id"),
        wrapperClass: w.className,
        componentClass: c ? c.className.slice(0, 120) : null,
        renderedId: rendered ? rendered.id : null,
        renderedClass: rendered ? String(rendered.className).slice(0, 160) : null,
      });
    });
    return out;
  });

  console.log("=== CANVAS MAP (" + canvasMap.length + " wrappers) ===");
  canvasMap.forEach((e, i) =>
    console.log(String(i).padStart(3), e.dataId, "| rid:", e.renderedId, "| rcls:", e.renderedClass)
  );

  // 2. Выбрать первый элемент с renderedId === 'promos-header' (или первый попавшийся) и дампнуть панель
  const probeTarget =
    canvasMap.find((e) => e.renderedId === "promos-header") || canvasMap[2];
  console.log("\n=== PROBE SELECT:", probeTarget.dataId, probeTarget.renderedId, "===");
  await page.evaluate((id) => {
    const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
    const c = w.querySelector(":scope > .component") || w;
    c.click();
  }, probeTarget.dataId);
  await page.waitForTimeout(800);

  const panel = await page.evaluate(() => {
    const p = document.querySelector("#properties-panel");
    if (!p) return { error: "no panel" };
    const tabs = [...p.querySelectorAll("header li")].map((t) => t.textContent.trim());
    const sections = [...p.querySelectorAll("form section")].map((s) => {
      const fields = [...s.querySelectorAll("label, input, textarea, select")].map((f) => {
        if (f.tagName === "LABEL") return "LABEL:" + f.textContent.trim().slice(0, 50);
        return f.tagName + "[type=" + (f.type || "") + " name=" + (f.name || "") + " value=" + String(f.value || "").slice(0, 60) + "]";
      });
      return { cls: s.className, head: (s.querySelector("h2,h3,header") || {}).textContent || "", fields: fields.slice(0, 40) };
    });
    return { tabs, sectionCount: sections.length, sections };
  });
  console.log(JSON.stringify(panel, null, 1).slice(0, 6000));

  await page.keyboard.press("Escape");
  await browser.close();
})();
