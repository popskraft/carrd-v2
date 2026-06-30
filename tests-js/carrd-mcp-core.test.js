const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePath = pathToFileURL(
  path.resolve(__dirname, "..", "cardbuilder", "scripts", "carrd", "lib", "control-core.mjs")
).href;

let coreModulePromise;

function loadCoreModule() {
  if (!coreModulePromise) {
    coreModulePromise = import(modulePath);
  }
  return coreModulePromise;
}

test("listProfiles reports MCP-enabled main-template and faktura entries", async () => {
  const { listProfiles } = await loadCoreModule();
  const profiles = listProfiles();

  const mainTemplate = profiles.find((item) => item.siteSlug === "main-template");
  const faktura = profiles.find((item) => item.siteSlug === "faktura");

  assert.ok(mainTemplate);
  assert.equal(mainTemplate.mcpEnabled, true);
  assert.equal(mainTemplate.targetCount >= 10, true);
  assert.equal(mainTemplate.contractMode, "bootstrap-file-first");

  assert.ok(faktura);
  assert.equal(faktura.mcpEnabled, true);
  assert.equal(faktura.targetCount, 0);
  assert.equal(faktura.contractMode, "profile-needs-targeting-pass");
});

test("resolveTarget resolves an exact semantic key for main-template", async () => {
  const { resolveTarget } = await loadCoreModule();
  const result = resolveTarget({
    site: "main-template",
    semanticKey: "site-header-container"
  });

  assert.equal(result.resolution.status, "exact");
  assert.equal(result.resolution.target.semanticKey, "site-header-container");
  assert.equal(result.resolution.target.componentId, "container02");
});

test("resolveTarget reports ambiguity for generic container query", async () => {
  const { resolveTarget } = await loadCoreModule();
  const result = resolveTarget({
    site: "main-template",
    query: "container"
  });

  assert.equal(result.resolution.status, "ambiguous");
  assert.equal(result.resolution.candidates.length >= 2, true);
});

test("parsePath expands array paths used by allowlisted mutations", async () => {
  const { parsePath } = await loadCoreModule();
  const segments = parsePath("links.links[2].url");

  assert.deepEqual(segments, ["links", "links", 2, "url"]);
});

test("updateTarget rejects unsupported deterministic writes on faktura before live access", async () => {
  const { updateTarget } = await loadCoreModule();

  await assert.rejects(
    () =>
      updateTarget({
        site: "faktura",
        semanticKey: "anything",
        path: "settings.element.classes",
        value: "cx-test",
        commit: false
      }),
    /does not allow deterministic contentPatch writes/
  );
});

test("syncProfile can inspect faktura without live access or targets", async () => {
  const { syncProfile } = await loadCoreModule();
  const result = await syncProfile({
    site: "faktura",
    live: false,
    write: false
  });

  assert.equal(result.siteSlug, "faktura");
  assert.equal(result.targetCount, 0);
  assert.deepEqual(result.result, []);
});
