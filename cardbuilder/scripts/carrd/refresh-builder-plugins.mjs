#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "../../..");
const ACTIVE_TEMPLATE_PATH = path.join(ROOT, "cardbuilder/data/active-template.json");

function parseArgs(argv) {
  const args = {
    port: process.env.CARRD_DEBUG_PORT || "9222",
    outJson: "",
    backupDir: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--port" && next) {
      args.port = next;
      i += 1;
    } else if (arg === "--out-json" && next) {
      args.outJson = next;
      i += 1;
    } else if (arg === "--backup-dir" && next) {
      args.backupDir = next;
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

async function getTabs(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) {
    fail(`Failed to read debug tabs: ${response.status}`);
  }
  return response.json();
}

function pickTab(tabs, builderUrl) {
  const matches = tabs.filter(
    (tab) => tab.type === "page" && String(tab.url || "") === builderUrl
  );
  if (matches.length === 0) {
    fail(`No Builder tab found for ${builderUrl}`);
  }
  return matches[0];
}

async function evaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
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
      ws.send(
        JSON.stringify({
          id: nextId++,
          method: "Page.bringToFront",
          params: {},
        })
      );

      ws.send(
        JSON.stringify({
          id: nextId++,
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
        const text =
          payload.result.exceptionDetails.text ||
          payload.result.result.description ||
          "Runtime.evaluate exception";
        finish(reject, new Error(text));
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

function buildSpecs() {
  const read = (filePath) => fs.readFileSync(filePath, "utf8");
  const wrapStyle = (css) => `<style>\n${css}\n</style>\n`;
  const wrapScript = (js) => `<script>\n${js}\n</script>\n`;

  return [
    {
      id: "embed02",
      title: "Theme Design System (in HEAD)",
      location: "head",
      content: read(path.join(ROOT, "dist/theme-design-system.html")),
      sourcePath: path.join(ROOT, "dist/theme-design-system.html"),
    },
    {
      id: "embed08",
      title: "No Load Waiting (in HEAD)",
      location: "head",
      content: read(path.join(ROOT, "dist/no-loadwaiting/no-loadwaiting-embed.html")),
      sourcePath: path.join(ROOT, "dist/no-loadwaiting/no-loadwaiting-embed.html"),
    },
    {
      id: "embed04",
      title: "Shopping Cart CSS",
      location: "body-end",
      content: wrapStyle(read(path.join(ROOT, "dist/shopping-cart/shopping-cart.min.css"))),
      sourcePath: path.join(ROOT, "dist/shopping-cart/shopping-cart.min.css"),
    },
    {
      id: "embed03",
      title: "Shopping Cart JS",
      location: "body-end",
      content: wrapScript(read(path.join(ROOT, "dist/shopping-cart/shopping-cart.min.js"))),
      sourcePath: path.join(ROOT, "dist/shopping-cart/shopping-cart.min.js"),
    },
    {
      id: "embed06",
      title: "Slider",
      location: "body-end",
      content: read(path.join(ROOT, "dist/slider/slider-embed.html")),
      sourcePath: path.join(ROOT, "dist/slider/slider-embed.html"),
    },
    {
      id: "embed05",
      title: "Cards",
      location: "body-end",
      content: read(path.join(ROOT, "dist/cards/cards-embed.html")),
      sourcePath: path.join(ROOT, "dist/cards/cards-embed.html"),
    },
    {
      id: "embed09",
      title: "Grid Cluster",
      location: "body-end",
      content: read(path.join(ROOT, "dist/grid-cluster/grid-cluster-embed.html")),
      sourcePath: path.join(ROOT, "dist/grid-cluster/grid-cluster-embed.html"),
    },
    {
      id: "embed07",
      title: "Modal",
      location: "body-end",
      content: read(path.join(ROOT, "dist/modal/modal-embed.html")),
      sourcePath: path.join(ROOT, "dist/modal/modal-embed.html"),
    },
    {
      id: "embed01",
      title: "FAQ",
      location: "body-end",
      content: read(path.join(ROOT, "dist/faq/faq-embed.html")),
      sourcePath: path.join(ROOT, "dist/faq/faq-embed.html"),
    },
    {
      title: "Typography",
      location: "body-end",
      afterId: "embed01",
      content: read(path.join(ROOT, "dist/typography/typography-embed.html")),
      sourcePath: path.join(ROOT, "dist/typography/typography-embed.html"),
    },
    {
      title: "Header Nav",
      location: "body-end",
      afterTitle: "Typography",
      content: read(path.join(ROOT, "dist/header-nav/header-nav-embed.html")),
      sourcePath: path.join(ROOT, "dist/header-nav/header-nav-embed.html"),
    },
  ].map((spec) => ({
    ...spec,
    sha256: sha256(spec.content),
  }));
}

function ensureDir(dirPath) {
  if (!dirPath) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeBackups(backupDir, beforeEntries) {
  if (!backupDir) return;
  ensureDir(backupDir);
  for (const entry of beforeEntries) {
    if (!entry || !entry.id) continue;
    fs.writeFileSync(
      path.join(backupDir, `${entry.id}-before.html`),
      entry.content || "",
      "utf8"
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = JSON.parse(fs.readFileSync(ACTIVE_TEMPLATE_PATH, "utf8"));
  const builderUrl = registry.builderUrl;
  const specs = buildSpecs();

  const tabs = await getTabs(args.port);
  const tab = pickTab(tabs, builderUrl);

  const payload = specs.map((spec) => ({
    id: spec.id || null,
    title: spec.title,
    location: spec.location,
    afterId: spec.afterId || null,
    afterTitle: spec.afterTitle || null,
    content: spec.content,
    sha256: spec.sha256,
    sourcePath: spec.sourcePath,
  }));

  const expression = `(() => {
    const specs = ${JSON.stringify(payload)};
    const b = window.app?.builder;
    if (!b?.site?.components) {
      return { error: "builder-not-ready" };
    }

    const getEmbed = (id) => {
      const component = id ? b.site.components[id] : null;
      if (!component || component.type !== "embed") return null;
      return component;
    };

    const findByTitle = (title) => {
      return Object.values(b.site.components).find((component) => {
        return component && component.type === "embed" && (component.embed?.title || "") === title;
      }) || null;
    };

    const snapshot = (component) => {
      if (!component) return null;
      return {
        id: component.id,
        title: component.embed?.title || "",
        location: component.embed?.code?.location || "",
        style: component.embed?.code?.style || "",
        defer: component.embed?.code?.defer ?? null,
        content: component.embed?.code?.content || "",
      };
    };

    const apply = (component, spec) => {
      component.embed = component.embed || {};
      component.embed.mode = "code";
      component.embed.title = spec.title;
      component.embed.code = component.embed.code || {};
      component.embed.code.content = spec.content;
      component.embed.code.location = spec.location;
      component.embed.code.style = "hidden";
      component.embed.code.defer = true;
      component.settings = component.settings || { element: { attributes: "", classes: "", id: "" } };
      component.settings.element = component.settings.element || { attributes: "", classes: "", id: "" };
    };

    const before = [];
    const applied = [];
    let cursorId = "embed01";

    for (const spec of specs) {
      let component = spec.id ? getEmbed(spec.id) : null;
      if (!component) {
        component = findByTitle(spec.title);
      }

      if (!component) {
        const refId = spec.afterTitle
          ? (findByTitle(spec.afterTitle)?.id || cursorId)
          : (spec.afterId || cursorId);
        const ref = b.site.get(refId);
        component = b.site.add("embed", undefined, undefined, undefined, ref, "after");
      }

      before.push(snapshot(component));
      apply(component, spec);
      cursorId = component.id;
      applied.push({
        id: component.id,
        title: spec.title,
        location: spec.location,
        sha256: spec.sha256,
      });
    }

    b.site.markChanged("changeComponentProperty", {
      componentIds: applied.map((entry) => entry.id),
    });
    b.site.syncCanvas("change");
    b.ui.refresh("site");

    const after = applied.map((entry) => {
      const component = getEmbed(entry.id);
      const state = snapshot(component);
      return {
        ...state,
        matchesSha: state ? ${JSON.stringify(
          Object.fromEntries(payload.map((spec) => [spec.title, spec.sha256]))
        )}[entry.title] === (window.crypto && window.crypto.subtle ? null : null) : false,
      };
    });

    return {
      before,
      applied,
      after,
      dirtyPublishButton: !!document.querySelector('#menu [data-action="publish"].alert'),
      topLevelEmbeds: Array.from(document.querySelectorAll('#canvas .--site-main > .--inner > .component-wrapper[data-id][data-type="embed"]')).map((el) => el.getAttribute('data-id')),
    };
  })()`;

  const result = await evaluate(tab.webSocketDebuggerUrl, expression);
  if (result && result.error) {
    fail(result.error);
  }

  const desiredById = new Map();
  for (const spec of specs) {
    if (spec.id) {
      desiredById.set(spec.id, spec);
    }
  }

  for (const entry of result.applied || []) {
    const byId = desiredById.get(entry.id);
    if (!byId) {
      const byTitle = specs.find((spec) => spec.title === entry.title);
      if (byTitle) desiredById.set(entry.id, byTitle);
    }
  }

  writeBackups(args.backupDir, result.before || []);

  const afterChecks = (result.after || []).map((entry) => {
    const spec = desiredById.get(entry.id);
    const actualHash = sha256(entry.content || "");
    return {
      id: entry.id,
      title: entry.title,
      location: entry.location,
      actualHash,
      expectedHash: spec ? spec.sha256 : null,
      matchesExpected: spec ? actualHash === spec.sha256 : false,
    };
  });

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      builderUrl,
      tabId: tab.id,
      title: tab.title,
    },
    inputs: specs.map((spec) => ({
      id: spec.id || null,
      title: spec.title,
      location: spec.location,
      sourcePath: spec.sourcePath,
      sha256: spec.sha256,
    })),
    result: {
      dirtyPublishButton: !!result.dirtyPublishButton,
      topLevelEmbeds: result.topLevelEmbeds || [],
      applied: result.applied || [],
      afterChecks,
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
