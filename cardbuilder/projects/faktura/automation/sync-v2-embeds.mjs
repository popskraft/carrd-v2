#!/usr/bin/env node
/**
 * Faktura-specific Carrd Builder embed sync.
 *
 * SAFE BY DESIGN:
 * - Maps by stable embed IDs from the faktura embed-map (NOT the generic
 *   refresh-builder-plugins.mjs map, which targets a different site).
 * - Touches ONLY the IDs listed in TARGETS. Service embeds (JIVO/Metrika/
 *   Calibri) and faktura-custom theme embeds (embed14/embed10) are never
 *   referenced.
 * - Preserves each embed's existing title / location / style / defer / settings;
 *   replaces only embed.code.content.
 * - Default mode is read-only (--dry-run). Writing requires --write.
 * - Always writes a before-backup and an after hash-readback report.
 *
 * Usage:
 *   node sync-v2-embeds.mjs --dry-run --backup-dir <dir> --out-json <file>
 *   node sync-v2-embeds.mjs --write   --backup-dir <dir> --out-json <file>
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = "/Users/popskraft/Projects/carrd-v2";
const BUILDER_URL = "https://carrd.co/dashboard/4778178033233108/build";

// Faktura embed-map (stable IDs) -> repo dist source. Only the alias-fix set.
const TARGETS = [
  { id: "embed02", label: "Cookie Banner", file: "dist/cookie-banner-v2/cookie-banner-v2-embed.html" },
  { id: "embed03", label: "FAQ", file: "dist/faq-v2/faq-v2-embed.html" },
  { id: "embed07", label: "Modal", file: "dist/modal-v2/modal-v2-embed.html" },
];

function parseArgs(argv) {
  const args = { port: process.env.CARRD_DEBUG_PORT || "9222", write: false, backupDir: "", outJson: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i], n = argv[i + 1];
    if (a === "--write") args.write = true;
    else if (a === "--dry-run") args.write = false;
    else if (a === "--port" && n) { args.port = n; i += 1; }
    else if (a === "--backup-dir" && n) { args.backupDir = n; i += 1; }
    else if (a === "--out-json" && n) { args.outJson = n; i += 1; }
  }
  return args;
}

function fail(msg) { console.error(msg); process.exit(1); }
function sha256(v) { return crypto.createHash("sha256").update(v).digest("hex"); }

async function getTabs(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!r.ok) fail(`Failed to read debug tabs: ${r.status}`);
  return r.json();
}

function pickTab(tabs) {
  const m = tabs.filter((t) => t.type === "page" && String(t.url || "") === BUILDER_URL);
  if (!m.length) fail(`No Builder tab found for ${BUILDER_URL}`);
  return m[0];
}

async function evaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1, settled = false;
    const finish = (fn, v) => { if (settled) return; settled = true; try { ws.close(); } catch {} fn(v); };
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ id: id++, method: "Page.bringToFront", params: {} }));
      ws.send(JSON.stringify({ id: id++, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
    });
    ws.addEventListener("message", (e) => {
      const p = JSON.parse(e.data);
      if (p.method) return;
      if (p.error) return finish(reject, new Error(p.error.message || "CDP request failed"));
      if (!p.result || !p.result.result) return;
      if (p.result.exceptionDetails) {
        return finish(reject, new Error(p.result.exceptionDetails.text || p.result.result.description || "evaluate exception"));
      }
      finish(resolve, p.result.result.value);
    });
    ws.addEventListener("error", (e) => finish(reject, new Error(e.message || "WebSocket error")));
    ws.addEventListener("close", () => { if (!settled) finish(reject, new Error("WebSocket closed before evaluation finished")); });
  });
}

function ensureDir(d) { if (d) fs.mkdirSync(d, { recursive: true }); }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const specs = TARGETS.map((t) => {
    const content = fs.readFileSync(path.join(ROOT, t.file), "utf8");
    return { ...t, content, sha256: sha256(content) };
  });

  const tab = pickTab(await getTabs(args.port));

  const expression = `(() => {
    const specs = ${JSON.stringify(specs.map((s) => ({ id: s.id, content: s.content })))};
    const write = ${JSON.stringify(args.write)};
    const b = window.app && window.app.builder;
    if (!b || !b.site || !b.site.components) return { error: "builder-not-ready" };

    const snap = (c) => c ? {
      id: c.id,
      title: (c.embed && c.embed.title) || "",
      location: (c.embed && c.embed.code && c.embed.code.location) || "",
      style: (c.embed && c.embed.code && c.embed.code.style) || "",
      defer: (c.embed && c.embed.code && c.embed.code.defer) ?? null,
      content: (c.embed && c.embed.code && c.embed.code.content) || "",
    } : null;

    const before = [], after = [], changedIds = [];
    for (const spec of specs) {
      const c = b.site.components[spec.id];
      if (!c || c.type !== "embed") { before.push({ id: spec.id, missing: true }); continue; }
      before.push(snap(c));
      if (write) {
        c.embed = c.embed || {};
        c.embed.code = c.embed.code || {};
        c.embed.code.content = spec.content; // content only; title/location/style/defer preserved
        changedIds.push(c.id);
      }
    }
    if (write && changedIds.length) {
      b.site.markChanged("changeComponentProperty", { componentIds: changedIds });
      b.site.syncCanvas("change");
      b.ui.refresh("site");
    }
    for (const spec of specs) after.push(snap(b.site.components[spec.id]));

    return {
      before, after,
      dirtyPublishButton: !!document.querySelector('#menu [data-action="publish"].alert'),
    };
  })()`;

  const result = await evaluate(tab.webSocketDebuggerUrl, expression);
  if (result && result.error) fail(result.error);

  // before-backup
  if (args.backupDir) {
    ensureDir(args.backupDir);
    for (const entry of result.before || []) {
      if (!entry || entry.missing) continue;
      fs.writeFileSync(path.join(args.backupDir, `${entry.id}-before.html`), entry.content || "", "utf8");
    }
  }

  const checks = (result.after || []).map((entry, i) => {
    const spec = specs[i];
    const actualHash = entry ? sha256(entry.content || "") : null;
    return {
      id: spec.id,
      label: spec.label,
      title: entry ? entry.title : null,
      location: entry ? entry.location : null,
      expectedHash: spec.sha256,
      actualHash,
      matchesExpected: actualHash === spec.sha256,
      beforeOldFaqScope: (result.before[i] && /:is\(\[data-faq-v2\],\s*\.FAQContainer\)/.test(result.before[i].content || "")) || false,
    };
  });

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      mode: args.write ? "write" : "dry-run",
      builderUrl: BUILDER_URL,
      tabId: tab.id,
      title: tab.title,
      backupDir: args.backupDir || null,
    },
    inputs: specs.map((s) => ({ id: s.id, label: s.label, sourcePath: s.file, sha256: s.sha256, contentLength: s.content.length })),
    result: { dirtyPublishButton: !!result.dirtyPublishButton, checks },
  };

  if (args.outJson) { ensureDir(path.dirname(args.outJson)); fs.writeFileSync(args.outJson, JSON.stringify(output, null, 2), "utf8"); }
  console.log(JSON.stringify(output, null, 2));
}

main().catch((e) => fail(e && e.message ? e.message : String(e)));
