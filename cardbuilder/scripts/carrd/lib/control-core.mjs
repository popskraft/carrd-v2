import fs from "node:fs";

import {
  DEFAULT_ACTIVE_TEMPLATE_PATH,
  DEFAULT_REGISTRY_PATH,
  loadRegistry,
  loadSiteProfile,
  resolveSite
} from "../site-registry.mjs";
import { fetchDebugTabs, findMatchingSiteTab, evaluateTab } from "./cdp-client.mjs";
import { checkSiteReadiness } from "./readiness-core.mjs";
import {
  getAllowedMutation,
  loadMcpTargetMap,
  resolveTargetDefinition,
  summarizeTarget
} from "./target-map.mjs";

const DEFAULT_PORT = process.env.CARRD_DEBUG_PORT || "9222";

function fail(message) {
  throw new Error(message);
}

export function parsePath(path) {
  const raw = String(path || "").trim();
  if (!raw) fail("Path is required.");

  const segments = [];
  const pattern = /([^[.\]]+)|\[(\d+)\]/g;
  let match;
  while ((match = pattern.exec(raw))) {
    if (match[1]) {
      segments.push(match[1]);
    } else if (match[2]) {
      segments.push(Number(match[2]));
    }
  }

  if (!segments.length) {
    fail(`Invalid path: ${path}`);
  }

  return segments;
}

function uniquePaths(target) {
  return Array.from(
    new Set([
      ...(Array.isArray(target.readPaths) ? target.readPaths : []),
      ...(Array.isArray(target.allowedMutations)
        ? target.allowedMutations.map((item) => item.path)
        : [])
    ])
  );
}

