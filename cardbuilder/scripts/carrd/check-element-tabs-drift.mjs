#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_ACTIVE_TEMPLATE_PATH,
  DEFAULT_REGISTRY_PATH,
  loadSiteProfile,
  profileSnapshotDir,
  resolveSite
} from "./site-registry.mjs";
const SNAPSHOT_PREFIX = "template-instance-element-tabs-map-";
const SNAPSHOT_SUFFIX = ".json";

function parseArgs(argv) {
  const args = {
    dir: "",
    site: "",
    profile: "",
    registry: DEFAULT_REGISTRY_PATH,
    activeTemplate: DEFAULT_ACTIVE_TEMPLATE_PATH,
    latest: "",
    baseline: "",
    failOnDrift: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--dir" && next) {
      args.dir = next;
      i += 1;
    } else if (arg === "--site" && next) {
      args.site = next;
      i += 1;
    } else if (arg === "--profile" && next) {
      args.profile = next;
      i += 1;
    } else if (arg === "--registry" && next) {
      args.registry = next;
      i += 1;
    } else if (arg === "--active-template" && next) {
      args.activeTemplate = next;
      i += 1;
    } else if (arg === "--latest" && next) {
      args.latest = next;
      i += 1;
    } else if (arg === "--baseline" && next) {
      args.baseline = next;
      i += 1;
    } else if (arg === "--no-fail-on-drift") {
      args.failOnDrift = false;
    }
  }

  return args;
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function resolveSnapshotDirectory(args) {
  if (args.dir) return args.dir;

  if (args.profile) {
    const profile = loadSiteProfile(args.profile);
    const snapshotDir = profileSnapshotDir(profile);
    if (!snapshotDir) {
      fail(`Profile does not define a snapshot directory: ${args.profile}`, 2);
    }
    return snapshotDir;
  }

  const resolved = resolveSite({
    registryPath: args.registry,
    activeTemplatePath: args.activeTemplate,
    siteRef: args.site
  });

  const snapshotDir = profileSnapshotDir(resolved.profile);
  if (!snapshotDir) {
    fail(
      `Resolved profile for "${resolved.site.siteSlug}" does not define a snapshot directory.`,
      2
    );
  }

  return snapshotDir;
}

function readSnapshot(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const value =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed.value && typeof parsed.value === "object" ? parsed.value : parsed)
      : null;
  if (!value || !Array.isArray(value.rows)) {
    fail(`Invalid snapshot format: ${filePath}`);
  }
  return {
    filePath,
    scannedAt: value.scannedAt || null,
    totalElements: Number(value.totalElements || 0),
    allTabs: Array.isArray(value.allTabs) ? value.allTabs : [],
    byType: value.byType && typeof value.byType === "object" ? value.byType : {},
    rows: value.rows,
  };
}

function listSnapshots(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter(
      (name) =>
        name.startsWith(SNAPSHOT_PREFIX) &&
        name.endsWith(SNAPSHOT_SUFFIX) &&
        fs.statSync(path.join(dirPath, name)).isFile()
    )
    .sort()
    .map((name) => path.join(dirPath, name));
}

function tabsKey(tabs) {
  return (tabs || []).join(" | ");
}

function indexRows(rows) {
  const byId = new Map();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      builderType: row.builderType || row.type || "unknown",
      tabs: Array.isArray(row.tabs) ? row.tabs : [],
      tabsKey: tabsKey(row.tabs),
    });
  }
  return byId;
}

function diffSets(prev, next) {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  const added = [...nextSet].filter((x) => !prevSet.has(x)).sort();
  const removed = [...prevSet].filter((x) => !nextSet.has(x)).sort();
  return { added, removed };
}

