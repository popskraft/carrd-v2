#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/popskraft/Projects/carrd-v2";
const BUILDER_URL = "https://carrd.co/dashboard/4155176224428477/build";
const write = process.argv.includes("--write");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const evidenceDir = path.join(ROOT, "cardbuilder/projects/main-template/data/migration", `v2-${stamp}`);

const embeds = {
  embed14: { title: "Theme Core V2 CSS CDN (HEAD)", location: "head", content: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.css">' },
  embed08: { title: "No Loadwaiting V2 CDN (HEAD)", location: "head", content: '<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/no-loadwaiting-v2/no-loadwaiting-v2.min.js"></script>' },
  embed02: { title: "Theme Core V2 JS (BODY END)", location: "body-end", content: '<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.js"></script>' },
  embed01: { title: "Shopping Cart + Cookie Banner V2 CDN (BODY END)", location: "body-end", content: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/shopping-cart-v2/shopping-cart-v2.min.css">\n<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/cookie-banner-v2/cookie-banner-v2.min.css">\n<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/shopping-cart-v2/shopping-cart-v2.min.js"></script>\n<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/cookie-banner-v2/cookie-banner-v2.min.js"></script>' },
};

const componentPatches = {
  container06: { classes: [], attrs: { "data-cards-v2": "cards", "data-cards-v2-color-1": "#ff9bd9", "data-cards-v2-color-2": "#9bdaff", "data-cards-v2-color-3": "#fff259" } },
  buttons07: { attrs: { "data-switcher-v2": "price" } },
  buttons06: { attrs: { "data-switcher-v2": "price" } },
  text37: { classes: [], attrs: { "data-switcher-v2-target": "price", "data-switcher-v2-index": "1" } },
  text38: { classes: [], attrs: { "data-switcher-v2-target": "price", "data-switcher-v2-index": "1" } },
  text29: { classes: [], attrs: { "data-switcher-v2-target": "price", "data-switcher-v2-index": "2" } },
  text30: { classes: [], attrs: { "data-switcher-v2-target": "price", "data-switcher-v2-index": "2" } },
  buttons01: { attrs: { "data-switcher-v2": "cases", "data-switcher-v2-mode": "cluster" } },
  container20: { attrs: { "data-switcher-v2-cluster": "cases" } },
  container21: { attrs: { "data-switcher-v2-cluster": "cases" } },
  container19: { attrs: { "data-switcher-v2-cluster": "cases" } },
  container11: { classes: [], attrs: { "data-slider-v2": "main" } },
  container05: { classes: [], attrs: { "data-slider-v2": "main" } },
  container07: { classes: [], attrs: { "data-slider-v2": "main" } },
  container08: { classes: [], attrs: { "data-slider-v2": "main" } },
  container16: { classes: [], attrs: { "data-slider-v2": "main" } },
  container09: { classes: [], attrs: { "data-slider-v2": "main" } },
  container13: { classes: [], attrs: { "data-grid-v2": "features", "data-grid-v2-columns": "4", "data-grid-v2-justify": "true" } },
  container14: { classes: [], attrs: { "data-grid-v2": "features", "data-grid-v2-columns": "4" } },
  container15: { classes: [], attrs: { "data-grid-v2": "features", "data-grid-v2-columns": "4" } },
  container04: { classes: [], attrs: { "data-grid-v2": "features", "data-grid-v2-columns": "4" } },
  container03: { classes: [], attrs: { "data-faq-v2": "main" } },
  container10: { classes: [], attrs: { "data-shopping-cart-v2-target": "" } },
  container12: { classes: [], attrs: { "data-modal-v2": "contact" }, id: "" },
  container17: { attrs: { "data-cookie-v2": "consent" }, id: "" },
};

const textPatches = {
  text16: "It's simple. Add `data-faq-v2=main` to the container. Then insert a divider-component *before* each question (your H1-H3 heading) and *after* each answer (your text/nodes).",
  text23: "It's simple. Add `data-faq-v2=main` to the container. Then insert a divider-component *before* each question (your H1-H3 heading) and *after* each answer (your text/nodes).",
};

const attrsToString = (attrs) => Object.entries(attrs).map(([key, value]) => value === "" ? key : `${key}=${value}`).join("\n");
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

const tabs = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const tab = tabs.find((item) => item.type === "page" && item.url === BUILDER_URL);
if (!tab) throw new Error(`Builder tab not found: ${BUILDER_URL}`);

const expression = `(() => {
  const write = ${JSON.stringify(write)};
  const embeds = ${JSON.stringify(embeds)};
  const patches = ${JSON.stringify(componentPatches)};
  const textPatches = ${JSON.stringify(textPatches)};
  const attrsToString = (attrs) => Object.entries(attrs).map(([key, value]) => value === "" ? key : key + "=" + value).join("\\n");
  const b = window.app?.builder;
  if (!b?.site?.components) return { error: "builder-not-ready" };
  const beforeSite = b.site.json();
  const before = {};
  const changedIds = [];
  for (const [id, spec] of Object.entries(embeds)) {
    const c = b.site.components[id];
    if (!c || c.type !== "embed") return { error: "missing-embed", id };
    before[id] = c.json();
    if (write) {
      c.embed.title = spec.title;
      c.embed.code.content = spec.content;
      c.embed.code.location = spec.location;
      c.embed.code.style = "hidden";
      c.embed.code.defer = false;
      changedIds.push(id);
    }
  }
  for (const [id, content] of Object.entries(textPatches)) {
    const c = b.site.components[id];
    if (!c || c.type !== "text") return { error: "missing-text", id };
    before[id] = c.json();
    if (write) {
      c.text.content = content;
      changedIds.push(id);
    }
  }
  for (const [id, patch] of Object.entries(patches)) {
    const c = b.site.components[id];
    if (!c) return { error: "missing-component", id };
    before[id] = c.json();
    if (write) {
      const element = c.settings.element;
      if (patch.classes) element.classes = patch.classes.join("\\n");
      if (patch.attrs) element.attributes = attrsToString(patch.attrs);
      if (Object.prototype.hasOwnProperty.call(patch, "id")) element.id = patch.id;
      changedIds.push(id);
    }
  }
  if (write) {
    b.site.components.links02.links.links.forEach((link) => { if (link.url === "#modalContact") link.url = "#data-modal-v2-contact"; });
    for (const id of ["buttons02", "buttons03"]) {
      b.site.components[id].buttons.buttons.forEach((button) => { button.onclick = button.onclick.replaceAll("CarrdShoppingCart.", "CarrdShoppingCartV2."); });
      changedIds.push(id);
    }
    b.site.markChanged("changeComponentProperty", { componentIds: [...new Set(changedIds)] });
    // markChanged normalizes custom attributes for the canvas. Restore the
    // persisted Carrd schema (newline-delimited string) after dirtying state.
    for (const [id, patch] of Object.entries(patches)) {
      if (patch.attrs) b.site.components[id].settings.element.attributes = attrsToString(patch.attrs);
    }
  }
  return { beforeSite, before, afterSite: b.site.json(), changedIds: [...new Set(changedIds)], dirty: !!document.querySelector('#menu [data-action="publish"].alert') };
})()`;

const result = await new Promise((resolve, reject) => {
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  ws.addEventListener("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, returnByValue: true } })));
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== 1) return;
    ws.close();
    if (message.result?.exceptionDetails) reject(new Error(message.result.result?.description || "CDP evaluation failed"));
    else resolve(message.result.result.value);
  });
  ws.addEventListener("error", reject);
});
if (result.error) throw new Error(JSON.stringify(result));

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(evidenceDir, "site-before.json"), result.beforeSite);
fs.writeFileSync(path.join(evidenceDir, "site-after.json"), result.afterSite);
fs.writeFileSync(path.join(evidenceDir, "result.json"), JSON.stringify({ mode: write ? "write" : "dry-run", builderUrl: BUILDER_URL, changedIds: result.changedIds, dirty: result.dirty, beforeSha256: sha(result.beforeSite), afterSha256: sha(result.afterSite), embedHashes: Object.fromEntries(Object.entries(embeds).map(([id, spec]) => [id, sha(spec.content)])) }, null, 2));
console.log(JSON.stringify({ evidenceDir, mode: write ? "write" : "dry-run", changedIds: result.changedIds, dirty: result.dirty, beforeSha256: sha(result.beforeSite), afterSha256: sha(result.afterSite) }, null, 2));
