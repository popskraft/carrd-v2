// Deterministic semantic target generation from a raw Builder inventory.
// Pure functions only: same inventory + catalog + existing map -> byte-identical
// targets (modulo timestamps added by the caller). No LLM, no randomness.

function fail(message) {
  throw new Error(message);
}

export function slugify(value, maxWords = 4) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join("-");
}

function textSnippetSlug(row) {
  const snippet = String(row.textSnippet || "").trim();
  if (!snippet) return "";
  return slugify(snippet, 3);
}

function firstCustomClassSlug(row) {
  const classes = Array.isArray(row.classes) ? row.classes : [];
  for (const cls of classes) {
    const slug = slugify(cls);
    if (slug) return slug;
  }
  return "";
}

// ---------------------------------------------------------------------------
// Deterministic component ordering: canvas order for top-level components,
// DFS through childIds for nested ones, componentId-sorted tail for orphans.
// ---------------------------------------------------------------------------

export function orderComponents(inventory) {
  const rowsById = new Map(inventory.components.map((row) => [row.componentId, row]));
  const canvasOrder = Array.isArray(inventory.canvasOrder) ? inventory.canvasOrder : [];
  const visited = new Set();
  const ordered = [];

  const visit = (componentId) => {
    if (!componentId || visited.has(componentId)) return;
    const row = rowsById.get(componentId);
    if (!row) return;
    visited.add(componentId);
    ordered.push(row);
    for (const childId of Array.isArray(row.childIds) ? row.childIds : []) {
      visit(childId);
    }
  };

  for (const componentId of canvasOrder) visit(componentId);

  const tail = inventory.components
    .filter((row) => !visited.has(row.componentId))
    .sort((left, right) => left.componentId.localeCompare(right.componentId));
  for (const row of tail) visit(row.componentId);

  return ordered;
}

// ---------------------------------------------------------------------------
// Section scoping: top-level canvas list is split at section-break components.
// First segment is "header" for a leading header-like container, else "main";
// later segments take the break marker's slug or a stable ordinal.
// ---------------------------------------------------------------------------

const SECTION_BOUNDARY_PATTERN = /section|break/i;

function isSectionBoundary(row) {
  return SECTION_BOUNDARY_PATTERN.test(String(row.componentType || ""));
}

function looksLikeHeaderContainer(row, rowsById) {
  if (row.componentType !== "container") return false;
  const childTypes = (Array.isArray(row.childIds) ? row.childIds : [])
    .map((id) => rowsById.get(id)?.componentType)
    .filter(Boolean);
  return childTypes.includes("image") && (childTypes.includes("links") || childTypes.includes("buttons"));
}

export function computeSectionScopes(inventory) {
  const rowsById = new Map(inventory.components.map((row) => [row.componentId, row]));
  const canvasOrder = Array.isArray(inventory.canvasOrder) ? inventory.canvasOrder : [];
  const scopeByComponent = new Map();

  let segmentIndex = 0;
  let currentScope = "main";
  let firstSegment = true;

  const assignDeep = (componentId, scope) => {
    const row = rowsById.get(componentId);
    if (!row || scopeByComponent.has(componentId)) return;
    scopeByComponent.set(componentId, scope);
    for (const childId of Array.isArray(row.childIds) ? row.childIds : []) {
      assignDeep(childId, scope);
    }
  };

  for (const componentId of canvasOrder) {
    const row = rowsById.get(componentId);
    if (!row) continue;

    if (isSectionBoundary(row)) {
      segmentIndex += 1;
      firstSegment = false;
      const markerSlug =
        slugify(row.elementId) || firstCustomClassSlug(row) || textSnippetSlug(row);
      currentScope = markerSlug || `s${segmentIndex}`;
      scopeByComponent.set(componentId, currentScope);
      continue;
    }

    let scope = currentScope;
    if (firstSegment && looksLikeHeaderContainer(row, rowsById)) {
      scope = "header";
    }
    assignDeep(componentId, scope);
  }

  for (const row of inventory.components) {
    if (!scopeByComponent.has(row.componentId)) {
      scopeByComponent.set(row.componentId, "main");
    }
  }

  return scopeByComponent;
}

// ---------------------------------------------------------------------------
// Role derivation priority: elementId -> first custom class -> text snippet.
// Empty role falls back to `<scope>-<type>-<componentId>` (always unique).
// ---------------------------------------------------------------------------

function deriveRole(row) {
  return slugify(row.elementId) || firstCustomClassSlug(row) || textSnippetSlug(row);
}

function buildSemanticKey(row, scope, usedKeys) {
  const type = slugify(row.componentType) || "component";
  const role = deriveRole(row);

  let base;
  if (role) {
    base = role.endsWith(type) ? `${scope}-${role}` : `${scope}-${role}-${type}`;
  } else {
    base = `${scope}-${type}-${slugify(row.componentId) || row.componentId}`;
  }

  let key = base;
  let ordinal = 2;
  while (usedKeys.has(key)) {
    key = `${base}-${ordinal}`;
    ordinal += 1;
  }
  usedKeys.add(key);
  return key;
}

function buildAliases(row, semanticKey) {
  const aliases = [];
  const push = (value) => {
    const text = String(value || "").trim();
    if (!text || text === semanticKey) return;
    if (!aliases.includes(text)) aliases.push(text);
  };

  push(row.elementId);
  for (const cls of Array.isArray(row.classes) ? row.classes : []) push(cls);
  const snippet = String(row.textSnippet || "").trim();
  if (snippet) push(snippet.split(/\s+/).slice(0, 6).join(" "));
  push(row.componentType);
  return aliases;
}

