// Auto-onboarding pipeline: Builder URL -> inventory -> deterministic target
// map -> manifests -> readback sync -> write probe -> readiness verdict.
//
// Safety contract preserved end-to-end: no save/publish ever, dry-run first,
// mutation allowlists from a static catalog, readback via sync_profile.

import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_ACTIVE_TEMPLATE_PATH,
  DEFAULT_REGISTRY_PATH,
  REPO_ROOT,
  loadSiteProfile,
  normalizeUrlLike,
  readJsonFile,
  resolveSite
} from "../site-registry.mjs";
import { evaluateTab, fetchDebugTabs, findMatchingSiteTab } from "./cdp-client.mjs";
import { checkProfile, serializeRuntimePayload, syncProfile, updateTarget } from "./control-core.mjs";
import { generateTargets } from "./keygen.mjs";
import { checkSiteReadiness } from "./readiness-core.mjs";

const DEFAULT_PORT = process.env.CARRD_DEBUG_PORT || "9222";
export const DEFAULT_CATALOG_PATH = path.join(REPO_ROOT, "cardbuilder/data/mutation-catalog.json");
const STABILITY_MAX_ATTEMPTS = 3;

function fail(message) {
  throw new Error(message);
}

function toRepoRelative(absolutePath) {
  const relative = path.relative(REPO_ROOT, absolutePath);
  return relative.startsWith("..") ? absolutePath : relative;
}

function readRawJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function loadMutationCatalog(catalogPath = DEFAULT_CATALOG_PATH) {
  return readJsonFile(catalogPath);
}

// ---------------------------------------------------------------------------
// Inventory expressions (Runtime.evaluate payloads).
// ---------------------------------------------------------------------------

function buildProbesFromCatalog(catalog) {
  const listProbes = [];
  const textProbes = [];
  for (const [type, entry] of Object.entries(catalog.types || {})) {
    if (entry.listPath) {
      listProbes.push({ type, path: entry.listPath, segments: entry.listPath.split(".") });
    }
    if (entry.textSnippetPath) {
      textProbes.push({
        type,
        path: entry.textSnippetPath,
        segments: entry.textSnippetPath.split(".")
      });
    }
  }
  return { listProbes, textProbes };
}

function buildInventoryExpression(payload) {
  return `(() => {
    const payload = ${serializeRuntimePayload(payload)};
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getByPath = (root, segments) => {
      let cursor = root;
      for (const segment of segments) {
        if (cursor === null || cursor === undefined) return null;
        cursor = cursor[segment];
      }
      return cursor === undefined ? null : cursor;
    };
    const toClassList = (value) =>
      String(typeof value === "string" ? value : "")
        .split(/\\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
    const collectChildIds = (component) => {
      const groups = component?.container?.groups;
      if (!Array.isArray(groups)) return [];
      return groups.flatMap((group) => Array.isArray(group?.componentIds) ? group.componentIds : []);
    };
    const run = async () => {
      const builder = window.app?.builder;
      if (!builder?.site?.components) {
        return { error: "builder-not-ready" };
      }
      const propertiesPanel = builder.ui?.propertiesPanel || null;
      const canvasOrder = Array.from(
        document.querySelectorAll("#canvas .--site-main > .--inner > .component-wrapper[data-id]")
      ).map((node) => node.getAttribute("data-id")).filter(Boolean);

      const rows = [];
      for (const [componentId, component] of Object.entries(builder.site.components)) {
        if (!component || typeof component !== "object") continue;
        const componentType = component.type || "unknown";
        const row = {
          componentId,
          componentType,
          elementId: component.settings?.element?.id || "",
          classes: toClassList(component.settings?.element?.classes || ""),
          attributes: component.settings?.element?.attributes || "",
          childIds: collectChildIds(component),
          topLevelIndex: canvasOrder.indexOf(componentId),
          textSnippet: "",
          listCounts: {},
          tabs: []
        };

        for (const probe of payload.textProbes) {
          if (probe.type !== componentType) continue;
          const value = getByPath(component, probe.segments);
          if (typeof value === "string" && value.trim()) {
            row.textSnippet = value.replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 80);
          }
        }
        if (!row.textSnippet) {
          const wrapper = document.querySelector(
            '#canvas .component-wrapper[data-id="' + componentId + '"]'
          );
          if (wrapper) {
            row.textSnippet = (wrapper.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80);
          }
        }

        for (const probe of payload.listProbes) {
          if (probe.type !== componentType) continue;
          const value = getByPath(component, probe.segments);
          if (Array.isArray(value)) {
            row.listCounts[probe.path] = value.length;
          }
        }

        if (payload.panelProbe && propertiesPanel && typeof propertiesPanel.showById === "function") {
          try {
            propertiesPanel.showById(componentId, true);
            await sleep(payload.panelDelayMs);
            row.tabs = Array.from(document.querySelectorAll("#properties-panel header li"))
              .map((node) => (node.textContent || "").replace(/\\s+/g, " ").trim())
              .filter(Boolean);
          } catch {
            row.tabs = [];
          }
        }

        rows.push(row);
      }

      rows.sort((left, right) => left.componentId.localeCompare(right.componentId));
      return {
        components: rows,
        canvasOrder,
        totalComponents: rows.length,
        generatedAt: new Date().toISOString()
      };
    };
    return run();
  })()`;
}

