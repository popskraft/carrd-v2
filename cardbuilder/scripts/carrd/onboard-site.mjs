#!/usr/bin/env node

// One-command site onboarding: Builder URL -> full MCP target map + readiness.
//
// Usage:
//   node cardbuilder/scripts/carrd/onboard-site.mjs --site main-template --dry-run
//   node cardbuilder/scripts/carrd/onboard-site.mjs --builder-url <url> \
//     --slug <slug> --chrome-profile-dir <dir> [--published-url <url>]
//
// Flags:
//   --dry-run              report only, write nothing (default: write)
//   --no-write-enable      do not auto-enable capabilities.contentPatch
//   --no-panel-probe       skip per-component properties-panel tabs probe
//   --port <port>          CDP debug port (default 9222 / CARRD_DEBUG_PORT)
//
// Operator boundary: Chrome debug session + Carrd login + open Builder tab,
// slug and chromeProfileDir for new sites. Save/publish stays operator-only.

import { onboardSite } from "./lib/onboarding-core.mjs";

function parseArgs(argv) {
  const args = {
    site: "",
    builderUrl: "",
    slug: "",
    chromeProfileDir: "",
    publishedSiteUrl: "",
    port: "",
    dryRun: false,
    autoEnableWrite: true,
    panelProbe: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--site" && next) {
      args.site = next;
      index += 1;
    } else if (arg === "--builder-url" && next) {
      args.builderUrl = next;
      index += 1;
    } else if (arg === "--slug" && next) {
      args.slug = next;
      index += 1;
    } else if (arg === "--chrome-profile-dir" && next) {
      args.chromeProfileDir = next;
      index += 1;
    } else if (arg === "--published-url" && next) {
      args.publishedSiteUrl = next;
      index += 1;
    } else if (arg === "--port" && next) {
      args.port = next;
      index += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--no-write-enable") {
      args.autoEnableWrite = false;
    } else if (arg === "--no-panel-probe") {
      args.panelProbe = false;
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.site && !args.builderUrl) {
  console.error("Pass --site <registered-ref> or --builder-url <carrd-builder-url>.");
  process.exit(2);
}

try {
  const report = await onboardSite({
    site: args.site,
    builderUrl: args.builderUrl,
    slug: args.slug,
    chromeProfileDir: args.chromeProfileDir,
    publishedSiteUrl: args.publishedSiteUrl,
    port: args.port || undefined,
    dryRun: args.dryRun,
    autoEnableWrite: args.autoEnableWrite,
    panelProbe: args.panelProbe
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "operator-input-required" || report.status === "builder-unavailable") {
    process.exit(1);
  }
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
