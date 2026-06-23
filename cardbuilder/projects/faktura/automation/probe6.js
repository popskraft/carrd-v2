// Probe: container13 → таб Settings → разметка вокруг settings_element_classes.
const { chromium } = require("/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/koryphey-online/automation/node_modules/playwright-core");
const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;

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
  console.log("click point:", pt);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(800);
  console.log("selected:", await page.evaluate(() => {
    const a = document.querySelector("#canvas .component.active");
    const w = a && a.closest(".component-wrapper[data-id]");
    return w && w.getAttribute("data-id");
  }));

  await page.locator('#properties-panel header li[data-name="settings"]').click();
  await page.waitForTimeout(500);

  const dump = await page.evaluate(() => {
    const p = document.querySelector("#properties-panel");
    const ta = p.querySelector('[name="settings_element_classes"]');
    const idf = p.querySelector('[name="settings_element_id"]');
    const info = (el) => el ? {
      vis: el.offsetParent !== null,
      rect: el.getBoundingClientRect().toJSON(),
      parentCls: String(el.parentElement.className).slice(0, 80),
      parentHTML: el.parentElement.outerHTML.slice(0, 700),
    } : null;
    // активная секция таба settings
    const sections = [...p.querySelectorAll("form > section, form section")].map(s => ({cls: s.className, vis: s.offsetParent !== null})).slice(0,12);
    return { id: info(idf), classes: info(ta), sections };
  });
  console.log(JSON.stringify(dump, null, 1));
  await page.keyboard.press("Escape");
  await browser.close();
})();