function inventorySignature(inventory) {
  return JSON.stringify(
    inventory.components.map((row) => ({
      id: row.componentId,
      type: row.componentType,
      childIds: row.childIds
    }))
  );
}

async function evaluateAgainstSite(site, port, expression) {
  const tabs = await fetchDebugTabs(port);
  const tab = findMatchingSiteTab(tabs, site);
  if (!tab) {
    fail(`No Builder tab found for ${site.builderUrl}`);
  }
  const value = await evaluateTab(tab.webSocketDebuggerUrl, expression);
  if (value?.error) {
    fail(`Inventory failed: ${value.error}`);
  }
  return { tab, value };
}

export async function collectInventory({ site, port, catalog, panelProbe = true, panelDelayMs = 140 }) {
  const probes = buildProbesFromCatalog(catalog);
  const lightPayload = { ...probes, panelProbe: false, panelDelayMs };

  // Stability loop: two consecutive light scans must agree on the component set.
  let stable = null;
  let attempts = 0;
  let previousSignature = null;
  while (attempts < STABILITY_MAX_ATTEMPTS) {
    attempts += 1;
    const { value } = await evaluateAgainstSite(site, port, buildInventoryExpression(lightPayload));
    const signature = inventorySignature(value);
    if (previousSignature !== null && signature === previousSignature) {
      stable = value;
      break;
    }
    previousSignature = signature;
  }
  if (!stable) {
    fail(`inventory-unstable: component set kept changing across ${STABILITY_MAX_ATTEMPTS} scans.`);
  }

  if (!panelProbe) {
    return { inventory: stable, stabilityAttempts: attempts };
  }

  const fullPayload = { ...probes, panelProbe: true, panelDelayMs };
  const { value: full } = await evaluateAgainstSite(site, port, buildInventoryExpression(fullPayload));
  if (inventorySignature(full) !== inventorySignature(stable)) {
    fail("inventory-unstable: component set changed during panel probe pass.");
  }
  return { inventory: full, stabilityAttempts: attempts };
}

// ---------------------------------------------------------------------------
// New-site registration (operator supplies slug + chromeProfileDir).
// ---------------------------------------------------------------------------

