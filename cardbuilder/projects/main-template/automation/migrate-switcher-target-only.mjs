#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/popskraft/Projects/carrd-v2";
const BUILDER_URL = "https://carrd.co/dashboard/4155176224428477/build";
const write = process.argv.includes("--write");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const evidenceDir = path.join(
  ROOT,
  "cardbuilder/projects/main-template/data/migration",
  `switcher-target-only-${stamp}`
);

const componentPatches = {
  buttons01: { attrs: { "data-switcher": "cases" } },
  container20: { attrs: { "data-switcher-target": "cases", "data-switcher-index": "1" } },
  container21: { attrs: { "data-switcher-target": "cases", "data-switcher-index": "2" } },
  container19: { attrs: { "data-switcher-target": "cases", "data-switcher-index": "3" } },
};

const attrsToString = attrs => Object.entries(attrs)
  .map(([key, value]) => value === "" ? key : `${key}=${value}`)
  .join("\n");

const sha = value => crypto.createHash("sha256").update(value).digest("hex");

const tabs = await fetch("http://127.0.0.1:9222/json/list").then(response => response.json());
const tab = tabs.find(item => item.type === "page" && item.url === BUILDER_URL);
if (!tab) {
  throw new Error(`Builder tab not found: ${BUILDER_URL}`);
}

const expression = `(() => {
  const write = ${JSON.stringify(write)};
  const patches = ${JSON.stringify(componentPatches)};
  const attrsToString = attrs => Object.entries(attrs)
    .map(([key, value]) => value === "" ? key : key + "=" + value)
    .join("\\n");
  const b = window.app?.builder;
  if (!b?.site?.components) {
    return { error: "builder-not-ready" };
  }

  const beforeSite = b.site.json();
  const before = {};
  const after = {};
  const changedIds = [];

  for (const [id, patch] of Object.entries(patches)) {
    const c = b.site.components[id];
    if (!c) {
      return { error: "missing-component", id };
    }
    before[id] = {
      type: c.type,
      classes: c.settings?.element?.classes || "",
      attributes: c.settings?.element?.attributes || ""
    };
    if (write) {
      if (patch.attrs) {
        c.settings.element.attributes = attrsToString(patch.attrs);
      }
      changedIds.push(id);
    }
  }

  if (write) {
    b.site.markChanged("changeComponentProperty", { componentIds: [...new Set(changedIds)] });
    for (const [id, patch] of Object.entries(patches)) {
      if (patch.attrs) {
        b.site.components[id].settings.element.attributes = attrsToString(patch.attrs);
      }
    }
  }

  for (const id of Object.keys(patches)) {
    const c = b.site.components[id];
    after[id] = {
      type: c.type,
      classes: c.settings?.element?.classes || "",
      attributes: c.settings?.element?.attributes || ""
    };
  }

  return {
    beforeSite,
    before,
    after,
    afterSite: b.site.json(),
    changedIds: [...new Set(changedIds)],
    dirty: !!document.querySelector('#menu [data-action="publish"].alert')
  };
})()`;

const result = await new Promise((resolve, reject) => {
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({
      id: 1,
      method: "Runtime.evaluate",
      params: { expression, returnByValue: true }
    }));
  });
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id !== 1) {
      return;
    }
    ws.close();
    if (message.result?.exceptionDetails) {
      reject(new Error(message.result.result?.description || "CDP evaluation failed"));
      return;
    }
    resolve(message.result.result.value);
  });
  ws.addEventListener("error", reject);
});

if (result.error) {
  throw new Error(JSON.stringify(result));
}

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(evidenceDir, "site-before.json"), result.beforeSite);
fs.writeFileSync(path.join(evidenceDir, "site-after.json"), result.afterSite);
fs.writeFileSync(path.join(evidenceDir, "result.json"), JSON.stringify({
  mode: write ? "write" : "dry-run",
  builderUrl: BUILDER_URL,
  changedIds: result.changedIds,
  dirty: result.dirty,
  beforeSha256: sha(result.beforeSite),
  afterSha256: sha(result.afterSite),
  before: result.before,
  after: result.after
}, null, 2));

console.log(JSON.stringify({
  evidenceDir,
  mode: write ? "write" : "dry-run",
  changedIds: result.changedIds,
  dirty: result.dirty,
  beforeSha256: sha(result.beforeSite),
  afterSha256: sha(result.afterSite),
  after: result.after
}, null, 2));
