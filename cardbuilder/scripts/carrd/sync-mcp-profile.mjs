#!/usr/bin/env node

import { syncProfile } from "./lib/control-core.mjs";

function parseArgs(argv) {
  const args = {
    site: "",
    port: process.env.CARRD_DEBUG_PORT || "9222",
    live: true,
    write: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--site" && next) {
      args.site = next;
      index += 1;
    } else if (arg === "--port" && next) {
      args.port = next;
      index += 1;
    } else if (arg === "--no-live") {
      args.live = false;
    } else if (arg === "--write") {
      args.write = true;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await syncProfile(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