export function registerSite({
  builderUrl,
  slug,
  chromeProfileDir,
  publishedSiteUrl = "",
  registryPath = DEFAULT_REGISTRY_PATH
}) {
  if (!String(builderUrl || "").trim()) fail("registerSite requires builderUrl.");
  if (!String(slug || "").trim()) fail("registerSite requires slug (operator input).");
  if (!String(chromeProfileDir || "").trim()) {
    fail("registerSite requires chromeProfileDir (operator input; profiles are per-site).");
  }

  const registry = readRawJson(registryPath);
  if (registry.some((entry) => entry.siteSlug === slug)) {
    fail(`Site slug already registered: ${slug}`);
  }

  const workspaceRel = `cardbuilder/projects/${slug}`;
  const manifestsRel = `${workspaceRel}/data/manifests`;
  const snapshotsRel = `${workspaceRel}/data/snapshots`;
  fs.mkdirSync(path.join(REPO_ROOT, manifestsRel), { recursive: true });
  fs.mkdirSync(path.join(REPO_ROOT, snapshotsRel), { recursive: true });

  const now = new Date().toISOString();
  const knowledgeStatusRel = `${manifestsRel}/knowledge-status.json`;
  writeJson(path.join(REPO_ROOT, knowledgeStatusRel), {
    templateId: slug,
    builderUrl,
    publishedSiteUrl,
    knowledgePolicyVersion: 1,
    knowledgeDomains: {
      builderStatic: { status: "onboarding-bootstrap", lastScanAt: now },
      templateInstance: { status: "onboarding-bootstrap", lastScanAt: now }
    },
    status: "onboarding-bootstrap",
    reason: "Created by onboard-site; no automated save or publish was performed."
  });

  const profileRel = `${manifestsRel}/site-profile.json`;
  const targetMapRel = `${manifestsRel}/mcp-targets.json`;
  writeJson(path.join(REPO_ROOT, profileRel), {
    siteSlug: slug,
    templateId: slug,
    builderUrl,
    publishedSiteUrl,
    projectWorkspace: workspaceRel,
    knowledgeStatusManifest: knowledgeStatusRel,
    structure: {
      builderScan: `${snapshotsRel}/onboarding-inventory.json`
    },
    mcp: {
      enabled: true,
      protocol: "stdio",
      serverEntry: "cardbuilder/scripts/carrd/carrd-mcp-server.mjs",
      targetMapPath: targetMapRel,
      semanticNamespace: "cx",
      contractMode: "auto-onboarding-pending",
      notes: ["Created by onboard-site."]
    },
    capabilities: {
      scan: "state-read",
      contentPatch: "ui-automation",
      layoutMutation: "ui-automation",
      publish: "operator-only"
    },
    caveats: ["Publish remains operator-only."],
    status: "onboarding-bootstrap"
  });

  writeJson(path.join(REPO_ROOT, targetMapRel), {
    meta: {
      version: 1,
      siteSlug: slug,
      semanticNamespace: "cx",
      contractMode: "auto-onboarding-pending",
      targetCount: 0
    },
    targets: []
  });

  registry.push({
    siteSlug: slug,
    templateId: slug,
    kind: "live-site",
    builderUrl,
    publishedSiteUrl,
    projectWorkspace: workspaceRel,
    knowledgeStatusManifest: knowledgeStatusRel,
    profilePath: profileRel,
    chromeProfileDir,
    pluginSourceRoot: "src",
    pluginDistRoot: "dist",
    runtimeMode: "devtools-first",
    savePublishPolicy: "operator-only",
    status: "onboarding"
  });
  writeJson(registryPath, registry);

  return { siteSlug: slug, registryPath, profilePath: profileRel, targetMapPath: targetMapRel };
}

// ---------------------------------------------------------------------------
// Coverage + deep readiness.
// ---------------------------------------------------------------------------

