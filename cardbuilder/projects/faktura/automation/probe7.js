// Реальная проба правки: добавить класс section-header на container13 через form-list-input.
const { chromium } = require("playwright-core");
const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;

  // выбор container13 (точка через elementFromPoint)
  const wrapper = page.locator('#canvas .component-wrapper[data-id="container13"]').first();
  await wrapper.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const pt = await page.evaluate(() => {
    const w = document.querySelector('#canvas .component-wrapper[data-id="container13"]');
    const r = w.getBoundingClientRect();
    for (let fy = 0.06; fy <= 0.95; fy += 0.11) for (let fx = 0.04; fx <= 0.96; fx += 0.12) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (y < 2 || y > window.innerHeight - 2) continue;
      const el = document.elementFromPoint(x, y);
      if (el && el.closest('.component-wrapper[data-id]') === w) return { x, y };
    }
    return null;
  });
  let selected = null;
  for (let i = 0; i < 4 && selected !== "container13"; i++) {
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(900);
    selected = await page.evaluate(() => {
      const a = document.querySelector("#canvas .component.active");
      const w = a && a.closest(".component-wrapper[data-id]");
      return w && w.getAttribute("data-id");
    });
    console.log("attempt", i, "selected:", selected);
  }
  if (selected !== "container13") throw new Error("selection failed");
  await page.locator('#properties-panel header li[data-name="settings"]').click();
  await page.waitForTimeout(400);

  const listInput = page.locator('#properties-panel .form-list-input:has(textarea[name="settings_element_classes"])');
  await listInput.locator(".do-add").click();
  await page.waitForTimeout(400);
  // что появилось?
  console.log("after do-add:", await listInput.evaluate((el) => el.outerHTML.slice(0, 900)));
  await page.keyboard.type("section-header");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  console.log("RESULT textarea:", JSON.stringify(await listInput.locator("textarea").inputValue()));
  console.log("RESULT items:", await listInput.evaluate((el) => el.querySelector(".items").textContent.trim()));
  await page.keyboard.press("Escape");
  await browser.close();
})();
