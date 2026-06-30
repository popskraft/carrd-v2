import fs from "node:fs";

import { fetchDebugTabs, findMatchingSiteTab, evaluateTab } from "./cdp-client.mjs";
import {
  DEFAULT_ACTIVE_TEMPLATE_PATH,
  DEFAULT_REGISTRY_PATH,
  normalizeUrlLike,
  resolveSite
} from "../site-registry.mjs";

export function getProfileFreshness(profile) {
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
  if (profile.mcp?.enabled && profile.mcp?.targetMapPath) {
    requiredPaths.push(profile.mcp.targetMapPath);
  }

  const missing = requiredPaths.filter((filePath) => !fs.existsSync(filePath));
  if (missing.length) {
    return { status: "stale", reasons: missing.map((filePath) => `missing ${filePath}`) };
  }

  const manifestPath = profile.knowledgeStatusManifest;
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    return {
      status: "stale",
      reasons: [
        manifestPath
          ? `missing ${manifestPath}`
          : "profile has no knowledgeStatusManifest"
      ]
    };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return {
      status: "stale",
      reasons: [`invalid knowledge manifest: ${error.message}`]
    };
  }

  const staleAfterMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const domainEntries = Object.entries(manifest.knowledgeDomains || {});
  const staleDomains = domainEntries.flatMap(([domain, info]) => {
    const lastScanAt = info && typeof info === "object" ? info.lastScanAt : "";
    const scannedAt = Date.parse(lastScanAt || "");
    if (!Number.isFinite(scannedAt)) return [`${domain} has no valid lastScanAt`];
    const ageDays = Math.floor((now - scannedAt) / 86_400_000);
    return now - scannedAt > staleAfterMs ? [`${domain} scan is ${ageDays} days old`] : [];
  });

  if (!domainEntries.length) {
    return { status: "stale", reasons: ["knowledge manifest has no knowledgeDomains"] };
  }

  if (staleDomains.length) {
    return { status: "stale", reasons: staleDomains };
  }

  if (!requiredPaths.length) {
    return { status: "partial", reasons: ["profile has no tracked scan artifacts"] };
  }

  return { status: "fresh", reasons: [] };
}

function buildPageStateExpression() {
  return `({
    href: location.href,
    title: document.title,
    hasBuilder: !!window.app?.builder,
    hasComponents: !!window.app?.builder?.site?.components,
    hasPanelShowById: typeof window.app?.builder?.ui?.propertiesPanel?.showById === 'function',
    menuActions: document.querySelectorAll('#menu [data-action]').length
  })`;
}

export async function checkSiteReadiness(options = {}) {
  const port = String(options.port || process.env.CARRD_DEBUG_PORT || "9222");
  const resolved = resolveSite({
    registryPath: options.registryPath || options.registry || DEFAULT_REGISTRY_PATH,
    activeTemplatePath:
      options.activeTemplatePath === undefined
        ? options.activeTemplate || DEFAULT_ACTIVE_TEMPLATE_PATH
        : options.activeTemplatePath,
    siteRef: options.siteRef || options.site || ""
  });

  let connected = false;
  try {
    const versionResponse = await fetch(`http://127.0.0.1:${port}/json/version`);
    connected = versionResponse.ok;
  } catch {
    connected = false;
  }

  const tabs = connected ? await fetchDebugTabs(port) : [];
  const tab = connected ? findMatchingSiteTab(tabs, resolved.site) : null;
  const profileFreshness = getProfileFreshness(resolved.profile);

  let authenticated = false;
  let builderReady = false;
  let pageState = null;

  if (tab) {
    try {
      pageState = await evaluateTab(tab.webSocketDebuggerUrl, buildPageStateExpression());
      authenticated = Boolean(
        pageState?.hasBuilder && normalizeUrlLike(tab.url || "").includes("/dashboard/")
      );
      builderReady = Boolean(
        pageState?.hasBuilder &&
          pageState?.hasComponents &&
          pageState?.hasPanelShowById &&
          pageState?.menuActions > 0
      );
    } catch {
      authenticated = false;
      builderReady = false;
      pageState = null;
    }
  }

  const siteResolved = Boolean(tab);
  const safeToEdit =
    connected && authenticated && builderReady && siteResolved && profileFreshness.status === "fresh";

  return {
    port,
    resolved,
    connected,
    authenticated,
    builderReady,
    siteResolved,
    safeToEdit,
    profileFreshness,
    tab,
    pageState
  };
}
