import fs from "node:fs";

function fail(message) {
  throw new Error(message);
}

function readJsonFile(filePath) {
  if (!filePath) fail("Missing target map path.");
  if (!fs.existsSync(filePath)) fail(`Target map file not found: ${filePath}`);

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Failed to parse target map ${filePath}: ${error.message}`);
  }
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

function validateTarget(target, index) {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    fail(`Target at index ${index} must be an object.`);
  }
  if (!String(target.semanticKey || "").trim()) {
    fail(`Target at index ${index} is missing semanticKey.`);
  }
  if (!String(target.componentId || "").trim()) {
    fail(`Target "${target.semanticKey}" is missing componentId.`);
  }
  if (!String(target.componentType || "").trim()) {
    fail(`Target "${target.semanticKey}" is missing componentType.`);
  }
  if (!Array.isArray(target.readPaths)) {
    fail(`Target "${target.semanticKey}" must define readPaths.`);
  }
  if (!Array.isArray(target.allowedMutations)) {
    fail(`Target "${target.semanticKey}" must define allowedMutations.`);
  }
}

export function loadMcpTargetMap(profile) {
  const targetMapPath = profile?.mcp?.targetMapPath;
  const targetMap = readJsonFile(targetMapPath);

  if (!targetMap || typeof targetMap !== "object" || Array.isArray(targetMap)) {
    fail(`Target map must be an object: ${targetMapPath}`);
  }
  if (!Array.isArray(targetMap.targets)) {
    fail(`Target map must define a targets array: ${targetMapPath}`);
  }

  targetMap.targets.forEach(validateTarget);
  return targetMap;
}

export function getTargetCandidateStrings(target) {
  return [
    target.semanticKey,
    ...(Array.isArray(target.aliases) ? target.aliases : []),
    target.proposedClass,
    target.currentElementId,
    ...(Array.isArray(target.existingClasses) ? target.existingClasses : []),
    ...(Array.isArray(target.live?.classes) ? target.live.classes : []),
    target.notes
  ].filter(Boolean);
}

export function summarizeTarget(target) {
  return {
    semanticKey: target.semanticKey,
    componentId: target.componentId,
    componentType: target.componentType,
    aliases: Array.isArray(target.aliases) ? target.aliases : [],
    proposedClass: target.proposedClass || "",
    currentElementId: target.currentElementId || "",
    contractStatus:
      target.live?.proposedClassApplied === true ? "class-applied" : "bootstrap-file-first",
    allowedMutations: Array.isArray(target.allowedMutations)
      ? target.allowedMutations.map((item) => ({
          path: item.path,
          valueType: item.valueType,
          description: item.description || ""
        }))
      : [],
    live: target.live || null
  };
}

export function getAllowedMutation(target, requestedPath) {
  return (Array.isArray(target.allowedMutations) ? target.allowedMutations : []).find(
    (mutation) => mutation.path === requestedPath
  ) || null;
}

export function resolveTargetDefinition(targetMap, request = {}) {
  const semanticKey = String(request.semanticKey || "").trim();
  const componentId = String(request.componentId || "").trim();
  const query = String(request.query || "").trim();

  if (semanticKey) {
    const exact = targetMap.targets.find((target) => target.semanticKey === semanticKey);
    if (exact) {
      return {
        status: "exact",
        reason: "semanticKey",
        target: exact,
        candidates: [summarizeTarget(exact)]
      };
    }
  }

  if (componentId) {
    const exact = targetMap.targets.find((target) => target.componentId === componentId);
    if (exact) {
      return {
        status: "exact",
        reason: "componentId",
        target: exact,
        candidates: [summarizeTarget(exact)]
      };
    }
  }

  if (!query) {
    return {
      status: "not_found",
      reason: "no-query",
      target: null,
      candidates: []
    };
  }

  const normalizedQuery = normalizeText(query);
  for (const target of targetMap.targets) {
    const exactMatch = getTargetCandidateStrings(target).find(
      (candidate) => normalizeText(candidate) === normalizedQuery
    );
    if (exactMatch) {
      return {
        status: "exact",
        reason: `exact:${exactMatch}`,
        target,
        candidates: [summarizeTarget(target)]
      };
    }
  }

  const queryTokens = tokenize(query);
  if (!queryTokens.length) {
    return {
      status: "not_found",
      reason: "empty-query",
      target: null,
      candidates: []
    };
  }

  const scored = targetMap.targets
    .map((target) => {
      let bestScore = 0;
      let bestLabel = "";
      for (const candidate of getTargetCandidateStrings(target)) {
        const candidateTokens = tokenize(candidate);
        if (!candidateTokens.length) continue;
        const matched = queryTokens.filter((token) => candidateTokens.includes(token)).length;
        if (!matched) continue;
        const score = matched / Math.max(queryTokens.length, candidateTokens.length);
        if (score > bestScore) {
          bestScore = score;
          bestLabel = candidate;
        }
      }

      return {
        target,
        score: bestScore,
        label: bestLabel
      };
    })
    .filter((row) => row.score > 0)
    .sort((left, right) => right.score - left.score || left.target.semanticKey.localeCompare(right.target.semanticKey));

  if (!scored.length || scored[0].score < 0.5) {
    return {
      status: "not_found",
      reason: "no-confident-match",
      target: null,
      candidates: []
    };
  }

  const bestScore = scored[0].score;
  const top = scored.filter((row) => row.score === bestScore);

  if (top.length > 1) {
    return {
      status: "ambiguous",
      reason: "multiple-high-score-matches",
      target: null,
      candidates: top.slice(0, 5).map((row) => summarizeTarget(row.target))
    };
  }

  return {
    status: "candidate",
    reason: `fuzzy:${scored[0].label}`,
    target: scored[0].target,
    candidates: scored.slice(0, 5).map((row) => summarizeTarget(row.target))
  };
}
