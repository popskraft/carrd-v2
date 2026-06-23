// Дамп всех полей #properties-panel выбранного элемента: name, label, value, видимость, секция.
const { chromium } = require("/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/koryphey-online/automation/node_modules/playwright-core");
const BUILD_URL = "carrd.co/dashboard/4778178033233108/build";
const TARGET = process.argv[2] || "container13";

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  let page = null;
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) if (p.url().includes(BUILD_URL)) page = p;
  if (!page) throw new Error("tab not found");

  const wrapper = page.locator(`#canvas .component-wrapper[data-id="${TARGET}"]`).first();
  await wrapper.scrollIntoViewIfNeeded();
  await wrapper.click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(1000);

  const dump = await page.evaluate(() => {
    const p = document.querySelector("#properties-panel");
    const header = p.querySelector("header, .header, nav");
    const tabs = header ? [...header.querySelectorAll("li,button,a,div")].map((t) => t.textContent.trim()).filter(Boolean).slice(0, 20) : [];
    const fields = [...p.querySelectorAll("input,textarea,select")].map((f) => {
      const grp = f.closest(".form-group, section, fieldset");
      let label = "";
      if (f.id) { const l = p.querySelector(`label[for="${f.id}"]`); if (l) label = l.textContent.trim(); }
      if (!label && grp) { const l = grp.querySelector("label,h3,h4,.label"); if (l) label = l.textContent.trim(); }
      return {
        name: f.name || f.id || "",
        tag: f.tagName + ":" + (f.type || ""),
        label: label.slice(0, 40),
        value: String(f.value).slice(0, 60),
        vis: f.offsetParent !== null,
      };
    });
    return { title: (p.querySelector("h1,h2,.title") || {}).textContent || "", tabs, total: fields.length, fields };
  });
  console.log("TITLE:", dump.title, "| TABS:", dump.tabs.join(" / "));
  dump.fields.forEach((f, i) =>
    console.log(String(i).padStart(3), f.vis ? "V" : ".", f.tag.padEnd(18), (f.name || "").padEnd(50), "|", f.label, "|", f.value)
  );
  await browser.close();
})();
