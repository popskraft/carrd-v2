#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const TARGET_ID = "8089177104819774";
const BASE_DIR = path.resolve(__dirname, "..");
const RUN_LOG_PATH = path.join(BASE_DIR, "data", "runs", "MIGRATION_AUTOMATION_RUN.json");

async function run() {
  if (!fs.existsSync(RUN_LOG_PATH)) {
    throw new Error(`Run log not found: ${RUN_LOG_PATH}`);
  }
  const report = JSON.parse(fs.readFileSync(RUN_LOG_PATH, "utf8"));
  const undoCount = (report.results || []).filter((r) => r.status === "ok").length;
  if (!undoCount) {
    console.log("No successful steps in run log, nothing to rollback.");
    return;
  }

  console.log(`Connecting to CDP Chrome ...`);
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  try {
    const page = browser
      .contexts()
      .flatMap((c) => c.pages())
      .find((p) => p.url().includes(`/dashboard/${TARGET_ID}/build`));
    if (!page) throw new Error("Target page not found in CDP session.");

    await page.waitForSelector("#menu", { timeout: 20000 });
    await page.bringToFront();

    const undoBtn = page.locator('#menu [data-action="undo"]').first();
    if ((await undoBtn.count()) === 0) throw new Error("Undo button not found.");

    console.log(`Rolling back ${undoCount} steps using Undo...`);
    for (let i = 0; i < undoCount; i++) {
      await undoBtn.click();
      await page.waitForTimeout(120);
    }
    console.log("Rollback finished.");
    console.log("Save/Publish was not used.");
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error("Rollback failed:", e);
  process.exit(1);
});
