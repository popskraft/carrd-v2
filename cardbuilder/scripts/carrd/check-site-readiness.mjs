#!/usr/bin/env node

import { DEFAULT_ACTIVE_TEMPLATE_PATH, DEFAULT_REGISTRY_PATH } from "./site-registry.mjs";
import { checkSiteReadiness } from "./lib/readiness-core.mjs";

function parseArgs(argv) {
  const args = {
    port: process.env.CARRD_DEBUG_PORT || "9222",
    site: "",
    registry: DEFAULT_REGISTRY_PATH,
    activeTemplate: DEFAULT_ACTIVE_TEMPLATE_PATH,
    noFail: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--port" && next) {
      args.port = next;
      i += 1;
    } else if (arg === "--site" && next) {
      args.site = next;
      i += 1;
    } else if (arg === "--registry" && next) {
      args.registry = next;
      i += 1;
    } else if (arg === "--active-template" && next) {
      args.activeTemplate = next;
      i += 1;
    } else if (arg === "--no-fail") {
      args.noFail = true;
    }
  }

  return args;
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function line(name, value) {
  console.log(`${name}: ${value}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const readiness = await checkSiteReadiness({
    port: args.port,
    site: args.site,
    registry: args.registry,
    activeTemplate: args.activeTemplate
  });

  line("connected", readiness.connected ? "true" : "false");
  line("authenticated", readiness.authenticated ? "true" : "false");
  line("builder-ready", readiness.builderReady ? "true" : "false");
  line("site-resolved", readiness.siteResolved ? "true" : "false");
  line("profile-freshness", readiness.profileFreshness.status);
  for (const reason of readiness.profileFreshness.reasons) {
    line("freshness-reason", reason);
  }
  line("safe-to-edit", readiness.safeToEdit ? "true" : "false");
  line("site", readiness.resolved.site.siteSlug);
  line("matched-by", readiness.resolved.matchedBy);

  if (readiness.tab) {
    line("tab", `${readiness.tab.title || ""} | ${readiness.tab.url || ""}`);
  }

  if (!readiness.safeToEdit && !args.noFail) {
    process.exit(1);
  }
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