export function computeCoverage({ inventory, targetMap }) {
  const liveIds = new Set(inventory.components.map((row) => row.componentId));
  const mappedIds = new Set((targetMap.targets || []).map((target) => target.componentId));
  const unmappedIds = new Set((targetMap.unmapped || []).map((item) => item.componentId));

  const missing = [...liveIds].filter((id) => !mappedIds.has(id) && !unmappedIds.has(id)).sort();
  const stale = [...mappedIds].filter((id) => !liveIds.has(id)).sort();

  return {
    liveComponents: liveIds.size,
    mapped: mappedIds.size,
    unmapped: unmappedIds.size,
    missing,
    stale,
    complete: missing.length === 0 && stale.length === 0
  };
}

function buildReadinessStatus({ readiness, contract, coverage, profile, targetCount }) {
  const reasons = [];
  if (!readiness.connected) reasons.push("cdp-not-connected");
  if (readiness.connected && !readiness.siteResolved) reasons.push("builder-tab-not-found");
  if (readiness.siteResolved && !readiness.builderReady) reasons.push("builder-not-ready");
  if (contract && contract.status !== "pass") reasons.push("contract-drift");
  if (readiness.profileFreshness?.status !== "fresh") reasons.push("knowledge-stale");
  if (!targetCount) reasons.push("no-targets");
  if (coverage && !coverage.complete) reasons.push("coverage-incomplete");

  const writable = profile?.capabilities?.contentPatch === "state-write";
  if (!reasons.length && !writable) reasons.push("content-patch-not-enabled");

  return {
    status: reasons.length ? "not-ready" : "fully-mapped-safe-to-control",
    reasons
  };
}

export async function checkProfileDeep(options = {}) {
  const base = await checkProfile(options);
  const resolved = resolveSite({
    registryPath: options.registryPath || options.registry || DEFAULT_REGISTRY_PATH,
    activeTemplatePath:
      options.activeTemplatePath === undefined
        ? options.activeTemplate || DEFAULT_ACTIVE_TEMPLATE_PATH
        : options.activeTemplatePath,
    siteRef: options.siteRef || options.site || ""
  });

  const readiness = await checkSiteReadiness(options);
  const contract = readiness.pageState
    ? {
        status:
          readiness.pageState.hasBuilder &&
          readiness.pageState.hasComponents &&
          readiness.pageState.hasPanelShowById &&
          readiness.pageState.hasPropertiesPanelHeader &&
          readiness.pageState.menuActions > 0 &&
          readiness.pageState.canvasWrappers > 0
            ? "pass"
            : "drift",
        probes: {
          hasBuilder: Boolean(readiness.pageState.hasBuilder),
          hasComponents: Boolean(readiness.pageState.hasComponents),
          hasPanelShowById: Boolean(readiness.pageState.hasPanelShowById),
          hasPropertiesPanelHeader: Boolean(readiness.pageState.hasPropertiesPanelHeader),
          menuActions: readiness.pageState.menuActions || 0,
          canvasWrappers: readiness.pageState.canvasWrappers || 0
        }
      }
    : { status: "unavailable", probes: null };

  let coverage = null;
  if (
    readiness.builderReady &&
    resolved.profile?.mcp?.enabled &&
    fs.existsSync(resolved.profile.mcp.targetMapPath)
  ) {
    const catalog = loadMutationCatalog(options.catalogPath);
    const targetMap = readRawJson(resolved.profile.mcp.targetMapPath);
    const { inventory } = await collectInventory({
      site: resolved.site,
      port: String(options.port || DEFAULT_PORT),
      catalog,
      panelProbe: false
    });
    coverage = computeCoverage({ inventory, targetMap });
  }

  const readinessStatus = buildReadinessStatus({
    readiness,
    contract: contract.status === "unavailable" ? null : contract,
    coverage,
    profile: resolved.profile,
    targetCount: base.targetCount
  });

  return {
    ...base,
    contractCheck: contract,
    coverage,
    readinessStatus: readinessStatus.status,
    readinessReasons: readinessStatus.reasons
  };
}

// ---------------------------------------------------------------------------
// Write probe: verifies the write machinery without mutating anything.
// ---------------------------------------------------------------------------

