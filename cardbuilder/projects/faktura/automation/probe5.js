// Probe: выбрать image17 (ребёнок container29) и изучить UI выбора: #annotations, панель, breadcrumb.
const { chromium } = require("playwright-core");
const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;

  const wrapper = page.locator('#canvas .component-wrapper[data-id="image17"]').first();
  await wrapper.scrollIntoViewIfNeeded();
  const box = await wrapper.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(800);

  const dump = await page.evaluate(() => {
    const ann = document.querySelector("#annotations");
    const active = document.querySelector("#canvas .component.active");
    const w = active ? active.closest(".component-wrapper[data-id]") : null;
    const annButtons = ann
      ? [...ann.querySelectorAll("button, a, [class*=btn], [class*=icon], div[title], span[title]")].map((b) => ({
          tag: b.tagName, cls: String(b.className).slice(0, 60), title: b.title || "", text: b.textContent.trim().slice(0, 30),
          vis: b.offsetParent !== null,
        })).filter((b) => b.vis).slice(0, 30)
      : [];
    const panelHeader = document.querySelector("#properties-panel header, #properties-panel .header");
    return {
      selected: w ? w.getAttribute("data-id") : null,
      annHTML: ann ? ann.innerHTML.slice(0, 1500) : null,
      annButtons,
      panelHeaderHTML: panelHeader ? panelHeader.outerHTML.slice(0, 800) : null,
    };
  });
  console.log(JSON.stringify(dump, null, 1));
  await page.keyboard.press("Escape");
  await browser.close();
})();
