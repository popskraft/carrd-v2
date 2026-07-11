#!/usr/bin/env node
/**
 * Faktura clean-runtime embed sync.
 *
 * Safety rules:
 * - Never mutates embed14. It is a protected legacy theme/style layer.
 * - Service embeds (JIVO / Metrika / Calibri) are never touched.
 * - Plugin embeds are mapped by stable IDs to current repo dist assets.
 * - Site-owned slider markup/config migration is opt-in via --write-config.
 * - Default mode is dry-run. Writing requires --write.
 * - Always supports before-backup and exact hash readback.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = "/Users/popskraft/Projects/carrd-v2";
const BUILDER_URL = "https://carrd.co/dashboard/4778178033233108/build";

const PROTECTED_IDS = new Set(["embed14"]);
const SERVICE_IDS = new Set(["embed01", "embed11", "embed12"]);

const PLUGIN_TARGETS = [
  {
    id: "embed08",
    title: "No Load Waiting (in HEAD)",
    file: "dist/no-loadwaiting/no-loadwaiting-embed.html",
    expectedClass: "embed-in-head",
  },
  {
    id: "embed02",
    title: "Cookie Banner",
    file: "dist/cookie-banner/cookie-banner-embed.html",
    expectedClass: "embed-plugin-in-body-end",
  },
  {
    id: "embed03",
    title: "FAQ",
    file: "dist/faq/faq-embed.html",
    expectedClass: "embed-plugin-in-body-end",
  },
  {
    id: "embed04",
    title: "Floating CTA",
    file: "dist/floating-cta/floating-cta-embed.html",
    expectedClass: "embed-plugin-in-body-end",
  },
  {
    id: "embed06",
    title: "Grid Cluster",
    file: "dist/grid-cluster/grid-cluster-embed.html",
    expectedClass: "embed-plugin-in-body-end",
  },
  {
    id: "embed05",
    title: "Header Nav",
    file: "dist/header-nav/header-nav-embed.html",
    expectedClass: "embed-plugin-in-body-end",
  },
  {
    id: "embed07",
    title: "Modal",
    file: "dist/modal/modal-embed.html",
    expectedClass: "embed-plugin-in-body-end",
  },
  {
    id: "embed13",
    title: "Slider | Part: 1/2",
    file: "dist/slider/slider-embed-part1.html",
    expectedClass: "embed-plugin-in-body-end",
  },
  {
    id: "embed09",
    title: "Slider | Part: 2/2",
    file: "dist/slider/slider-embed-part2.html",
    expectedClass: "embed-plugin-in-body-end",
  },
];

const CONFIG_TARGET = {
  id: "embed10",
  title: "Theme JS Custom (BODY END)",
  expectedClass: "embed-in-body-end",
  sourcePath: "generated:faktura-slider-config-retired",
  buildContent() {
    return `<!-- Slider options are now stored on the first [data-slider="portfolio"] container. -->`;
  },
};

const SLIDER_MARKUP_TARGET = {
  id: "container14",
  kind: "element",
  title: "Portfolio Slider First Container",
  expectedClass: "slider-item-card-default\nportfolio-item",
  sourcePath: "generated:faktura-slider-data-contract",
  attributes: "data-slider=portfolio\ndata-slider-spv=1 2 3\ndata-slider-gap=16 16 32",
};

function parseArgs(argv) {
  const args = {
    port: process.env.CARRD_DEBUG_PORT || "9222",
    write: false,
    writeConfig: false,
    backupDir: "",
    outJson: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--write") {
      args.write = true;
    } else if (arg === "--write-config") {
      args.writeConfig = true;
    } else if (arg === "--port" && next) {
      args.port = next;
      i += 1;
    } else if (arg === "--backup-dir" && next) {
      args.backupDir = next;
      i += 1;
    } else if (arg === "--out-json" && next) {
      args.outJson = next;
      i += 1;
    }
  }

  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function ensureDir(dirPath) {
  if (!dirPath) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function buildTargets({ includeConfig }) {
  const pluginTargets = PLUGIN_TARGETS.map((target) => {
    const content = readFile(target.file);
    return {
      kind: "plugin",
      ...target,
      sourcePath: target.file,
      content,
      sha256: sha256(content),
      contentLength: content.length,
    };
  });

  if (!includeConfig) {
    return pluginTargets;
  }

  const configContent = CONFIG_TARGET.buildContent();
  return [
    ...pluginTargets,
    {
      kind: "config",
      id: CONFIG_TARGET.id,
      title: CONFIG_TARGET.title,
      expectedClass: CONFIG_TARGET.expectedClass,
      sourcePath: CONFIG_TARGET.sourcePath,
      content: configContent,
      sha256: sha256(configContent),
      contentLength: configContent.length,
    },
    {
      ...SLIDER_MARKUP_TARGET,
      content: SLIDER_MARKUP_TARGET.attributes,
      sha256: sha256(SLIDER_MARKUP_TARGET.attributes),
      contentLength: SLIDER_MARKUP_TARGET.attributes.length,
    },
  ];
}

async function getTabs(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) {
    fail(`Failed to read debug tabs: ${response.status}`);
  }
  return response.json();
}

function pickTab(tabs) {
  const matches = tabs.filter(
    (tab) => tab.type === "page" && String(tab.url || "") === BUILDER_URL
  );
  if (!matches.length) {
    fail(`No Builder tab found for ${BUILDER_URL}`);
  }
  return matches[0];
}

async function evaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {}
      fn(value);
    };

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ id: id++, method: "Page.bringToFront", params: {} }));
      ws.send(
        JSON.stringify({
          id: id++,
          method: "Runtime.evaluate",
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true,
          },
        })
      );
    });

    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.method) return;
      if (payload.error) {
        finish(reject, new Error(payload.error.message || "CDP request failed"));
        return;
      }
      if (!payload.result || !payload.result.result) return;
      if (payload.result.exceptionDetails) {
        finish(
          reject,
          new Error(
            payload.result.exceptionDetails.text ||
              payload.result.result.description ||
              "Runtime.evaluate exception"
          )
        );
        return;
      }
      finish(resolve, payload.result.result.value);
    });

    ws.addEventListener("error", (event) => {
      finish(reject, new Error(event.message || "WebSocket error"));
    });

    ws.addEventListener("close", () => {
      if (!settled) {
        finish(reject, new Error("WebSocket closed before evaluation finished"));
      }
    });
  });
}

function writeBackups(backupDir, beforeEntries) {
  if (!backupDir) return;
  ensureDir(backupDir);
  for (const entry of beforeEntries) {
    if (!entry || !entry.id || entry.missing) continue;
    fs.writeFileSync(path.join(backupDir, `${entry.id}-before.html`), entry.content || "", "utf8");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = buildTargets({ includeConfig: args.writeConfig });
  const payload = targets.map((target) => ({
    id: target.id,
    title: target.title,
    expectedClass: target.expectedClass,
    content: target.content,
    attributes: target.attributes,
    sourcePath: target.sourcePath,
    sha256: target.sha256,
    kind: target.kind,
  }));

  const tabs = await getTabs(args.port);
  const tab = pickTab(tabs);

  const expression = `(() => {
    const specs = ${JSON.stringify(payload)};
    const write = ${JSON.stringify(args.write)};
    const protectedIds = ${JSON.stringify(Array.from(PROTECTED_IDS))};
    const serviceIds = ${JSON.stringify(Array.from(SERVICE_IDS))};
    const b = window.app && window.app.builder;
    if (!b || !b.site || !b.site.components) {
      return { error: "builder-not-ready" };
    }

    const snapshot = (component) => {
      if (!component) return null;
      return {
        id: component.id,
        title: component.embed?.title || "",
        location: component.embed?.code?.location || "",
        style: component.embed?.code?.style || "",
        defer: component.embed?.code?.defer ?? null,
        classes: component.settings?.element?.classes || "",
        content: component.type === "embed"
          ? component.embed?.code?.content || ""
          : component.settings?.element?.attributes || "",
      };
    };

    const before = [];
    const after = [];
    const protectedEntries = [];
    const serviceEntries = [];
    const changedIds = [];

    for (const id of protectedIds) {
      protectedEntries.push(snapshot(b.site.components[id]));
    }
    for (const id of serviceIds) {
      serviceEntries.push(snapshot(b.site.components[id]));
    }

    for (const spec of specs) {
      const component = b.site.components[spec.id];
      const isElementTarget = spec.kind === "element";
      if (!component || (!isElementTarget && component.type !== "embed")) {
        before.push({ id: spec.id, missing: true });
        after.push({ id: spec.id, missing: true });
        continue;
      }

      const existing = snapshot(component);
      before.push(existing);

      if (write) {
        if (isElementTarget) {
          component.settings = component.settings || {};
          component.settings.element = component.settings.element || {};
          component.settings.element.attributes = spec.attributes;
        } else {
          component.embed = component.embed || {};
          component.embed.title = spec.title;
          component.embed.code = component.embed.code || {};
          component.embed.code.content = spec.content;
        }
        changedIds.push(component.id);
      }

      after.push(snapshot(component));
    }

    if (write && changedIds.length) {
      b.site.markChanged("changeComponentProperty", { componentIds: changedIds });
      b.site.syncCanvas("change");
      b.ui.refresh("site");
    }

    return {
      before,
      after,
      protectedEntries,
      serviceEntries,
      dirtyPublishButton: !!document.querySelector('#menu [data-action="publish"].alert'),
    };
  })()`;

  const result = await evaluate(tab.webSocketDebuggerUrl, expression);
  if (result && result.error) {
    fail(result.error);
  }

  writeBackups(args.backupDir, result.before || []);

  const checks = targets.map((target, index) => {
    const beforeEntry = result.before[index];
    const afterEntry = result.after[index];
    const actualHash = afterEntry && !afterEntry.missing ? sha256(afterEntry.content || "") : null;
    return {
      id: target.id,
      kind: target.kind,
      title: afterEntry?.title || null,
      classes: afterEntry?.classes || null,
      location: afterEntry?.location || null,
      expectedClass: target.expectedClass,
      expectedHash: target.sha256,
      actualHash,
      matchesExpected: actualHash === target.sha256,
      classMatches: afterEntry?.classes === target.expectedClass,
      changed: !!beforeEntry && !!afterEntry && (beforeEntry.content || "") !== (afterEntry.content || ""),
      expectedContentLength: target.contentLength,
      actualContentLength: afterEntry?.content?.length ?? null,
      sourcePath: target.sourcePath,
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
      writeConfig: args.writeConfig,
    },
    protected: (result.protectedEntries || []).map((entry) => ({
      id: entry?.id || null,
      title: entry?.title || null,
      classes: entry?.classes || null,
      location: entry?.location || null,
      sha256: entry ? sha256(entry.content || "") : null,
      contentLength: entry?.content?.length ?? null,
    })),
    services: (result.serviceEntries || []).map((entry) => ({
      id: entry?.id || null,
      title: entry?.title || null,
      classes: entry?.classes || null,
      location: entry?.location || null,
      sha256: entry ? sha256(entry.content || "") : null,
      contentLength: entry?.content?.length ?? null,
    })),
    inputs: targets.map((target) => ({
      id: target.id,
      kind: target.kind,
      title: target.title,
      expectedClass: target.expectedClass,
      sourcePath: target.sourcePath,
      sha256: target.sha256,
      contentLength: target.contentLength,
    })),
    result: {
      dirtyPublishButton: !!result.dirtyPublishButton,
      checks,
    },
  };

  if (args.outJson) {
    ensureDir(path.dirname(args.outJson));
    fs.writeFileSync(args.outJson, JSON.stringify(output, null, 2), "utf8");
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