function buildWriteProbeExpression(payload) {
  return `(() => {
    const payload = ${serializeRuntimePayload(payload)};
    const builder = window.app?.builder;
    if (!builder?.site?.components) return { error: "builder-not-ready" };
    const component = builder.site.components[payload.componentId];
    if (!component) return { error: "missing-component" };
    let cursor = component;
    for (const segment of payload.segments) {
      if (cursor === null || cursor === undefined) break;
      cursor = cursor[segment];
    }
    return {
      ok: true,
      pathReadable: cursor !== undefined,
      canMarkChanged: typeof builder.site?.markChanged === "function",
      hasHistory: Boolean(builder.history)
    };
  })()`;
}

export async function runWriteProbe({ site, port, target }) {
  const probePath = "settings.element.classes";
  const { value } = await evaluateAgainstSite(
    site,
    port,
    buildWriteProbeExpression({
      componentId: target.componentId,
      segments: probePath.split(".")
    })
  );
  return {
    target: target.semanticKey,
    path: probePath,
    passed: Boolean(value?.ok && value.pathReadable && value.canMarkChanged),
    details: value
  };
}

// ---------------------------------------------------------------------------
// Manifest updates (raw file IO keeps repo-relative paths intact).
// ---------------------------------------------------------------------------

function updateProfileFile(profilePathAbs, mutator) {
  const raw = readRawJson(profilePathAbs);
  const next = mutator(raw) || raw;
  writeJson(profilePathAbs, next);
  return next;
}

function touchKnowledgeStatus(manifestPathAbs, statusLabel) {
  const now = new Date().toISOString();
  const raw = readRawJson(manifestPathAbs);
  raw.knowledgeDomains = raw.knowledgeDomains || {};
  for (const domain of Object.keys(raw.knowledgeDomains)) {
    raw.knowledgeDomains[domain] = {
      ...raw.knowledgeDomains[domain],
      status: statusLabel,
      lastScanAt: now
    };
  }
  raw.lastPartialScanAt = now;
  raw.status = statusLabel;
  writeJson(manifestPathAbs, raw);
}

// ---------------------------------------------------------------------------
// Orchestration.
// ---------------------------------------------------------------------------

