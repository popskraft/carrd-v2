import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_ACTIVE_TEMPLATE_PATH,
  DEFAULT_REGISTRY_PATH,
  readJsonFile,
  resolveSite
} from "../site-registry.mjs";
import { computeSectionScopes, orderComponents } from "./keygen.mjs";
import { loadMcpTargetMap } from "./target-map.mjs";

const FINAL_VERDICTS = new Set(["PASS", "BLOCKED", "ROLLED_BACK"]);
const DEFAULT_VERIFICATION_LAYERS = [
  "schema-canon",
  "builder-readback",
  "persistence",
  "published",
  "visual"
];
const STRUCTURAL_OPERATION_TYPES = new Set([
  "CREATE_COMPONENT",
  "MOVE_COMPONENT",
  "DELETE_COMPONENT",
  "WRAP_COMPONENT",
  "UNWRAP_COMPONENT"
]);
const TYPE_KEYS = [
  "container",
  "control",
  "text",
  "image",
  "links",
  "buttons",
  "list",
  "divider",
  "form",
  "icons",
  "embed",
  "widget",
  "video",
  "audio",
  "table",
  "timer",
  "slideshow",
  "gallery"
];

function fail(message) {
  throw new Error(message);
}

function shortHash(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 12);
}

function hashJson(value) {
  return shortHash(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\n\r\t]+/g, " ")
    .replace(/[^a-z0-9-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return Array.from(new Set(normalizeText(value).split(" ").filter(Boolean)));
}

function splitClasses(value) {
  return String(value || "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function canonIdentityStrings(target) {
  return [
    target.semanticKey,
    target.currentElementId,
    target.proposedClass,
    ...(Array.isArray(target.aliases) ? target.aliases : []),
    ...(Array.isArray(target.existingClasses) ? target.existingClasses : [])
  ]
    .map(normalizeText)
    .filter(Boolean);
}

function inferComponentType(component) {
  for (const key of TYPE_KEYS) {
    if (component && typeof component === "object" && key in component) {
      return key;
    }
  }
  return "unknown";
}

function extractTextSnippet(component, componentType, fallbackText = "") {
  const fallback = String(fallbackText || "").replace(/\s+/g, " ").trim();
  if (fallback) return fallback.slice(0, 120);

  const linkItems = Array.isArray(component.links?.links) ? component.links.links : [];
  const buttonItems = Array.isArray(component.buttons?.buttons) ? component.buttons.buttons : [];
  const listItems = Array.isArray(component.list?.items) ? component.list.items : [];
  const formFields = Array.isArray(component.form?.fields) ? component.form.fields : [];
  const direct =
    componentType === "text"
      ? component.text?.html || component.text?.content || ""
      : componentType === "links"
        ? linkItems.map((item) => item.label || "").join(" ")
        : componentType === "buttons"
          ? buttonItems.map((item) => item.label || "").join(" ")
          : componentType === "list"
            ? listItems.map((item) => item.label || item.title || "").join(" ")
            : componentType === "form"
              ? formFields.map((item) => item.label || item.name || "").join(" ")
              : "";

  return String(direct)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function extractListCounts(component) {
  const counts = {};
  if (Array.isArray(component.links?.links)) {
    counts["links.links"] = component.links.links.length;
  }
  if (Array.isArray(component.buttons?.buttons)) {
    counts["buttons.buttons"] = component.buttons.buttons.length;
  }
  if (Array.isArray(component.icons?.icons)) {
    counts["icons.icons"] = component.icons.icons.length;
  }
  if (Array.isArray(component.list?.items)) {
    counts["list.items"] = component.list.items.length;
  }
  if (Array.isArray(component.form?.fields)) {
    counts["form.fields"] = component.form.fields.length;
  }
  return counts;
}

function normalizeInventoryRow(row, sectionScope) {
  const source = {
    componentId: String(row.componentId || "").trim(),
    componentType: String(row.componentType || "unknown").trim() || "unknown",
    sectionScope,
    elementId: String(row.elementId || "").trim(),
    classes: Array.isArray(row.classes) ? row.classes.map(String) : [],
    attributes: String(row.attributes || "").trim(),
    childIds: Array.isArray(row.childIds) ? row.childIds.map(String) : [],
    childCount: Array.isArray(row.childIds) ? row.childIds.length : 0,
    topLevelIndex: typeof row.topLevelIndex === "number" ? row.topLevelIndex : -1,
    textSnippet: String(row.textSnippet || "").replace(/\s+/g, " ").trim().slice(0, 120),
    listCounts:
      row.listCounts && typeof row.listCounts === "object" && !Array.isArray(row.listCounts)
        ? row.listCounts
        : {},
    tabs: Array.isArray(row.tabs) ? row.tabs.map(String) : []
  };

  source.identityTokens = tokenize(
    [source.elementId, source.classes.join(" "), source.textSnippet, source.componentType].join(" ")
  );
  source.fingerprint = hashJson({
    componentType: source.componentType,
    sectionScope: source.sectionScope,
    elementId: source.elementId,
    classes: source.classes,
    attributes: source.attributes,
    childIds: source.childIds,
    textSnippet: source.textSnippet,
    listCounts: source.listCounts,
    tabs: source.tabs
  });
  return source;
}

export function builderScanToInventory(builderScan) {
  const items = builderScan?.topLevel?.items;
  const safeById = builderScan?.components?.safeById;
  if (!Array.isArray(items) || !safeById || typeof safeById !== "object") {
    fail("Unsupported builder-scan format: expected topLevel.items and components.safeById.");
  }

  const topLevelTextById = new Map(
    items.map((item) => [String(item.dataId || ""), String(item.textSample || "")])
  );
  const topLevelIndexById = new Map(
    items.map((item) => [String(item.dataId || ""), Number(item.index ?? -1)])
  );
  const canvasOrder = items
    .slice()
    .sort((left, right) => Number(left.index ?? 0) - Number(right.index ?? 0))
    .map((item) => String(item.dataId || ""))
    .filter(Boolean);

  const rows = [];
  const visited = new Set();

  const visit = (component, topLevelIndex = -1) => {
    if (!component || typeof component !== "object") return;
    const componentId = String(component.id || "").trim();
    if (!componentId || visited.has(componentId)) return;
    visited.add(componentId);

    const componentType = inferComponentType(component);
    const childEntries =
      component.children && typeof component.children === "object" ? component.children : {};
    const childIds = Object.keys(childEntries);
    const textSnippet = extractTextSnippet(
      component,
      componentType,
      topLevelTextById.get(componentId) || ""
    );

    rows.push({
      componentId,
      componentType,
      elementId: component.settings?.element?.id || "",
      classes: splitClasses(component.settings?.element?.classes || ""),
      attributes: component.settings?.element?.attributes || "",
      childIds,
      topLevelIndex,
      textSnippet,
      listCounts: extractListCounts(component),
      tabs: []
    });

    for (const childId of childIds) {
      visit(childEntries[childId], -1);
    }
  };

  for (const item of items) {
    const componentId = String(item.dataId || "").trim();
    const component = safeById[componentId];
    if (component) {
      visit(component, Number(topLevelIndexById.get(componentId) ?? -1));
    }
  }

  return {
    components: rows,
    canvasOrder,
    totalComponents: rows.length,
    generatedAt: builderScan?.meta?.generatedAt || new Date().toISOString()
  };
}

function loadJsonSource(filePath) {
  if (!filePath) fail("Missing source file path.");
  if (!fs.existsSync(filePath)) fail(`Source file not found: ${filePath}`);
  return readJsonFile(filePath);
}

function loadSourceInventory(options = {}) {
  if (options.sourceInventory) {
    return {
      inventory: options.sourceInventory,
      sourceRef: options.sourceRef || ""
    };
  }

  let payload = null;
  let sourceRef = "";

  if (options.sourceFile) {
    payload = loadJsonSource(options.sourceFile);
    sourceRef = options.sourceFile;
  } else if (options.sourceSite || options.site) {
    const resolved = resolveSite({
      registryPath: options.registryPath || options.registry || DEFAULT_REGISTRY_PATH,
      activeTemplatePath:
        options.activeTemplatePath === undefined
          ? options.activeTemplate || DEFAULT_ACTIVE_TEMPLATE_PATH
          : options.activeTemplatePath,
      siteRef: options.sourceSite || options.site
    });
    const builderScanPath = resolved.profile?.structure?.builderScan;
    if (!builderScanPath) {
      fail(`Site "${resolved.site.siteSlug}" does not define structure.builderScan.`);
    }
    payload = loadJsonSource(builderScanPath);
    sourceRef = resolved.site.siteSlug;
  } else {
    fail("Pass sourceInventory, sourceFile, or sourceSite.");
  }

  const inventory =
    Array.isArray(payload?.components) && Array.isArray(payload?.canvasOrder)
      ? payload
      : builderScanToInventory(payload);

  return { inventory, sourceRef };
}

function loadCanonContext(options = {}) {
  const resolved = resolveSite({
    registryPath: options.registryPath || options.registry || DEFAULT_REGISTRY_PATH,
    activeTemplatePath:
      options.activeTemplatePath === undefined
        ? options.activeTemplate || DEFAULT_ACTIVE_TEMPLATE_PATH
        : options.activeTemplatePath,
    siteRef: options.canonSite || options.targetSite || "main-template"
  });
  const targetMap = loadMcpTargetMap(resolved.profile);
  return { resolved, targetMap };
}

function summarizeCanonTarget(target) {
  const live = target.live || {};
  const summary = {
    semanticKey: target.semanticKey,
    componentType: target.componentType,
    sectionScope: target.sectionScope || "main",
    aliases: Array.isArray(target.aliases) ? target.aliases : [],
    currentElementId: target.currentElementId || "",
    existingClasses: Array.isArray(target.existingClasses) ? target.existingClasses : [],
    proposedClass: target.proposedClass || "",
    readPaths: Array.isArray(target.readPaths) ? target.readPaths : [],
    allowedMutations: Array.isArray(target.allowedMutations)
      ? target.allowedMutations.map((item) => ({
          path: item.path,
          valueType: item.valueType || "",
          description: item.description || ""
        }))
      : [],
    live: {
      childIds: Array.isArray(live.childIds) ? live.childIds : [],
      topLevelIndex: typeof live.topLevelIndex === "number" ? live.topLevelIndex : -1,
      tabs: Array.isArray(live.tabs) ? live.tabs : [],
      classes: Array.isArray(live.classes) ? live.classes : [],
      elementId: live.elementId || ""
    }
  };
  summary.fingerprint = hashJson(summary);
  return summary;
}

export function freezeCanonSnapshot(options = {}) {
  if (options.canonSnapshot) {
    const snapshot = { ...options.canonSnapshot };
    if (!snapshot.stats) {
      snapshot.stats = {
        targetCount: Array.isArray(snapshot.targets) ? snapshot.targets.length : 0,
        byType: (snapshot.targets || []).reduce((acc, target) => {
          acc[target.componentType] = (acc[target.componentType] || 0) + 1;
          return acc;
        }, {})
      };
    }
    return snapshot;
  }

  const { resolved, targetMap } = loadCanonContext(options);
  const targets = targetMap.targets
    .map(summarizeCanonTarget)
    .sort((left, right) => left.semanticKey.localeCompare(right.semanticKey));

  const fingerprint = hashJson(
    targets.map((target) => ({
      semanticKey: target.semanticKey,
      componentType: target.componentType,
      sectionScope: target.sectionScope,
      currentElementId: target.currentElementId,
      existingClasses: target.existingClasses,
      proposedClass: target.proposedClass,
      fingerprint: target.fingerprint
    }))
  );

  return {
    snapshotId: `${resolved.site.siteSlug}-${fingerprint}`,
    canonSite: resolved.site.siteSlug,
    builderUrl: resolved.site.builderUrl,
    publishedSiteUrl: resolved.site.publishedSiteUrl,
    semanticNamespace: resolved.profile?.mcp?.semanticNamespace || "",
    contractMode: resolved.profile?.mcp?.contractMode || "",
    generatedAt: options.generatedAt || new Date().toISOString(),
    sourceArtifacts: {
      profilePath: resolved.site.profilePath || resolved.profile?.projectWorkspace || "",
      targetMapPath: resolved.profile?.mcp?.targetMapPath || "",
      builderScanPath: resolved.profile?.structure?.builderScan || ""
    },
    stats: {
      targetCount: targets.length,
      byType: targets.reduce((acc, target) => {
        acc[target.componentType] = (acc[target.componentType] || 0) + 1;
        return acc;
      }, {})
    },
    targets
  };
}

export function createMigrationRun(options = {}) {
  const createdAt = options.createdAt || new Date().toISOString();
  const sourceRef = options.sourceRef || "";
  const canonSite = options.canonSite || options.targetRef || "main-template";
  const seed = `${createdAt}:${sourceRef}:${canonSite}:${options.mode || "dry-run"}`;

  return {
    runId: options.runId || `migration-${shortHash(seed)}`,
    mode: options.mode || "dry-run",
    sourceRef,
    targetRef: options.targetRef || sourceRef,
    canonSiteRef: canonSite,
    createdAt,
    checkpoints: [],
    approvalGates: [],
    verificationGates: [],
    events: [
      {
        type: "run-created",
        at: createdAt
      }
    ],
    planStatus: "draft",
    finalVerdict: null
  };
}

export function recordCheckpoint(run, name, payload = {}) {
  const checkpoint = {
    name,
    payloadHash: hashJson(payload),
    payload
  };
  run.checkpoints.push(checkpoint);
  run.events.push({
    type: "checkpoint",
    name,
    payloadHash: checkpoint.payloadHash
  });
  return checkpoint;
}

export function queueApprovalGate(run, kind, reason) {
  if (run.approvalGates.some((gate) => gate.kind === kind)) return;
  run.approvalGates.push({
    kind,
    required: true,
    reason,
    status: "pending"
  });
}

export function queueVerificationGate(run, layer, reason) {
  if (run.verificationGates.some((gate) => gate.layer === layer)) return;
  run.verificationGates.push({
    layer,
    required: true,
    reason,
    status: "pending"
  });
}

export function setApprovalGateStatus(run, kind, status) {
  const gate = run.approvalGates.find((item) => item.kind === kind);
  if (!gate) fail(`Unknown approval gate: ${kind}`);
  gate.status = status;
  return gate;
}

export function setVerificationGateStatus(run, layer, status) {
  const gate = run.verificationGates.find((item) => item.layer === layer);
  if (!gate) fail(`Unknown verification gate: ${layer}`);
  gate.status = status;
  return gate;
}

export function finalizeRunVerdict(run, status) {
  if (!FINAL_VERDICTS.has(status)) {
    fail(`Unsupported final verdict: ${status}`);
  }

  if (status === "PASS") {
    const pendingApprovals = run.approvalGates.filter(
      (gate) => gate.required && gate.status !== "approved"
    );
    if (pendingApprovals.length) {
      fail(
        `PASS requires approved gates: ${pendingApprovals.map((gate) => gate.kind).join(", ")}`
      );
    }

    const failingVerifications = run.verificationGates.filter(
      (gate) => gate.required && gate.status !== "pass"
    );
    if (failingVerifications.length) {
      fail(
        `PASS requires passing verification gates: ${failingVerifications
          .map((gate) => gate.layer)
          .join(", ")}`
      );
    }
  }

  run.finalVerdict = status;
  run.events.push({
    type: "final-verdict",
    status
  });
  return run;
}

export function finalizeDryRun(run, planStatus, details = {}) {
  run.planStatus = planStatus;
  run.events.push({
    type: "dry-run-finalized",
    planStatus,
    details
  });
  return run;
}

export function normalizeSourceInventory(options = {}) {
  const { inventory, sourceRef } = loadSourceInventory(options);

  if (!inventory || !Array.isArray(inventory.components)) {
    fail("Source inventory must define a components array.");
  }

  const scopeByComponent = computeSectionScopes(inventory);
  const orderedRows = orderComponents(inventory);
  const nodes = orderedRows.map((row) =>
    normalizeInventoryRow(row, scopeByComponent.get(row.componentId) || "main")
  );

  return {
    sourceRef: options.sourceRef || sourceRef,
    generatedAt: inventory.generatedAt || new Date().toISOString(),
    canvasOrder: Array.isArray(inventory.canvasOrder) ? inventory.canvasOrder : [],
    totalComponents: nodes.length,
    byType: nodes.reduce((acc, node) => {
      acc[node.componentType] = (acc[node.componentType] || 0) + 1;
      return acc;
    }, {}),
    nodes,
    fingerprint: hashJson(
      nodes.map((node) => ({
        componentId: node.componentId,
        componentType: node.componentType,
        sectionScope: node.sectionScope,
        fingerprint: node.fingerprint
      }))
    )
  };
}

function scoreCandidate(node, target) {
  if (node.componentType !== target.componentType) {
    return { score: 0, reasons: ["component-type-mismatch"] };
  }

  const reasons = [];
  let score = 0;
  const targetIdentity = canonIdentityStrings(target);

  const elementMatch =
    node.elementId &&
    target.currentElementId &&
    normalizeText(node.elementId) === normalizeText(target.currentElementId);
  if (elementMatch) {
    score += 0.55;
    reasons.push("element-id");
  }

  const classMatches = node.classes.filter((cls) =>
    [
      normalizeText(target.proposedClass),
      ...target.existingClasses.map(normalizeText),
      ...target.aliases.map(normalizeText)
    ].includes(normalizeText(cls))
  );
  if (classMatches.length) {
    score += 0.4;
    reasons.push(`class:${classMatches[0]}`);
  }

  if (node.sectionScope === target.sectionScope) {
    score += 0.15;
    reasons.push("section-scope");
  }

  const targetTokens = tokenize(targetIdentity.join(" "));
  const overlap = node.identityTokens.filter((token) => targetTokens.includes(token));
  if (overlap.length) {
    const overlapScore = overlap.length / Math.max(node.identityTokens.length, targetTokens.length, 1);
    score += overlapScore * 0.3;
    reasons.push(`token-overlap:${overlap.slice(0, 3).join(",")}`);
  }

  const childCount = Array.isArray(target.live?.childIds) ? target.live.childIds.length : 0;
  if (node.childCount && childCount && node.childCount === childCount) {
    score += 0.1;
    reasons.push("child-count");
  }

  if (node.topLevelIndex >= 0 && target.live?.topLevelIndex >= 0) {
    const diff = Math.abs(node.topLevelIndex - target.live.topLevelIndex);
    if (diff === 0) {
      score += 0.1;
      reasons.push("top-level-index");
    } else if (diff <= 2) {
      score += 0.05;
      reasons.push("top-level-near");
    }
  }

  return {
    score: Number(score.toFixed(4)),
    reasons
  };
}

function resolveNode(node, canonTargets) {
  const scored = canonTargets
    .map((target) => ({
      target,
      ...scoreCandidate(node, target)
    }))
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.target.semanticKey.localeCompare(right.target.semanticKey)
    );

  if (!scored.length) {
    return {
      status: "manual_required",
      reason: "no-candidate",
      source: node,
      target: null,
      candidates: []
    };
  }

  const [best, second] = scored;
  if (best.score >= 0.9) {
    if (second && second.score === best.score) {
      return {
        status: "ambiguous",
        reason: "multiple-exact-candidates",
        source: node,
        target: null,
        candidates: scored.slice(0, 5)
      };
    }

    return {
      status: "exact",
      reason: best.reasons.join("+"),
      source: node,
      target: best.target,
      score: best.score,
      candidates: scored.slice(0, 5)
    };
  }

  if (best.score >= 0.65 && (!second || best.score - second.score >= 0.1)) {
    return {
      status: "candidate",
      reason: best.reasons.join("+"),
      source: node,
      target: best.target,
      score: best.score,
      candidates: scored.slice(0, 5)
    };
  }

  return {
    status: "ambiguous",
    reason: "low-separation",
    source: node,
    target: null,
    candidates: scored.slice(0, 5)
  };
}

function buildMatchedOperations(node, target) {
  const operations = [];
  const classApplied = target.proposedClass && node.classes.includes(target.proposedClass);
  const idApplied =
    !target.currentElementId || normalizeText(node.elementId) === normalizeText(target.currentElementId);

  if (classApplied && idApplied) {
    operations.push({
      type: "PRESERVE",
      componentId: node.componentId,
      semanticKey: target.semanticKey,
      strategy: "none",
      reason: "canonical-identity-present"
    });
    return operations;
  }

  if (target.proposedClass && !classApplied) {
    operations.push({
      type: "ANNOTATE",
      componentId: node.componentId,
      semanticKey: target.semanticKey,
      path: "settings.element.classes",
      strategy: "state-write-if-allowlisted",
      value: {
        appendClass: target.proposedClass
      },
      requiredProof: [
        "precondition",
        "inverse",
        "persistence-proof",
        "post-check"
      ]
    });
  }

  if (target.currentElementId && !idApplied) {
    operations.push({
      type: "SET_FIELD",
      componentId: node.componentId,
      semanticKey: target.semanticKey,
      path: "settings.element.id",
      strategy: "state-write-if-allowlisted",
      value: target.currentElementId,
      requiredProof: [
        "precondition",
        "inverse",
        "persistence-proof",
        "post-check"
      ]
    });
  }

  return operations.length
    ? operations
    : [
        {
          type: "PRESERVE",
          componentId: node.componentId,
          semanticKey: target.semanticKey,
          strategy: "none",
          reason: "no-safe-change-required"
        }
      ];
}

function buildPlanOperations(assignments, canonTargets) {
  const operations = [];
  const matchedSemanticKeys = new Set();

  for (const assignment of assignments) {
    if (assignment.status === "exact" || assignment.status === "candidate") {
      matchedSemanticKeys.add(assignment.target.semanticKey);
      operations.push(...buildMatchedOperations(assignment.source, assignment.target));
      continue;
    }

    operations.push({
      type: "MANUAL_REQUIRED",
      componentId: assignment.source.componentId,
      componentType: assignment.source.componentType,
      sectionScope: assignment.source.sectionScope,
      reason: assignment.reason,
      candidates: assignment.candidates.slice(0, 3).map((item) => ({
        semanticKey: item.target.semanticKey,
        score: item.score,
        reasons: item.reasons
      }))
    });
  }

  for (const target of canonTargets) {
    if (matchedSemanticKeys.has(target.semanticKey)) continue;
    operations.push({
      type: "CREATE_COMPONENT",
      semanticKey: target.semanticKey,
      componentType: target.componentType,
      sectionScope: target.sectionScope,
      strategy: "ui-automation-or-state-write-adapter",
      reason: "canon-target-missing-in-source"
    });
  }

  return operations;
}

function summarizeOperations(operations) {
  return operations.reduce((acc, operation) => {
    acc[operation.type] = (acc[operation.type] || 0) + 1;
    return acc;
  }, {});
}

export function planCanonicalMigration(options = {}) {
  const run = createMigrationRun({
    runId: options.runId,
    sourceRef: options.sourceSite || options.sourceFile || options.sourceRef || "",
    targetRef: options.targetRef || "",
    canonSite: options.canonSite || options.targetSite || "main-template",
    createdAt: options.createdAt,
    mode: "dry-run"
  });

  const canonSnapshot = freezeCanonSnapshot(options);
  recordCheckpoint(run, "canon-freeze", {
    snapshotId: canonSnapshot.snapshotId,
    targetCount: canonSnapshot.stats.targetCount
  });

  const source = normalizeSourceInventory({
    sourceInventory: options.sourceInventory,
    sourceFile: options.sourceFile,
    sourceSite: options.sourceSite || options.site,
    sourceRef: options.sourceRef,
    registryPath: options.registryPath,
    activeTemplatePath: options.activeTemplatePath
  });
  run.sourceRef = source.sourceRef || run.sourceRef;
  recordCheckpoint(run, "source-normalization", {
    fingerprint: source.fingerprint,
    totalComponents: source.totalComponents
  });

  const initialAssignments = source.nodes.map((node) => resolveNode(node, canonSnapshot.targets));
  const rankedAssignments = initialAssignments
    .slice()
    .sort((left, right) => (right.score || 0) - (left.score || 0));
  const claimedTargets = new Set();
  const assignments = rankedAssignments.map((assignment) => {
    if (!assignment.target) return assignment;
    if (claimedTargets.has(assignment.target.semanticKey)) {
      return {
        ...assignment,
        status: "manual_required",
        reason: "canon-target-already-claimed",
        target: null
      };
    }
    claimedTargets.add(assignment.target.semanticKey);
    return assignment;
  });

  const operations = buildPlanOperations(assignments, canonSnapshot.targets);
  const operationSummary = summarizeOperations(operations);
  const unresolvedCount = operations.filter((operation) => operation.type === "MANUAL_REQUIRED").length;

  recordCheckpoint(run, "plan-compile", {
    operations: operationSummary,
    unresolvedCount
  });

  const hasStructuralOps = operations.some((operation) =>
    STRUCTURAL_OPERATION_TYPES.has(operation.type)
  );
  if (hasStructuralOps) {
    queueApprovalGate(
      run,
      "destructive-operations",
      "Structural migration operations require explicit approval before apply."
    );
  }
  queueApprovalGate(run, "save", "Saving the Builder draft is irreversible for this run.");
  queueApprovalGate(run, "publish", "Publish remains operator-only.");
  queueApprovalGate(run, "rollback", "Rollback must be operator-approved.");

  for (const layer of DEFAULT_VERIFICATION_LAYERS) {
    queueVerificationGate(
      run,
      layer,
      "Required by canonical migration contract before any PASS verdict."
    );
  }

  const planStatus = unresolvedCount > 0 ? "manual-resolution-required" : "ready-for-live-testing";
  finalizeDryRun(run, planStatus, {
    operationSummary,
    unresolvedCount
  });

  return {
    run,
    planStatus,
    canonSnapshot: {
      snapshotId: canonSnapshot.snapshotId,
      canonSite: canonSnapshot.canonSite,
      semanticNamespace: canonSnapshot.semanticNamespace,
      targetCount: canonSnapshot.stats.targetCount,
      byType: canonSnapshot.stats.byType
    },
    source: {
      sourceRef: source.sourceRef,
      fingerprint: source.fingerprint,
      totalComponents: source.totalComponents,
      byType: source.byType
    },
    assignments: assignments.map((assignment) => ({
      componentId: assignment.source.componentId,
      componentType: assignment.source.componentType,
      sectionScope: assignment.source.sectionScope,
      status: assignment.status,
      reason: assignment.reason,
      score: assignment.score || 0,
      semanticKey: assignment.target?.semanticKey || null,
      candidates: (assignment.candidates || []).slice(0, 3).map((item) => ({
        semanticKey: item.target.semanticKey,
        score: item.score,
        reasons: item.reasons
      }))
    })),
    operations,
    approvals: run.approvalGates,
    verificationGates: run.verificationGates,
    summary: {
      operationSummary,
      unresolvedCount,
      structuralOps: hasStructuralOps
    }
  };
}

export function writeMigrationPlanReport(report, outputPath) {
  if (!outputPath) fail("Missing output path for migration plan report.");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return outputPath;
}