function buildTypePatterns(byTypeObj) {
  const out = new Map();
  for (const [type, meta] of Object.entries(byTypeObj || {})) {
    const patterns = Object.entries(meta?.patternCounts || {})
      .map(([pattern, count]) => `${pattern} (${count})`)
      .sort();
    out.set(type, patterns);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const snapshotDir = resolveSnapshotDirectory(args);
  const snapshotFiles = listSnapshots(snapshotDir);

  let latestPath = args.latest;
  let baselinePath = args.baseline;

  if (!latestPath && snapshotFiles.length > 0) {
    latestPath = snapshotFiles[snapshotFiles.length - 1];
  }
  if (!baselinePath && snapshotFiles.length > 1) {
    baselinePath = snapshotFiles[snapshotFiles.length - 2];
  }

  if (!latestPath) {
    fail(`No snapshots found in ${snapshotDir}`, 2);
  }

  if (!baselinePath) {
    console.log("tabs-drift: skipped (no baseline snapshot yet)");
    console.log(`latest: ${latestPath}`);
    process.exit(0);
  }

  const latest = readSnapshot(latestPath);
  const baseline = readSnapshot(baselinePath);

  const tabsDiff = diffSets(baseline.allTabs, latest.allTabs);
  const baselineRows = indexRows(baseline.rows);
  const latestRows = indexRows(latest.rows);

  const addedElements = [];
  const removedElements = [];
  const changedElements = [];

  for (const [id, row] of latestRows.entries()) {
    if (!baselineRows.has(id)) {
      addedElements.push({ id, builderType: row.builderType, tabs: row.tabs });
      continue;
    }
    const prev = baselineRows.get(id);
    if (prev.tabsKey !== row.tabsKey || prev.builderType !== row.builderType) {
      changedElements.push({
        id,
        fromType: prev.builderType,
        toType: row.builderType,
        fromTabs: prev.tabs,
        toTabs: row.tabs,
      });
    }
  }

  for (const [id, row] of baselineRows.entries()) {
    if (!latestRows.has(id)) {
      removedElements.push({ id, builderType: row.builderType, tabs: row.tabs });
    }
  }

  const baselineTypePatterns = buildTypePatterns(baseline.byType);
  const latestTypePatterns = buildTypePatterns(latest.byType);
  const typePatternChanges = [];

  const allTypes = new Set([
    ...baselineTypePatterns.keys(),
    ...latestTypePatterns.keys(),
  ]);
  for (const type of allTypes) {
    const prev = baselineTypePatterns.get(type) || [];
    const next = latestTypePatterns.get(type) || [];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      typePatternChanges.push({ type, from: prev, to: next });
    }
  }

  const hasDrift =
    tabsDiff.added.length > 0 ||
    tabsDiff.removed.length > 0 ||
    addedElements.length > 0 ||
    removedElements.length > 0 ||
    changedElements.length > 0 ||
    typePatternChanges.length > 0;

  console.log("tabs-drift: comparison summary");
  console.log(`baseline: ${baseline.filePath}`);
  console.log(`latest:   ${latest.filePath}`);
  console.log(`baseline totalElements: ${baseline.totalElements}`);
  console.log(`latest totalElements:   ${latest.totalElements}`);
  console.log(`tab labels added: ${tabsDiff.added.length}`);
  console.log(`tab labels removed: ${tabsDiff.removed.length}`);
  console.log(`elements added: ${addedElements.length}`);
  console.log(`elements removed: ${removedElements.length}`);
  console.log(`elements changed tabs/type: ${changedElements.length}`);
  console.log(`types changed pattern map: ${typePatternChanges.length}`);

  if (tabsDiff.added.length || tabsDiff.removed.length) {
    console.log("tab label diff:");
    if (tabsDiff.added.length) console.log(`  + ${tabsDiff.added.join(", ")}`);
    if (tabsDiff.removed.length) console.log(`  - ${tabsDiff.removed.join(", ")}`);
  }

  if (changedElements.length) {
    console.log("changed elements (sample up to 10):");
    for (const row of changedElements.slice(0, 10)) {
      console.log(
        `  * ${row.id}: ${row.fromType} [${row.fromTabs.join(", ")}] -> ${row.toType} [${row.toTabs.join(", ")}]`
      );
    }
  }

  if (hasDrift && args.failOnDrift) {
    fail("tabs-drift: drift detected", 1);
  }

  if (!hasDrift) {
    console.log("tabs-drift: no drift detected");
  } else {
    console.log("tabs-drift: drift detected (non-failing mode)");
  }
}

main();
