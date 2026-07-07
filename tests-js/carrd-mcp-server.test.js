const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const readline = require("node:readline");
const { spawn } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const serverPath = path.join(repoRoot, "cardbuilder", "scripts", "carrd", "carrd-mcp-server.mjs");

function startServer() {
  const child = spawn(process.execPath, [serverPath], {
    cwd: repoRoot,
    stdio: ["pipe", "pipe", "pipe"]
  });

  const lines = readline.createInterface({
    input: child.stdout,
    crlfDelay: Infinity
  });

  const pending = new Map();

  lines.on("line", (line) => {
    const payload = JSON.parse(line);
    const resolver = pending.get(payload.id);
    if (resolver) {
      pending.delete(payload.id);
      resolver(payload);
    }
  });

  function request(id, method, params) {
    return new Promise((resolve) => {
      pending.set(id, resolve);
      child.stdin.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id,
          method,
          ...(params === undefined ? {} : { params })
        })}\n`
      );
    });
  }

  function stop() {
    lines.close();
    child.kill("SIGTERM");
  }

  return { request, stop };
}

test("MCP server supports discover, initialize, tools/list, and read-only tool calls", async (t) => {
  const server = startServer();
  t.after(() => server.stop());

  const discover = await server.request(1, "server/discover");
  assert.deepEqual(discover.result.supportedVersions, ["2025-11-25"]);
  assert.equal(discover.result.serverInfo.name, "carrd-builder-mcp");

  const initialize = await server.request(2, "initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "test", version: "0.0.0" }
  });
  assert.equal(initialize.result.protocolVersion, "2025-11-25");

  const toolsList = await server.request(3, "tools/list", {});
  const toolNames = toolsList.result.tools.map((tool) => tool.name);
  assert.deepEqual(toolNames, [
    "list_profiles",
    "check_profile",
    "sync_profile",
    "onboard_site",
    "resolve_target",
    "read_target",
    "update_target"
  ]);

  const profiles = await server.request(4, "tools/call", {
    name: "list_profiles",
    arguments: {}
  });
  assert.equal(Array.isArray(profiles.result.structuredContent.profiles), true);
  assert.equal(
    profiles.result.structuredContent.profiles.some((item) => item.siteSlug === "main-template"),
    true
  );

  const resolved = await server.request(5, "tools/call", {
    name: "resolve_target",
    arguments: {
      site: "main-template",
      semanticKey: "hero-title-text"
    }
  });
  assert.equal(resolved.result.structuredContent.resolution.status, "exact");
  assert.equal(
    resolved.result.structuredContent.resolution.target.semanticKey,
    "hero-title-text"
  );
});