export async function onboardSite(options = {}) {
  const port = String(options.port || DEFAULT_PORT);
  const dryRun = options.dryRun !== false;
  const autoEnableWrite = options.autoEnableWrite !== false;
  const panelProbe = options.panelProbe !== false;
  const registryPath = options.registryPath || options.registry || DEFAULT_REGISTRY_PATH;
  const activeTemplatePath =
    options.activeTemplatePath === undefined
      ? options.activeTemplate || DEFAULT_ACTIVE_TEMPLATE_PATH
      : options.activeTemplatePath;
  const catalog = loadMutationCatalog(options.catalogPath);

  const report = {
    dryRun,
    startedAt: new Date().toISOString(),
    steps: []
  };
  const step = (name, data) => report.steps.push({ step: name, ...data });

  // 1. Resolve or register.
  let resolved = null;
  try {
    resolved = resolveSite({
      registryPath,
      activeTemplatePath,
      siteRef: options.siteRef || options.site || "",
      builderUrl: options.builderUrl || ""
    });
    // resolveSite falls back to the active template when no explicit ref
    // matches; an explicit builderUrl must never silently onboard another site.
    if (
      String(options.builderUrl || "").trim() &&
      !String(options.siteRef || options.site || "").trim() &&
      normalizeUrlLike(resolved.site.builderUrl) !== normalizeUrlLike(options.builderUrl)
    ) {
      resolved = null;
    } else {
      step("resolve", { matchedBy: resolved.matchedBy, siteSlug: resolved.site.siteSlug });
    }
  } catch {
    resolved = null;
  }

  if (!resolved) {
    if (!String(options.builderUrl || "").trim()) {
      fail("Unknown site: pass a registered site ref or a builderUrl to onboard.");
    }
    const missing = [];
    if (!String(options.slug || "").trim()) missing.push("slug");
    if (!String(options.chromeProfileDir || "").trim()) missing.push("chromeProfileDir");
    if (missing.length) {
      return {
        ...report,
        status: "operator-input-required",
        needed: missing,
        message:
          `New site registration requires operator input: ${missing.join(", ")}. ` +
          "chromeProfileDir must be a dedicated Chrome debug profile for this site."
      };
    }
    if (dryRun) {
      step("register", { planned: true, slug: options.slug });
      return {
        ...report,
        status: "dry-run-registration-planned",
        message: "Re-run with dryRun=false to register the site and generate manifests."
      };
    }
    const registration = registerSite({
      builderUrl: options.builderUrl,
      slug: options.slug,
      chromeProfileDir: options.chromeProfileDir,
      publishedSiteUrl: options.publishedSiteUrl || "",
      registryPath
    });
    step("register", registration);
    resolved = resolveSite({ registryPath, activeTemplatePath, siteRef: options.slug });
  }

  const site = resolved.site;
  const siteSlug = site.siteSlug;
  report.siteSlug = siteSlug;

  // 2. Builder readiness (connection + contract surface).
  const readiness = await checkSiteReadiness({
    site: siteSlug,
    port,
    registryPath,
    activeTemplatePath
  });
  step("readiness", {
    connected: readiness.connected,
    siteResolved: readiness.siteResolved,
    builderReady: readiness.builderReady
  });
  if (!readiness.connected || !readiness.siteResolved || !readiness.builderReady) {
    return {
      ...report,
      status: "builder-unavailable",
      message:
        "Builder tab is not reachable. Operator must start debug Chrome " +
        "(open-debug-chrome.sh), log in to Carrd, and open the Builder tab.",
      readiness: {
        connected: readiness.connected,
        siteResolved: readiness.siteResolved,
        builderReady: readiness.builderReady,
        pageState: readiness.pageState
      }
    };
  }

  // 3. Inventory with stability check.
  const { inventory, stabilityAttempts } = await collectInventory({
    site,
    port,
    catalog,
    panelProbe
  });
  step("inventory", {
    components: inventory.totalComponents,
    stabilityAttempts,
    panelProbe
  });

  // 4. Snapshot.
  const profile = loadSiteProfile(site.profilePath);
  const snapshotAbs = path.join(
    REPO_ROOT,
    `cardbuilder/projects/${siteSlug}/data/snapshots/onboarding-inventory.json`
  );
  if (!dryRun) {
    writeJson(snapshotAbs, inventory);
    step("snapshot", { path: toRepoRelative(snapshotAbs) });
  }

  // 5. Deterministic target generation (idempotent merge with existing map).
  const targetMapAbs = profile.mcp?.targetMapPath;
  if (!targetMapAbs) fail(`Site "${siteSlug}" profile has no mcp.targetMapPath.`);
  const existingMap = fs.existsSync(targetMapAbs) ? readRawJson(targetMapAbs) : null;
  const generation = generateTargets({
    inventory,
    catalog,
    existingMap,
    semanticNamespace: profile.mcp?.semanticNamespace || "cx"
  });
  step("generate", generation.stats);

  const nextTargetMap = {
    meta: {
      version: 1,
      siteSlug,
      semanticNamespace: profile.mcp?.semanticNamespace || "cx",
      contractMode: "auto-onboarded",
      generator: "onboard-site",
      generatedAt: inventory.generatedAt,
      targetCount: generation.targets.length,
      coverage: generation.stats,
      liveBuilderUrl: site.builderUrl,
      notes: [
        "Auto-generated deterministic MCP target map.",
        "Re-running onboard-site is idempotent: semanticKeys are preserved by componentId."
      ]
    },
    targets: generation.targets,
    unmapped: generation.unmapped
  };

  if (dryRun) {
    const coverage = computeCoverage({ inventory, targetMap: nextTargetMap });
    return {
      ...report,
      status: "dry-run-complete",
      coverage,
      generation: generation.stats,
      removedTargets: generation.removed,
      unmapped: generation.unmapped,
      message: "Dry run: no files written. Re-run with dryRun=false to persist."
    };
  }

  writeJson(targetMapAbs, nextTargetMap);
  step("write-target-map", {
    path: toRepoRelative(targetMapAbs),
    targets: generation.targets.length,
    unmapped: generation.unmapped.length
  });

  // 6. Profile + knowledge manifest updates.
  updateProfileFile(site.profilePath, (raw) => {
    raw.mcp = raw.mcp || {};
    raw.mcp.enabled = true;
    raw.mcp.contractMode = "auto-onboarded";
    raw.structure = raw.structure || {};
    raw.structure.builderScan =
      raw.structure.builderScan || toRepoRelative(snapshotAbs);
    raw.status = "mcp-auto-onboarded";
    return raw;
  });
  touchKnowledgeStatus(site.knowledgeStatusManifest, "mcp-auto-onboarded");
  step("update-manifests", { profile: toRepoRelative(site.profilePath) });

  // 7. Readback sync (separate live pass fills live.* and verifies existence).
  const sync = await syncProfile({
    site: siteSlug,
    port,
    write: true,
    registryPath,
    activeTemplatePath
  });
  const missingLive = sync.result.filter((target) => target.live && !target.live.exists);
  step("readback-sync", { synced: sync.result.length, missingLive: missingLive.length });
  if (missingLive.length) {
    return {
      ...report,
      status: "readback-failed",
      missingLive: missingLive.map((target) => target.semanticKey),
      message: "Some generated targets did not resolve on readback; site not marked safe."
    };
  }

  // 8. Write probe, then owner-approved auto-enable of state-write.
  let writeProbe = null;
  if (generation.targets.length) {
    writeProbe = await runWriteProbe({ site, port, target: generation.targets[0] });
    step("write-probe", writeProbe);

    if (writeProbe.passed && autoEnableWrite) {
      updateProfileFile(site.profilePath, (raw) => {
        raw.capabilities = raw.capabilities || {};
        raw.capabilities.contentPatch = "state-write";
        return raw;
      });
      // Official dry-run through the guarded path as final validation.
      const probeTarget = generation.targets[0];
      const dryRunUpdate = await updateTarget({
        site: siteSlug,
        port,
        registryPath,
        activeTemplatePath,
        semanticKey: probeTarget.semanticKey,
        path: "settings.element.classes",
        value: (probeTarget.existingClasses || []).join(" "),
        commit: false
      });
      step("write-dry-run", {
        preflightPassed: dryRunUpdate.mutation?.preflightPassed !== false,
        dryRun: dryRunUpdate.result?.dryRun !== false
      });
    }
  }

  // 9. Final deep readiness verdict.
  const deep = await checkProfileDeep({
    site: siteSlug,
    port,
    registryPath,
    activeTemplatePath,
    catalogPath: options.catalogPath
  });
  step("final-check", {
    readinessStatus: deep.readinessStatus,
    reasons: deep.readinessReasons
  });

  return {
    ...report,
    status:
      deep.readinessStatus === "fully-mapped-safe-to-control"
        ? "site-fully-mapped-safe-to-control"
        : "onboarded-with-warnings",
    coverage: deep.coverage,
    contractCheck: deep.contractCheck,
    readinessStatus: deep.readinessStatus,
    readinessReasons: deep.readinessReasons,
    generation: generation.stats,
    removedTargets: generation.removed,
    unmapped: generation.unmapped,
    writeProbe,
    files: {
      snapshot: toRepoRelative(snapshotAbs),
      targetMap: toRepoRelative(targetMapAbs),
      profile: toRepoRelative(site.profilePath)
    }
  };
}