function compareValues(left, right) {
  if (typeof left === "string" || typeof right === "string") {
    return String(left ?? "").replace(/\r\n/g, "\n") === String(right ?? "").replace(/\r\n/g, "\n");
  }
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function validateMutationValue(mutation, value) {
  if (!mutation?.valueType) return;
  const actualType = Array.isArray(value) ? "array" : typeof value;
  if (actualType !== mutation.valueType) {
    fail(`Mutation path ${mutation.path} expects ${mutation.valueType}, got ${actualType}.`);
  }
}

function resolveProfileContext(options = {}) {
  const resolved = resolveSite({
    registryPath: options.registryPath || options.registry || DEFAULT_REGISTRY_PATH,
    activeTemplatePath:
      options.activeTemplatePath === undefined
        ? options.activeTemplate || DEFAULT_ACTIVE_TEMPLATE_PATH
        : options.activeTemplatePath,
    siteRef: options.siteRef || options.site || ""
  });

  if (!resolved.profile?.mcp?.enabled) {
    fail(`Site "${resolved.site.siteSlug}" does not have MCP enabled in site-profile.`);
  }

  const targetMap = loadMcpTargetMap(resolved.profile);
  return { resolved, targetMap };
}

export function serializeRuntimePayload(payload) {
  // JSON.stringify leaves U+2028/U+2029 unescaped; both are valid JSON but
  // terminate JS string literals inside Runtime.evaluate expressions.
  return JSON.stringify(payload)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function buildRuntimeExpression(payload) {
  return `(() => {
    const payload = ${serializeRuntimePayload(payload)};
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const listToString = (value) => typeof value === "string" ? value : "";
    const normalizeValue = (value) => value === undefined ? null : value;
    const getByPath = (root, segments) => {
      let cursor = root;
      for (const segment of segments) {
        if (cursor === null || cursor === undefined) return null;
        cursor = cursor[segment];
      }
      return normalizeValue(cursor);
    };
    const setByPath = (root, segments, value) => {
      let cursor = root;
      for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        const next = segments[index + 1];
        if (cursor[segment] === undefined || cursor[segment] === null) {
          cursor[segment] = typeof next === "number" ? [] : {};
        }
        cursor = cursor[segment];
      }
      cursor[segments[segments.length - 1]] = value;
    };
    const compareValues = (left, right) => {
      if (typeof left === "string" || typeof right === "string") {
        return String(left ?? "").replace(/\\r\\n/g, "\\n") === String(right ?? "").replace(/\\r\\n/g, "\\n");
      }
      return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
    };
    const collectTabs = async (propertiesPanel, componentId) => {
      if (!propertiesPanel || typeof propertiesPanel.showById !== "function") {
        return { tabs: [], shownId: null, shownType: null };
      }
      try {
        propertiesPanel.showById(componentId, true);
        await sleep(140);
      } catch {
        return { tabs: [], shownId: null, shownType: null };
      }
      return {
        tabs: Array.from(document.querySelectorAll("#properties-panel header li"))
          .map((node) => (node.textContent || "").replace(/\\s+/g, " ").trim())
          .filter(Boolean),
        shownId: propertiesPanel.component?.id || null,
        shownType: propertiesPanel.component?.type || null
      };
    };
    const collectTopLevelIndex = (componentId) => {
      const wrappers = Array.from(
        document.querySelectorAll("#canvas .--site-main > .--inner > .component-wrapper[data-id]")
      );
      return wrappers.findIndex((node) => node.getAttribute("data-id") === componentId);
    };
    const collectChildIds = (component) => {
      const groups = component?.container?.groups;
      if (!Array.isArray(groups)) return [];
      return groups.flatMap((group) => Array.isArray(group?.componentIds) ? group.componentIds : []);
    };
    const toClassList = (value) =>
      listToString(value)
        .split(/\\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
    const snapshotComponent = async (component, propertiesPanel) => {
      const panel = await collectTabs(propertiesPanel, component.id);
      return {
        componentId: component.id,
        componentType: component.type || null,
        elementId: component.settings?.element?.id || "",
        classes: toClassList(component.settings?.element?.classes || ""),
        attributes: component.settings?.element?.attributes || "",
        childIds: collectChildIds(component),
        topLevelIndex: collectTopLevelIndex(component.id),
        tabs: panel.tabs,
        shownId: panel.shownId,
        shownType: panel.shownType
      };
    };
    const markChanged = (builder, componentIds) => {
      if (!Array.isArray(componentIds) || !componentIds.length) return;
      if (builder.history?.add) {
        builder.history.add({
          type: "changeComponentProperty",
          componentIds
        });
      }
      builder.site.markChanged("changeComponentProperty", { componentIds });
      builder.site.syncCanvas?.("change");
      builder.ui.refresh?.("site");
    };
    const run = async () => {
      const builder = window.app?.builder;
      if (!builder?.site?.components) {
        return { error: "builder-not-ready" };
      }
      const propertiesPanel = builder.ui?.propertiesPanel || null;

      if (payload.mode === "sync") {
        const rows = [];
        for (const target of payload.targets) {
          const component = builder.site.components[target.componentId];
          if (!component) {
            rows.push({
              semanticKey: target.semanticKey,
              exists: false,
              componentId: target.componentId
            });
            continue;
          }
          const live = await snapshotComponent(component, propertiesPanel);
          rows.push({
            semanticKey: target.semanticKey,
            exists: true,
            ...live,
            proposedClassApplied: !!(
              target.proposedClass &&
              live.classes.includes(target.proposedClass)
            )
          });
        }
        return {
          rows,
          total: rows.length,
          generatedAt: new Date().toISOString()
        };
      }

      const component = builder.site.components[payload.componentId];
      if (!component) {
        return { error: "missing-component", componentId: payload.componentId };
      }

      const baseSnapshot = await snapshotComponent(component, propertiesPanel);
      const values = {};
      for (const pathEntry of payload.paths) {
        values[pathEntry.path] = getByPath(component, pathEntry.segments);
      }

      if (payload.mode === "read") {
        return {
          component: baseSnapshot,
          values
        };
      }

      const before = getByPath(component, payload.mutation.segments);
      const expectedBeforeSupplied = Object.prototype.hasOwnProperty.call(payload, "expectedBefore");
      if (expectedBeforeSupplied && !compareValues(before, payload.expectedBefore)) {
        return {
          error: "preflight-mismatch",
          before,
          expectedBefore: payload.expectedBefore,
          component: baseSnapshot
        };
      }

      if (!payload.dryRun) {
        setByPath(component, payload.mutation.segments, payload.mutation.value);
        markChanged(builder, [component.id]);
      }

      const afterComponent = builder.site.components[payload.componentId];
      const afterSnapshot = await snapshotComponent(afterComponent, propertiesPanel);
      const after = getByPath(afterComponent, payload.mutation.segments);

      return {
        component: afterSnapshot,
        before,
        after,
        dryRun: !!payload.dryRun,
        matchesRequested: compareValues(after, payload.mutation.value),
        dirtyPublishButton: !!document.querySelector('#menu [data-action="publish"].alert')
      };
    };

    return run();
  })()`;
}

async function evaluateAgainstSite(site, port, expression) {
  const tabs = await fetchDebugTabs(port);
  const tab = findMatchingSiteTab(tabs, site);
  if (!tab) {
    fail(`No Builder tab found for ${site.builderUrl}`);
  }

  const value = await evaluateTab(tab.webSocketDebuggerUrl, expression);
  return { tab, value };
}

export function listProfiles(options = {}) {
  const registry = loadRegistry(options.registryPath || options.registry || DEFAULT_REGISTRY_PATH);
  return registry.map((site) => {
    const profile = loadSiteProfile(site.profilePath);
    const targetMapPath = profile?.mcp?.targetMapPath || "";
    let targetCount = 0;
    if (targetMapPath && fs.existsSync(targetMapPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(targetMapPath, "utf8"));
        targetCount = Array.isArray(parsed.targets) ? parsed.targets.length : 0;
      } catch {
        targetCount = 0;
      }
    }
    return {
      siteSlug: site.siteSlug,
      templateId: site.templateId,
      builderUrl: site.builderUrl,
      publishedSiteUrl: site.publishedSiteUrl,
      runtimeMode: site.runtimeMode,
      savePublishPolicy: site.savePublishPolicy,
      profileStatus: profile?.status || site.status || "",
      mcpEnabled: Boolean(profile?.mcp?.enabled),
      contractMode: profile?.mcp?.contractMode || "",
      targetCount
    };
  });
}

export async function checkProfile(options = {}) {
  const readiness = await checkSiteReadiness(options);
  const targetMap = readiness.resolved.profile?.mcp?.enabled
    ? loadMcpTargetMap(readiness.resolved.profile)
    : null;

  return {
    siteSlug: readiness.resolved.site.siteSlug,
    builderUrl: readiness.resolved.site.builderUrl,
    publishedSiteUrl: readiness.resolved.site.publishedSiteUrl,
    connected: readiness.connected,
    authenticated: readiness.authenticated,
    builderReady: readiness.builderReady,
    siteResolved: readiness.siteResolved,
    safeToEdit: readiness.safeToEdit,
    profileFreshness: readiness.profileFreshness,
    matchedBy: readiness.resolved.matchedBy,
    contractMode: readiness.resolved.profile?.mcp?.contractMode || "",
    semanticNamespace: readiness.resolved.profile?.mcp?.semanticNamespace || "",
    targetCount: targetMap ? targetMap.targets.length : 0,
    tab: readiness.tab
      ? {
          id: readiness.tab.id,
          title: readiness.tab.title,
          url: readiness.tab.url
        }
      : null
  };
}

export function resolveTarget(options = {}) {
  const { resolved, targetMap } = resolveProfileContext(options);
  const resolution = resolveTargetDefinition(targetMap, options.target || options);

  return {
    siteSlug: resolved.site.siteSlug,
    targetMapPath: resolved.profile.mcp.targetMapPath,
    resolution: {
      status: resolution.status,
      reason: resolution.reason,
      target: resolution.target ? summarizeTarget(resolution.target) : null,
      candidates: resolution.candidates || []
    }
  };
}

export async function syncProfile(options = {}) {
  const port = String(options.port || DEFAULT_PORT);
  const write = options.write === true;
  const live = options.live !== false;
  const { resolved, targetMap } = resolveProfileContext(options);

  const summary = {
    siteSlug: resolved.site.siteSlug,
    targetMapPath: resolved.profile.mcp.targetMapPath,
    contractMode: resolved.profile.mcp.contractMode,
    live,
    write,
    targetCount: targetMap.targets.length
  };

  if (!live || !targetMap.targets.length) {
    return {
      ...summary,
      result: targetMap.targets.map((target) => summarizeTarget(target))
    };
  }

  const expression = buildRuntimeExpression({
    mode: "sync",
    targets: targetMap.targets.map((target) => ({
      semanticKey: target.semanticKey,
      componentId: target.componentId,
      proposedClass: target.proposedClass || ""
    }))
  });

  const runtime = await evaluateAgainstSite(resolved.site, port, expression);
  if (runtime.value?.error) {
    fail(runtime.value.error);
  }

  const rowsByKey = new Map((runtime.value?.rows || []).map((row) => [row.semanticKey, row]));
  const syncedAt = runtime.value?.generatedAt || new Date().toISOString();
  const nextTargetMap = {
    ...targetMap,
    meta: {
      ...(targetMap.meta || {}),
      lastSyncedAt: syncedAt,
      targetCount: targetMap.targets.length,
      liveBuilderUrl: resolved.site.builderUrl
    },
    targets: targetMap.targets.map((target) => {
      const liveRow = rowsByKey.get(target.semanticKey) || {
        exists: false,
        componentId: target.componentId
      };
      return {
        ...target,
        componentId: liveRow.componentId || target.componentId,
        componentType: liveRow.componentType || target.componentType,
        currentElementId:
          liveRow.exists && typeof liveRow.elementId === "string"
            ? liveRow.elementId
            : target.currentElementId || "",
        existingClasses:
          liveRow.exists && Array.isArray(liveRow.classes)
            ? liveRow.classes
            : Array.isArray(target.existingClasses)
              ? target.existingClasses
              : [],
        live: {
          syncedAt,
          exists: Boolean(liveRow.exists),
          componentId: liveRow.componentId || target.componentId,
          componentType: liveRow.componentType || null,
          elementId: liveRow.elementId || "",
          classes: Array.isArray(liveRow.classes) ? liveRow.classes : [],
          attributes: liveRow.attributes || "",
          childIds: Array.isArray(liveRow.childIds) ? liveRow.childIds : [],
          topLevelIndex:
            typeof liveRow.topLevelIndex === "number" ? liveRow.topLevelIndex : null,
          tabs: Array.isArray(liveRow.tabs) ? liveRow.tabs : [],
          shownId: liveRow.shownId || null,
          shownType: liveRow.shownType || null,
          proposedClassApplied: Boolean(liveRow.proposedClassApplied)
        }
      };
    })
  };

  if (write) {
    fs.writeFileSync(
      resolved.profile.mcp.targetMapPath,
      JSON.stringify(nextTargetMap, null, 2),
      "utf8"
    );
  }

  return {
    ...summary,
    tab: {
      id: runtime.tab.id,
      title: runtime.tab.title,
      url: runtime.tab.url
    },
    syncedAt,
    result: nextTargetMap.targets.map((target) => summarizeTarget(target))
  };
}

export async function readTarget(options = {}) {
  const port = String(options.port || DEFAULT_PORT);
  const { resolved, targetMap } = resolveProfileContext(options);
  const resolution = resolveTargetDefinition(targetMap, options.target || options);

  if (resolution.status !== "exact") {
    return {
      siteSlug: resolved.site.siteSlug,
      resolution: {
        status: resolution.status,
        reason: resolution.reason,
        target: resolution.target ? summarizeTarget(resolution.target) : null,
        candidates: resolution.candidates || []
      }
    };
  }

  const target = resolution.target;
  const paths = uniquePaths(target).map((path) => ({
    path,
    segments: parsePath(path)
  }));

  const expression = buildRuntimeExpression({
    mode: "read",
    componentId: target.componentId,
    paths
  });

  const runtime = await evaluateAgainstSite(resolved.site, port, expression);
  if (runtime.value?.error) {
    fail(runtime.value.error);
  }

  return {
    siteSlug: resolved.site.siteSlug,
    resolution: {
      status: "exact",
      reason: resolution.reason,
      target: summarizeTarget(target)
    },
    tab: {
      id: runtime.tab.id,
      title: runtime.tab.title,
      url: runtime.tab.url
    },
    component: runtime.value.component,
    values: runtime.value.values
  };
}

export async function updateTarget(options = {}) {
  const port = String(options.port || DEFAULT_PORT);
  const commit = options.commit === true;
  const requestedPath = String(options.path || "").trim();
  if (!requestedPath) fail("Mutation path is required.");

  const { resolved, targetMap } = resolveProfileContext(options);
  if (resolved.profile?.capabilities?.contentPatch !== "state-write") {
    fail(`Site "${resolved.site.siteSlug}" does not allow deterministic contentPatch writes.`);
  }

  const resolution = resolveTargetDefinition(targetMap, options.target || options);
  if (resolution.status !== "exact") {
    return {
      siteSlug: resolved.site.siteSlug,
      resolution: {
        status: resolution.status,
        reason: resolution.reason,
        target: resolution.target ? summarizeTarget(resolution.target) : null,
        candidates: resolution.candidates || []
      }
    };
  }

  const target = resolution.target;
  const mutation = getAllowedMutation(target, requestedPath);
  if (!mutation) {
    fail(`Path "${requestedPath}" is not allowlisted for target "${target.semanticKey}".`);
  }

  validateMutationValue(mutation, options.value);

  const expectedBeforeSupplied = Object.prototype.hasOwnProperty.call(options, "expectedBefore");
  const payload = {
    mode: "update",
    componentId: target.componentId,
    paths: uniquePaths(target).map((path) => ({
      path,
      segments: parsePath(path)
    })),
    mutation: {
      path: mutation.path,
      segments: parsePath(mutation.path),
      value: options.value
    },
    dryRun: !commit
  };

  if (expectedBeforeSupplied) {
    payload.expectedBefore = options.expectedBefore;
  }

  const expression = buildRuntimeExpression(payload);
  const runtime = await evaluateAgainstSite(resolved.site, port, expression);
  if (runtime.value?.error && runtime.value.error !== "preflight-mismatch") {
    fail(runtime.value.error);
  }

  const preflightPassed =
    runtime.value?.error !== "preflight-mismatch" &&
    (!expectedBeforeSupplied || compareValues(runtime.value?.before, options.expectedBefore));

  return {
    siteSlug: resolved.site.siteSlug,
    resolution: {
      status: "exact",
      reason: resolution.reason,
      target: summarizeTarget(target)
    },
    tab: {
      id: runtime.tab.id,
      title: runtime.tab.title,
      url: runtime.tab.url
    },
    mutation: {
      path: mutation.path,
      description: mutation.description || "",
      commit,
      preflightPassed,
      expectedBefore: expectedBeforeSupplied ? options.expectedBefore : null
    },
    result: {
      error: runtime.value?.error || null,
      before: Object.prototype.hasOwnProperty.call(runtime.value || {}, "before")
        ? runtime.value.before
        : null,
      after: Object.prototype.hasOwnProperty.call(runtime.value || {}, "after")
        ? runtime.value.after
        : null,
      matchesRequested: runtime.value?.matchesRequested === true,
      dirtyPublishButton: runtime.value?.dirtyPublishButton === true,
      dryRun: runtime.value?.dryRun !== false,
      component: runtime.value?.component || null
    }
  };
}
