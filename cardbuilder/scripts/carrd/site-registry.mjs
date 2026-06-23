import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(MODULE_DIR, "../../..");
export const DEFAULT_REGISTRY_PATH = path.join(REPO_ROOT, "cardbuilder/data/sites.json");
export const DEFAULT_ACTIVE_TEMPLATE_PATH = path.join(REPO_ROOT, "cardbuilder/data/active-template.json");

function fail(message) {
  throw new Error(message);
}

export function normalizeSlug(value) {
  return String(value || "").trim();
}

export function normalizeUrlLike(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/[?#].*$/, "").replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
}

export function looksLikeUrlRef(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return /:\/\//.test(raw) || raw.includes("/") || raw.includes(".");
}

export function readJsonFile(filePath) {
  if (!filePath) fail("Missing JSON file path.");
  if (!fs.existsSync(filePath)) fail(`JSON file not found: ${filePath}`);

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Failed to parse JSON file ${filePath}: ${error.message}`);
  }
}

function normalizePathLike(value) {
  const raw = String(value || "").trim();
  return raw ? path.normalize(raw) : "";
}

function compareFieldValues(field, left, right) {
  const leftText = String(left || "").trim();
  const rightText = String(right || "").trim();
  if (!leftText && !rightText) return true;
  if (!leftText || !rightText) return false;

  if (field.toLowerCase().includes("url")) {
    return normalizeUrlLike(leftText) === normalizeUrlLike(rightText);
  }

  if (field.toLowerCase().includes("path")) {
    return normalizePathLike(leftText) === normalizePathLike(rightText);
  }

  return leftText === rightText;
}

function validateRegistryEntry(entry, index) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    fail(`Registry entry at index ${index} must be an object.`);
  }

  if (!normalizeSlug(entry.siteSlug)) {
    fail(`Registry entry at index ${index} is missing siteSlug.`);
  }

  if (!normalizeSlug(entry.templateId)) {
    fail(`Registry entry "${entry.siteSlug}" is missing templateId.`);
  }

  if (!normalizeSlug(entry.builderUrl)) {
    fail(`Registry entry "${entry.siteSlug}" is missing builderUrl.`);
  }

  if (!normalizeSlug(entry.projectWorkspace)) {
    fail(`Registry entry "${entry.siteSlug}" is missing projectWorkspace.`);
  }

  if (!normalizeSlug(entry.knowledgeStatusManifest)) {
    fail(`Registry entry "${entry.siteSlug}" is missing knowledgeStatusManifest.`);
  }

  if (!normalizeSlug(entry.profilePath)) {
    fail(`Registry entry "${entry.siteSlug}" is missing profilePath.`);
  }

  if (!normalizeSlug(entry.runtimeMode)) {
    fail(`Registry entry "${entry.siteSlug}" is missing runtimeMode.`);
  }

  if (!normalizeSlug(entry.savePublishPolicy)) {
    fail(`Registry entry "${entry.siteSlug}" is missing savePublishPolicy.`);
  }
}

function validateExistingPaths(entry) {
  const requiredPaths = [
    ["projectWorkspace", entry.projectWorkspace],
    ["knowledgeStatusManifest", entry.knowledgeStatusManifest],
    ["profilePath", entry.profilePath]
  ];

  for (const [label, filePath] of requiredPaths) {
    if (!fs.existsSync(filePath)) {
      fail(`Registry entry "${entry.siteSlug}" references missing ${label}: ${filePath}`);
    }
  }

  if (entry.projectDocs && !fs.existsSync(entry.projectDocs)) {
    fail(`Registry entry "${entry.siteSlug}" references missing projectDocs: ${entry.projectDocs}`);
  }
}

function validateUniqueKeys(entries) {
  const slugIndex = new Map();
  const templateIndex = new Map();
  const builderIndex = new Map();
  const publishedIndex = new Map();

  for (const entry of entries) {
    const slugKey = normalizeSlug(entry.siteSlug);
    const templateKey = normalizeSlug(entry.templateId);
    const builderKey = normalizeUrlLike(entry.builderUrl);
    const publishedKey = normalizeUrlLike(entry.publishedSiteUrl);

    for (const [index, key, label] of [
      [slugIndex, slugKey, "siteSlug"],
      [templateIndex, templateKey, "templateId"]
    ]) {
      if (!key) continue;
      if (index.has(key) && index.get(key) !== entry.siteSlug) {
        fail(`Duplicate ${label} in registry: ${key}`);
      }
      index.set(key, entry.siteSlug);
    }

    if (builderKey) {
      if (builderIndex.has(builderKey) && builderIndex.get(builderKey) !== entry.siteSlug) {
        fail(`Duplicate builderUrl in registry: ${entry.builderUrl}`);
      }
      builderIndex.set(builderKey, entry.siteSlug);
    }

    if (publishedKey) {
      if (publishedIndex.has(publishedKey) && publishedIndex.get(publishedKey) !== entry.siteSlug) {
        fail(`Duplicate publishedSiteUrl in registry: ${entry.publishedSiteUrl}`);
      }
      publishedIndex.set(publishedKey, entry.siteSlug);
    }
  }
}

export function loadRegistry(registryPath = DEFAULT_REGISTRY_PATH) {
  const registry = readJsonFile(registryPath);

  if (!Array.isArray(registry)) {
    fail(`Registry file must contain an array: ${registryPath}`);
  }

  registry.forEach(validateRegistryEntry);
  registry.forEach(validateExistingPaths);
  validateUniqueKeys(registry);

  return registry;
}

export function loadActiveTemplate(activeTemplatePath = DEFAULT_ACTIVE_TEMPLATE_PATH) {
  return readJsonFile(activeTemplatePath);
}

export function loadSiteProfile(profilePath) {
  const profile = readJsonFile(profilePath);

  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    fail(`Site profile must be an object: ${profilePath}`);
  }

  return profile;
}

export function profileSnapshotDir(profile) {
  const snapshotPath =
    profile?.structure?.tabsMap ||
    profile?.structure?.builderScan ||
    profile?.structure?.domAudit ||
    profile?.structure?.styleMap;

  if (snapshotPath) {
    return path.dirname(snapshotPath);
  }

  if (profile?.projectWorkspace) {
    return path.join(profile.projectWorkspace, "data/snapshots");
  }

  return null;
}

function findRegistryEntryBySlug(registry, siteRef) {
  const normalized = normalizeSlug(siteRef);
  const matches = registry.filter((entry) => {
    const keys = [entry.siteSlug, entry.templateId, ...(Array.isArray(entry.aliases) ? entry.aliases : [])];
    return keys.some((key) => normalizeSlug(key) === normalized);
  });

  if (matches.length > 1) {
    fail(`Registry slug reference is ambiguous: ${siteRef}`);
  }

  return matches[0] || null;
}

function findRegistryEntryByUrl(registry, urlRef) {
  const normalized = normalizeUrlLike(urlRef);
  const matches = registry.filter((entry) => {
    const keys = [entry.builderUrl, entry.publishedSiteUrl, ...(Array.isArray(entry.aliasUrls) ? entry.aliasUrls : [])];
    return keys.some((key) => normalizeUrlLike(key) === normalized);
  });

  if (matches.length > 1) {
    fail(`Registry URL reference is ambiguous: ${urlRef}`);
  }

  return matches[0] || null;
}

function validateActiveTemplate(activeTemplate, site) {
  if (!activeTemplate || !site) return;

  const comparisons = [
    ["activeTemplateId", activeTemplate.activeTemplateId, site.siteSlug],
    ["templateId", activeTemplate.activeTemplateId || activeTemplate.templateId, site.templateId],
    ["builderUrl", activeTemplate.builderUrl, site.builderUrl],
    ["publishedSiteUrl", activeTemplate.publishedSiteUrl, site.publishedSiteUrl],
    ["projectWorkspace", activeTemplate.projectWorkspace, site.projectWorkspace],
    ["projectDocs", activeTemplate.projectDocs, site.projectDocs],
    ["knowledgeStatusManifest", activeTemplate.knowledgeStatusManifest, site.knowledgeStatusManifest],
    ["pluginSourceRoot", activeTemplate.pluginSourceRoot, site.pluginSourceRoot],
    ["pluginDistRoot", activeTemplate.pluginDistRoot, site.pluginDistRoot],
    ["runtimeMode", activeTemplate.runtimeMode, site.runtimeMode],
    ["savePublishPolicy", activeTemplate.savePublishPolicy, site.savePublishPolicy]
  ];

  for (const [field, left, right] of comparisons) {
    if (!compareFieldValues(field, left, right)) {
      fail(`Active template pointer does not match registry for ${field}.`);
    }
  }
}

export function resolveSite(options = {}) {
  const registryPath = options.registryPath || DEFAULT_REGISTRY_PATH;
  const activeTemplatePath =
    options.activeTemplatePath === undefined
      ? DEFAULT_ACTIVE_TEMPLATE_PATH
      : options.activeTemplatePath;

  const registry = loadRegistry(registryPath);
  const activeTemplate = activeTemplatePath ? loadActiveTemplate(activeTemplatePath) : null;

  const explicitSiteRef = normalizeSlug(options.siteRef || options.siteSlug || options.templateId || "");
  const explicitBuilderUrl = normalizeUrlLike(options.builderUrl || "");
  const explicitPublishedUrl = normalizeUrlLike(options.publishedSiteUrl || "");
  const explicitDebugUrl = normalizeUrlLike(options.debugTabUrl || "");

  let site = null;
  let matchedBy = null;

  if (explicitSiteRef) {
    if (looksLikeUrlRef(explicitSiteRef)) {
      site = findRegistryEntryByUrl(registry, explicitSiteRef);
      matchedBy = "site-ref-url";
    } else {
      site = findRegistryEntryBySlug(registry, explicitSiteRef);
      matchedBy = "site-ref-slug";
    }
  }

  if (!site && explicitBuilderUrl) {
    site = findRegistryEntryByUrl(registry, explicitBuilderUrl);
    matchedBy = "builderUrl";
  }

  if (!site && explicitPublishedUrl) {
    site = findRegistryEntryByUrl(registry, explicitPublishedUrl);
    matchedBy = "publishedSiteUrl";
  }

  if (!site && explicitDebugUrl) {
    site = findRegistryEntryByUrl(registry, explicitDebugUrl);
    matchedBy = "debugTabUrl";
  }

  if (!site && activeTemplate) {
    const activeRef = normalizeSlug(
      activeTemplate.activeTemplateId || activeTemplate.templateId || activeTemplate.siteSlug || ""
    );
    if (activeRef) {
      site = findRegistryEntryBySlug(registry, activeRef);
      matchedBy = "activeTemplateId";
    }
    if (!site && activeTemplate.builderUrl) {
      site = findRegistryEntryByUrl(registry, activeTemplate.builderUrl);
      matchedBy = "activeTemplate.builderUrl";
    }
  }

  if (!site) {
    fail("Unable to resolve site from registry.");
  }

  const profile = site.profilePath ? loadSiteProfile(site.profilePath) : null;
  if (activeTemplate) {
    const activeSlug = normalizeSlug(
      activeTemplate.activeTemplateId || activeTemplate.templateId || activeTemplate.siteSlug || ""
    );
    const activeBuilder = normalizeUrlLike(activeTemplate.builderUrl || "");
    const resolvedSlug = normalizeSlug(site.siteSlug || site.templateId || "");
    const resolvedBuilder = normalizeUrlLike(site.builderUrl || "");

    if (
      (activeSlug && activeSlug === resolvedSlug) ||
      (activeBuilder && activeBuilder === resolvedBuilder)
    ) {
      validateActiveTemplate(activeTemplate, site);
    }
  }

  return {
    registryPath,
    activeTemplatePath,
    matchedBy,
    activeTemplate,
    site,
    profile
  };
}
