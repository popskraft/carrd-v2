#!/usr/bin/env node

import path from "node:path";

import {
  planCanonicalMigration,
  writeMigrationPlanReport
} from "./lib/migration-core.mjs";

function parseArgs(argv) {
  const args = {
    sourceSite: "",
    sourceFile: "",
    canonSite: "main-template",
    output: "",
    runId: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--source-site" && next) {
      args.sourceSite = next;
      index += 1;
    } else if (arg === "--source-file" && next) {
      args.sourceFile = next;
      index += 1;
    } else if (arg === "--canon-site" && next) {
      args.canonSite = next;
      index += 1;
    } else if (arg === "--output" && next) {
      args.output = next;
      index += 1;
    } else if (arg === "--run-id" && next) {
      args.runId = next;
      index += 1;
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.sourceSite && !args.sourceFile) {
  console.error("Pass --source-site <registered-site> or --source-file <inventory-or-builder-scan.json>.");
  process.exit(2);
}

try {
  const report = planCanonicalMigration({
    sourceSite: args.sourceSite || undefined,
    sourceFile: args.sourceFile || undefined,
    canonSite: args.canonSite || "main-template",
    runId: args.runId || undefined
  });

  if (args.output) {
    const written = writeMigrationPlanReport(report, path.resolve(args.output));
    report.output = written;
  }

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
