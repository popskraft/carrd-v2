#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/popskraft/Projects/carrd-v2";
const BUILDER_URL = "https://carrd.co/dashboard/4155176224428477/build";
const DEFAULT_REF = "main";
const args = process.argv.slice(2);
const write = args.includes("--write");

const getArg = (name, fallback = "") => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
};

const ref = getArg("--ref", DEFAULT_REF).trim();
const rev = getArg("--rev").trim();

if (!ref) throw new Error("--ref is required");
if (!rev) throw new Error("--rev is required");
if (!/^\d{8}-\d{2}$/.test(rev)) {
  throw new Error(`Invalid --rev "${rev}". Expected YYYYMMDD-XX.`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const evidenceDir = path.join(
  ROOT,
  "cardbuilder/projects/main-template/data/migration",
  `set-dev-cdn-rev-${stamp}`
);

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

const tabs = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const tab = tabs.find((item) => item.type === "page" && item.url === BUILDER_URL);
if (!tab) throw new Error(`Builder tab not found: ${BUILDER_URL}`);

const expression = `(() => {
  const write = ${JSON.stringify(write)};
  const targetRef = ${JSON.stringify(ref)};
  const targetRev = ${JSON.stringify(rev)};
  const repoPrefix = "https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@";
  const targetPrefix = repoPrefix + targetRef + "/";
  const targetSuffix = "?rev=" + targetRev;
  const canonicalPaths = {
    "no-loadwaiting.min.js": "dist/no-loadwaiting/no-loadwaiting.min.js",
    "theme-runtime.min.css": "dist/theme-runtime.min.css",
    "theme-runtime.min.js": "dist/theme-runtime.min.js",
    "shopping-cart.min.css": "dist/shopping-cart/shopping-cart.min.css",
    "shopping-cart.min.js": "dist/shopping-cart/shopping-cart.min.js",
    "cookie-banner.min.css": "dist/cookie-banner/cookie-banner.min.css",
    "cookie-banner.min.js": "dist/cookie-banner/cookie-banner.min.js"
  };
  const b = window.app?.builder;
  if (!b?.site?.components) return { error: "builder-not-ready" };

  const beforeSite = b.site.json();
  const updatedEmbeds = [];

  for (const [id, component] of Object.entries(b.site.components)) {
    if (component?.type !== "embed") continue;
    const content = component.embed?.code?.content;
    if (typeof content !== "string" || !content.includes(repoPrefix)) continue;

    const nextContent = content.replace(
      /https:\\/\\/cdn\\.jsdelivr\\.net\\/gh\\/popskraft\\/carrd-v2@[^\\/\"'\\s?]+\\/([^\"'\\s?]+)(\\?rev=[^\"'\\s]+)?/g,
      (match, assetPath) => {
        const segments = assetPath.split("/");
        const basename = segments[segments.length - 1];
        const canonicalPath = canonicalPaths[basename] || assetPath;
        return targetPrefix + canonicalPath + targetSuffix;
      }
    );

    updatedEmbeds.push({
      id,
      title: component.embed?.title || "",
      location: component.embed?.code?.location || "",
      before: content,
      after: nextContent,
      changed: content !== nextContent
    });

    if (write && content !== nextContent) {
      component.embed.code.content = nextContent;
    }
  }

  const changedIds = updatedEmbeds.filter((item) => item.changed).map((item) => item.id);

  if (write && changedIds.length > 0) {
    b.site.markChanged("changeComponentProperty", { componentIds: changedIds });
    for (const item of updatedEmbeds) {
      if (!item.changed) continue;
      b.site.components[item.id].embed.code.content = item.after;
    }
  }

  return {
    beforeSite,
    afterSite: b.site.json(),
    updatedEmbeds,
    changedIds,
    dirty: !!document.querySelector('#menu [data-action="publish"].alert')
  };
})()`;

const result = await new Promise((resolve, reject) => {
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  ws.addEventListener("open", () => {
    ws.send(
      JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: { expression, returnByValue: true },
      })
    );
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
      ref,
      rev,
      changedIds: result.changedIds,
      dirty: result.dirty,
      beforeSha256: sha(result.beforeSite),
      afterSha256: sha(result.afterSite),
      updatedEmbeds: result.updatedEmbeds.map((item) => ({
        id: item.id,
        title: item.title,
        location: item.location,
        changed: item.changed,
        beforeSha256: sha(item.before),
        afterSha256: sha(item.after),
      })),
    },
    null,
    2
  )
);

console.log(
  JSON.stringify(
    {
      evidenceDir,
      mode: write ? "write" : "dry-run",
      ref,
      rev,
      changedIds: result.changedIds,
      dirty: result.dirty,
      beforeSha256: sha(result.beforeSite),
      afterSha256: sha(result.afterSite),
    },
    null,
    2
  )
);