// ---------------------------------------------------------------------------
// Catalog application.
// ---------------------------------------------------------------------------

function validateCatalog(catalog) {
  if (!catalog || typeof catalog !== "object") fail("Mutation catalog must be an object.");
  if (!Array.isArray(catalog.knownTypes) || !catalog.knownTypes.length) {
    fail("Mutation catalog must define knownTypes.");
  }
  if (!catalog.universal || !Array.isArray(catalog.universal.allowedMutations)) {
    fail("Mutation catalog must define universal.allowedMutations.");
  }
}

function buildCapabilityPaths(row, catalog) {
  const readPaths = [...(catalog.universal.readPaths || [])];
  const allowedMutations = catalog.universal.allowedMutations.map((item) => ({ ...item }));

  const typeEntry = catalog.types?.[row.componentType];
  if (typeEntry) {
    for (const path of typeEntry.readPaths || []) {
      if (!readPaths.includes(path)) readPaths.push(path);
    }
    for (const mutation of typeEntry.allowedMutations || []) {
      if (!allowedMutations.some((item) => item.path === mutation.path)) {
        allowedMutations.push({ ...mutation });
      }
    }

    if (typeEntry.listPath && Array.isArray(typeEntry.itemFields)) {
      const count = Number(row.listCounts?.[typeEntry.listPath] || 0);
      for (let index = 0; index < count; index += 1) {
        for (const field of typeEntry.itemFields) {
          const path = `${typeEntry.listPath}[${index}].${field.field}`;
          if (!readPaths.includes(path)) readPaths.push(path);
          if (!allowedMutations.some((item) => item.path === path)) {
            allowedMutations.push({
              path,
              valueType: field.valueType,
              description: `${field.description} (item ${index}).`
            });
          }
        }
      }
    }
  }

  return { readPaths, allowedMutations };
}

// ---------------------------------------------------------------------------
// Merge policy for idempotent re-runs: componentId is the stable join key.
// Existing semanticKey, notes, proposedClass are preserved; aliases and
// allowedMutations are unioned so operator additions are never dropped.
// ---------------------------------------------------------------------------

function mergeWithExisting(generated, existingTarget) {
  if (!existingTarget) return generated;

  const aliases = [...existingTarget.aliases || []];
  for (const alias of generated.aliases) {
    if (!aliases.includes(alias)) aliases.push(alias);
  }

  const allowedMutations = (existingTarget.allowedMutations || []).map((item) => ({ ...item }));
  for (const mutation of generated.allowedMutations) {
    if (!allowedMutations.some((item) => item.path === mutation.path)) {
      allowedMutations.push(mutation);
    }
  }

  const readPaths = [...(existingTarget.readPaths || [])];
  for (const path of generated.readPaths) {
    if (!readPaths.includes(path)) readPaths.push(path);
  }

  return {
    ...generated,
    semanticKey: existingTarget.semanticKey,
    aliases,
    readPaths,
    allowedMutations,
    proposedClass: existingTarget.proposedClass || generated.proposedClass,
    notes: existingTarget.notes || generated.notes
  };
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------

export function generateTargets({ inventory, catalog, existingMap = null, semanticNamespace = "cx" }) {
  validateCatalog(catalog);
  if (!inventory || !Array.isArray(inventory.components)) {
    fail("Inventory must define a components array.");
  }

  const knownTypes = new Set(catalog.knownTypes);
  const scopeByComponent = computeSectionScopes(inventory);
  const ordered = orderComponents(inventory);
  const existingByComponentId = new Map(
    (existingMap?.targets || []).map((target) => [target.componentId, target])
  );

  const usedKeys = new Set();
  // Reserve existing keys first so re-runs never steal a stable key.
  for (const target of existingMap?.targets || []) {
    usedKeys.add(target.semanticKey);
  }

  const targets = [];
  const unmapped = [];

  for (const row of ordered) {
    if (!knownTypes.has(row.componentType)) {
      unmapped.push({
        componentId: row.componentId,
        componentType: row.componentType,
        reason: "unsupported-type"
      });
      continue;
    }

    const existingTarget = existingByComponentId.get(row.componentId);
    const scope = scopeByComponent.get(row.componentId) || "main";
    const semanticKey = existingTarget
      ? existingTarget.semanticKey
      : buildSemanticKey(row, scope, usedKeys);

    const { readPaths, allowedMutations } = buildCapabilityPaths(row, catalog);
    const generated = {
      semanticKey,
      componentId: row.componentId,
      componentType: row.componentType,
      aliases: buildAliases(row, semanticKey),
      sectionScope: scope,
      proposedClass: `${semanticNamespace}-${semanticKey}`,
      currentElementId: row.elementId || "",
      existingClasses: Array.isArray(row.classes) ? row.classes : [],
      readPaths,
      allowedMutations,
      notes: "Auto-generated by onboard-site."
    };

    targets.push(mergeWithExisting(generated, existingTarget));
  }

  const removed = (existingMap?.targets || [])
    .filter((target) => !ordered.some((row) => row.componentId === target.componentId))
    .map((target) => ({
      semanticKey: target.semanticKey,
      componentId: target.componentId,
      componentType: target.componentType
    }));

  return {
    targets,
    unmapped,
    removed,
    stats: {
      liveComponents: inventory.components.length,
      mapped: targets.length,
      unmapped: unmapped.length,
      removed: removed.length,
      preservedKeys: targets.filter((target) => existingByComponentId.has(target.componentId)).length
    }
  };
}
