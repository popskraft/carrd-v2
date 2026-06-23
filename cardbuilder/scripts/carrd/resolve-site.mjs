#!/usr/bin/env node

import {
  DEFAULT_ACTIVE_TEMPLATE_PATH,
  DEFAULT_REGISTRY_PATH,
  resolveSite
} from "./site-registry.mjs";

function parseArgs(argv) {
  const args = {
    registryPath: DEFAULT_REGISTRY_PATH,
    activeTemplatePath: DEFAULT_ACTIVE_TEMPLATE_PATH,
    siteRef: "",
    builderUrl: "",
    publishedSiteUrl: "",
    debugTabUrl: "",
    field: ""
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--registry" && next) {
      args.registryPath = next;
      i += 1;
    } else if (arg === "--active-template" && next) {
      args.activeTemplatePath = next;
      i += 1;
    } else if (arg === "--site" && next) {
      args.siteRef = next;
      i += 1;
    } else if (arg === "--builder-url" && next) {
      args.builderUrl = next;
      i += 1;
    } else if (arg === "--published-url" && next) {
      args.publishedSiteUrl = next;
      i += 1;
    } else if (arg === "--debug-url" && next) {
      args.debugTabUrl = next;
      i += 1;
    } else if (arg === "--field" && next) {
      args.field = next;
      i += 1;
    }
  }

  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getField(resolved, field) {
  if (!field) return resolved;
  if (field in resolved) return resolved[field];
  if (resolved.site && field in resolved.site) return resolved.site[field];
  if (resolved.profile && field in resolved.profile) return resolved.profile[field];
  return undefined;
}

function printValue(value) {
  if (value === undefined || value === null) {
    process.stdout.write("\n");
    return;
  }

  if (typeof value === "string") {
    process.stdout.write(`${value}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const resolved = resolveSite({
    registryPath: args.registryPath,
    activeTemplatePath: args.activeTemplatePath,
    siteRef: args.siteRef,
    builderUrl: args.builderUrl,
    publishedSiteUrl: args.publishedSiteUrl,
    debugTabUrl: args.debugTabUrl
  });

  if (args.field) {
    printValue(getField(resolved, args.field));
    return;
  }

  printValue(resolved);
}

try {
  main();
} catch (error) {
  fail(error && error.message ? error.message : String(error));
}
