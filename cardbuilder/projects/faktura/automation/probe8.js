// Проба №2: корректное добавление класса через input строки + чистка пустых строк.
const { chromium } = require("/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/koryphey-online/automation/node_modules/playwright-core");
const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;

  const wrapper = page.locator('#canvas .component-wrapper[data-id="container13"]').first();
  await wrapper.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
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
  }
  if (selected !== "container13") throw new Error("selection failed");
  await page.locator('#properties-panel header li[data-name="settings"]').click();
  await page.waitForTimeout(400);

  const listInput = page.locator('#properties-panel .form-list-input:has(textarea[name="settings_element_classes"])');
  console.log("items before:", await listInput.locator(".items .item").count());

  // удалить пустые строки, если остались от прошлой пробы
  const items = listInput.locator(".items .item");
  for (let i = (await items.count()) - 1; i >= 0; i--) {
    const v = await items.nth(i).locator("input").inputValue();
    if (!v.trim()) { await items.nth(i).locator(".do-delete").click(); await page.waitForTimeout(300); }
  }
  console.log("items after cleanup:", await items.count());

  // добавить класс: do-add → fill input строки → Enter
  await listInput.locator(".do-add").click();
  await page.waitForTimeout(300);
  const newInput = listInput.locator(".items .item input").last();
  await newInput.fill("section-header");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);

  console.log("RESULT textarea:", JSON.stringify(await listInput.locator("textarea").inputValue()));
  console.log("RESULT item values:", await listInput.locator(".items .item input").evaluateAll((els) => els.map((e) => e.value)));
  await page.keyboard.press("Escape");
  await browser.close();
})();
