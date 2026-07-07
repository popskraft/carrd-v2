// Диагностика: что происходит после клика по элементу канваса; поиск панели настроек.
const { chromium } = require("playwright-core");
const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";
const TARGET = process.argv[2] || "container13";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;
  if (!page) throw new Error("tab not found");

  // Реальный клик Playwright по центру элемента (не DOM .click())
  const wrapper = page.locator(`#canvas .component-wrapper[data-id="${TARGET}"]`).first();
  await wrapper.scrollIntoViewIfNeeded();
  await wrapper.click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(1200);

  const dump = await page.evaluate((id) => {
    const w = document.querySelector(`#canvas .component-wrapper[data-id="${id}"]`);
    const active = document.querySelector("#canvas .component.active, #canvas .component-wrapper.active");
    // кандидаты на панель: видимые крупные блоки с input'ами вне канваса
    const panels = [...document.querySelectorAll("body *")]
      .filter((el) => el.id && el.querySelector("input,textarea") && !el.closest("#canvas"))
      .map((el) => ({
        id: el.id,
        cls: String(el.className).slice(0, 80),
        visible: el.offsetParent !== null,
        inputs: el.querySelectorAll("input,textarea").length,
      }))
      .slice(0, 25);
    const topIds = [...document.body.children].map((e) => e.tagName + "#" + e.id + "." + String(e.className).slice(0, 50));
    return {
      wrapperClass: w ? w.className : null,
      activeFound: active ? active.className.slice(0, 100) : null,
      panels,
      topIds,
    };
  }, TARGET);
  console.log(JSON.stringify(dump, null, 1));
  await browser.close();
})();
