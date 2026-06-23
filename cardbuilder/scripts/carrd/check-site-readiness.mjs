#!/usr/bin/env node

import fs from "node:fs";
import {
  DEFAULT_ACTIVE_TEMPLATE_PATH,
  DEFAULT_REGISTRY_PATH,
  normalizeUrlLike,
  resolveSite
} from "./site-registry.mjs";

function parseArgs(argv) {
  const args = {
    port: process.env.CARRD_DEBUG_PORT || "9222",
    site: "",
    registry: DEFAULT_REGISTRY_PATH,
    activeTemplate: DEFAULT_ACTIVE_TEMPLATE_PATH,
    noFail: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--port" && next) {
      args.port = next;
      i += 1;
    } else if (arg === "--site" && next) {
      args.site = next;
      i += 1;
    } else if (arg === "--registry" && next) {
      args.registry = next;
      i += 1;
    } else if (arg === "--active-template" && next) {
      args.activeTemplate = next;
      i += 1;
    } else if (arg === "--no-fail") {
      args.noFail = true;
    }
  }

  return args;
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

async function getTabs(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) {
    fail(`Failed to read debug tabs: ${response.status}`);
  }
  return response.json();
}

function findMatchingTab(tabs, site) {
  const target = normalizeUrlLike(site.builderUrl || "");
  const published = normalizeUrlLike(site.publishedSiteUrl || "");

  const pages = tabs.filter((tab) => tab.type === "page");
  const matches = pages.filter((tab) => {
    const tabUrl = normalizeUrlLike(tab.url || "");
    return (target && tabUrl.includes(target)) || (published && tabUrl.includes(published));
  });

  return matches[0] || null;
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
          params: {}
        })
      );

      ws.send(
        JSON.stringify({
          id: nextId++,
          method: "Runtime.evaluate",
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true
          }
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

      if (payload.result && payload.result.result) {
        if (payload.result.exceptionDetails) {
          const text =
            payload.result.exceptionDetails.text ||
            payload.result.result.description ||
            "Runtime.evaluate exception";
          finish(reject, new Error(text));
          return;
        }

        finish(resolve, payload.result.result.value);
      }
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

function getFreshness(profile) {
  if (!profile) {
    return { status: "missing", reasons: ["profile missing"] };
  }

  if (profile.status === "automation-first") {
    return { status: "stale", reasons: ["automation-first profile"] };
  }

  const requiredPaths = [];
  if (profile.structure && typeof profile.structure === "object") {
    for (const key of ["builderScan", "domAudit", "tabsMap", "styleMap"]) {
      if (profile.structure[key]) requiredPaths.push(profile.structure[key]);
    }
  }
  if (profile.runtimeAssets && typeof profile.runtimeAssets === "object") {
    for (const key of ["liveInventory", "syncDiff"]) {
      if (profile.runtimeAssets[key]) requiredPaths.push(profile.runtimeAssets[key]);
    }
  }

  const missing = requiredPaths.filter((filePath) => !fs.existsSync(filePath));
  if (missing.length) {
    return { status: "stale", reasons: missing.map((filePath) => `missing ${filePath}`) };
  }

  if (!requiredPaths.length) {
    return { status: "partial", reasons: ["profile has no tracked scan artifacts"] };
  }

  return { status: "fresh", reasons: [] };
}

function line(name, value) {
  console.log(`${name}: ${value}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const resolved = resolveSite({
    registryPath: args.registry,
    activeTemplatePath: args.activeTemplate,
    siteRef: args.site
  });

  let connected = false;
  try {
    const versionResponse = await fetch(`http://127.0.0.1:${args.port}/json/version`);
    connected = versionResponse.ok;
  } catch {
    connected = false;
  }

  const tabs = connected ? await getTabs(args.port) : [];
  const tab = connected ? findMatchingTab(tabs, resolved.site) : null;
  const profileFreshness = getFreshness(resolved.profile);

  let authenticated = false;
  let builderReady = false;

  if (tab) {
    try {
      const pageState = await evaluate(
        tab.webSocketDebuggerUrl,
        `({
          href: location.href,
          title: document.title,
          hasBuilder: !!window.app?.builder,
          hasComponents: !!window.app?.builder?.site?.components,
          hasPanelShowById: typeof window.app?.builder?.ui?.propertiesPanel?.showById === 'function',
          menuActions: document.querySelectorAll('#menu [data-action]').length
        })`
      );

      authenticated = Boolean(pageState.hasBuilder && normalizeUrlLike(tab.url || "").includes("/dashboard/"));
      builderReady = Boolean(
        pageState.hasBuilder &&
          pageState.hasComponents &&
          pageState.hasPanelShowById &&
          pageState.menuActions > 0
      );
    } catch {
      authenticated = false;
      builderReady = false;
    }
  }

  const siteResolved = Boolean(tab);
  const safeToEdit =
    connected && authenticated && builderReady && siteResolved && profileFreshness.status === "fresh";

  line("connected", connected ? "true" : "false");
  line("authenticated", authenticated ? "true" : "false");
  line("builder-ready", builderReady ? "true" : "false");
  line("site-resolved", siteResolved ? "true" : "false");
  line("profile-freshness", profileFreshness.status);
  line("safe-to-edit", safeToEdit ? "true" : "false");
  line("site", resolved.site.siteSlug);
  line("matched-by", resolved.matchedBy);

  if (tab) {
    line("tab", `${tab.title || ""} | ${tab.url || ""}`);
  }

  if (!safeToEdit && !args.noFail) {
    process.exit(1);
  }
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
