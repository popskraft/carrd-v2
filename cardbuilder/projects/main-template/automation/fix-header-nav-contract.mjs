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
  `header-nav-fix-${stamp}`
);

const patches = {
  container02: {
    classes: "",
    elementId: "",
    blur: 0,
  },
  buttons04: {
    classes: "header-mobile-el-collapsing",
    elementId: "",
  },
  links02: {
    classes: "header-mobile-el-collapsing",
  },
};

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

const tabs = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const tab = tabs.find((item) => item.type === "page" && item.url === BUILDER_URL);
if (!tab) throw new Error(`Builder tab not found: ${BUILDER_URL}`);

const expression = `(() => {
  const write = ${JSON.stringify(write)};
  const patches = ${JSON.stringify(patches)};
  const b = window.app?.builder;
  if (!b?.site?.components) return { error: "builder-not-ready" };

  const beforeSite = b.site.json();
  const before = {};
  const changedIds = [];

  for (const [id, patch] of Object.entries(patches)) {
    const c = b.site.components[id];
    if (!c) return { error: "missing-component", id };
    before[id] = c.json();

    if (!write) continue;

    if (Object.prototype.hasOwnProperty.call(patch, "classes")) {
      c.settings.element.classes = patch.classes;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "elementId")) {
      c.settings.element.id = patch.elementId;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "blur")) {
      c.appearance.background.blur = patch.blur;
    }
    changedIds.push(id);
  }

  if (write) {
    b.history.add({
      type: "changeComponentProperty",
      componentIds: [...new Set(changedIds)],
    });
    b.site.markChanged("changeComponentProperty", {
      componentIds: [...new Set(changedIds)],
    });
  }

  const afterSite = b.site.json();
  const live = (() => {
    const c = b.site.components.container02;
    return {
      classes: c?.settings?.element?.classes || "",
      elementId: c?.settings?.element?.id || "",
      backgroundBlur: c?.appearance?.background?.blur,
      publishAlert: !!document.querySelector('#menu [data-action="publish"].alert'),
    };
  })();

  return { beforeSite, before, afterSite, changedIds: [...new Set(changedIds)], live };
})()`;

const result = await new Promise((resolve, reject) => {
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({
      id: 1,
      method: "Runtime.evaluate",
      params: { expression, returnByValue: true },
    }));
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== 1) return;
    ws.close();
    if (message.result?.exceptionDetails) {
      reject(new Error(message.result.result?.description || "CDP evaluation failed"));
      return;
    }
    resolve(message.result.result.value);
  });
  ws.addEventListener("error", reject);
});

if (result.error) throw new Error(JSON.stringify(result));

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(evidenceDir, "site-before.json"), result.beforeSite);
fs.writeFileSync(path.join(evidenceDir, "site-after.json"), result.afterSite);
fs.writeFileSync(
  path.join(evidenceDir, "result.json"),
  JSON.stringify(
    {
      mode: write ? "write" : "dry-run",
      builderUrl: BUILDER_URL,
      changedIds: result.changedIds,
      live: result.live,
      beforeSha256: sha(result.beforeSite),
      afterSha256: sha(result.afterSite),
    },
    null,
    2
  )
);

console.log(JSON.stringify({
  evidenceDir,
  mode: write ? "write" : "dry-run",
  changedIds: result.changedIds,
  live: result.live,
  beforeSha256: sha(result.beforeSite),
  afterSha256: sha(result.afterSite),
}, null, 2));
