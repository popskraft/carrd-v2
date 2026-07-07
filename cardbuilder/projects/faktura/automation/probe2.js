// Дамп properties-panel для одного элемента (container13 = promos-header). Read-only + Escape.
const { chromium } = require("playwright-core");
const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";
const TARGET = process.argv[2] || "container13";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;
  if (!page) throw new Error("Вкладка билдера не найдена");

  await page.evaluate((id) => {
    const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
    if (!w) throw new Error("wrapper not found: " + id);
    (w.querySelector(":scope > .component") || w).click();
  }, TARGET);
  await page.waitForTimeout(900);

  const dump = await page.evaluate(() => {
    const p = document.querySelector("#properties-panel");
    if (!p) return { error: "no panel" };
    const tabs = [...p.querySelectorAll("header li")].map((t, i) => i + ":" + t.textContent.trim() + (t.className ? " [" + t.className + "]" : ""));
    const walk = (root) =>
      [...root.querySelectorAll("section")].map((s) => ({
        cls: s.className,
        labels: [...s.querySelectorAll("label")].map((l) => l.textContent.trim()).slice(0, 30),
        inputs: [...s.querySelectorAll("input,textarea,select")].map(
          (f) => `${f.tagName}:${f.type || ""} name=${f.name} value=${String(f.value).slice(0, 80)}`
        ).slice(0, 30),
      }));
    return { tabs, sections: walk(p) };
  });
  console.log(JSON.stringify(dump, null, 1));
  await page.keyboard.press("Escape");
  await browser.close();
})();
