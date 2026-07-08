const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "..");

function moduleUrl(...segments) {
  return pathToFileURL(path.join(repoRoot, ...segments)).href;
}

const keygenPromise = import(moduleUrl("cardbuilder", "scripts", "carrd", "lib", "keygen.mjs"));
const onboardingPromise = import(
  moduleUrl("cardbuilder", "scripts", "carrd", "lib", "onboarding-core.mjs")
);
const controlPromise = import(
  moduleUrl("cardbuilder", "scripts", "carrd", "lib", "control-core.mjs")
);
const cdpPromise = import(moduleUrl("cardbuilder", "scripts", "carrd", "lib", "cdp-client.mjs"));
const targetMapPromise = import(
  moduleUrl("cardbuilder", "scripts", "carrd", "lib", "target-map.mjs")
);

const catalog = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "cardbuilder", "data", "mutation-catalog.json"), "utf8")
);

function fixtureInventory() {
  return {
    canvasOrder: ["container02", "container01", "break01", "text09"],
    components: [
      {
        componentId: "container02",
        componentType: "container",
        elementId: "",
        classes: ["site-header"],
        attributes: "",
        childIds: ["image01", "links02"],
        topLevelIndex: 0,
        textSnippet: "",
        listCounts: {}
      },
      {
        componentId: "image01",
        componentType: "image",
        elementId: "logo",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: -1,
        textSnippet: "",
        listCounts: {}
      },
      {
        componentId: "links02",
        componentType: "links",
        elementId: "",
        classes: ["primary-nav"],
        attributes: "",
        childIds: [],
        topLevelIndex: -1,
        textSnippet: "Order FAQ Contacts",
        listCounts: { "links.links": 3 }
      },
      {
        componentId: "container01",
        componentType: "container",
        elementId: "",
        classes: ["txt"],
        attributes: "",
        childIds: ["text01"],
        topLevelIndex: 1,
        textSnippet: "",
        listCounts: {}
      },
      {
        componentId: "text01",
        componentType: "text",
        elementId: "",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: -1,
        textSnippet: "Fresh pasta daily",
        listCounts: {}
      },
      {
        componentId: "break01",
        componentType: "sectionbreak",
        elementId: "faq",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: 2,
        textSnippet: "",
        listCounts: {}
      },
      {
        componentId: "text09",
        componentType: "text",
        elementId: "",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: 3,
        textSnippet: "How fast is delivery",
        listCounts: {}
      },
      {
        componentId: "widget01",
        componentType: "widget",
        elementId: "",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: -1,
        textSnippet: "",
        listCounts: {}
      }
    ],
    totalComponents: 8,
    generatedAt: "2026-07-02T00:00:00.000Z"
  };
}

test("generateTargets is deterministic across runs", async () => {
  const { generateTargets } = await keygenPromise;
  const first = generateTargets({ inventory: fixtureInventory(), catalog });
  const second = generateTargets({ inventory: fixtureInventory(), catalog });
  assert.deepEqual(first, second);
});

test("generateTargets maps every supported component and isolates unsupported types", async () => {
  const { generateTargets } = await keygenPromise;
  const result = generateTargets({ inventory: fixtureInventory(), catalog });

  const mappedIds = result.targets.map((target) => target.componentId).sort();
  assert.deepEqual(mappedIds, [
    "break01",
    "container01",
    "container02",
    "image01",
    "links02",
    "text01",
    "text09"
  ]);
  assert.deepEqual(result.unmapped, [
    { componentId: "widget01", componentType: "widget", reason: "unsupported-type" }
  ]);

  const keys = result.targets.map((target) => target.semanticKey);
  assert.equal(new Set(keys).size, keys.length, "semanticKeys must be unique");
});

test("generateTargets derives header scope and section scopes deterministically", async () => {
  const { generateTargets } = await keygenPromise;
  const result = generateTargets({ inventory: fixtureInventory(), catalog });
  const byId = new Map(result.targets.map((target) => [target.componentId, target]));

  assert.equal(byId.get("container02").sectionScope, "header");
  assert.equal(byId.get("image01").sectionScope, "header");
  assert.equal(byId.get("container01").sectionScope, "main");
  assert.equal(byId.get("text09").sectionScope, "faq", "post-break scope from break elementId");
});

test("generateTargets expands list mutations from live item counts", async () => {
  const { generateTargets } = await keygenPromise;
  const result = generateTargets({ inventory: fixtureInventory(), catalog });
  const links = result.targets.find((target) => target.componentId === "links02");

  const paths = links.allowedMutations.map((item) => item.path);
  for (let index = 0; index < 3; index += 1) {
    assert.ok(paths.includes(`links.links[${index}].label`));
    assert.ok(paths.includes(`links.links[${index}].url`));
  }
  assert.ok(!paths.includes("links.links[3].label"));
});

test("generateTargets preserves existing semanticKeys and unions operator mutations", async () => {
  const { generateTargets } = await keygenPromise;
  const existingMap = {
    targets: [
      {
        semanticKey: "site-header-container",
        componentId: "container02",
        componentType: "container",
        aliases: ["header"],
        proposedClass: "cx-site-header",
        notes: "Operator curated.",
        readPaths: ["settings.element.id"],
        allowedMutations: [
          { path: "custom.operator.path", valueType: "string", description: "Operator-added." }
        ]
      }
    ]
  };

  const result = generateTargets({ inventory: fixtureInventory(), catalog, existingMap });
  const header = result.targets.find((target) => target.componentId === "container02");

  assert.equal(header.semanticKey, "site-header-container");
  assert.equal(header.proposedClass, "cx-site-header");
  assert.equal(header.notes, "Operator curated.");
  assert.ok(header.aliases.includes("header"));
  assert.ok(header.allowedMutations.some((item) => item.path === "custom.operator.path"));
  assert.ok(header.allowedMutations.some((item) => item.path === "settings.element.classes"));
});

test("generateTargets reports removed targets for drift handling", async () => {
  const { generateTargets } = await keygenPromise;
  const existingMap = {
    targets: [
      {
        semanticKey: "ghost-target",
        componentId: "gone01",
        componentType: "text",
        aliases: [],
        readPaths: [],
        allowedMutations: []
      }
    ]
  };
  const result = generateTargets({ inventory: fixtureInventory(), catalog, existingMap });
  assert.deepEqual(result.removed, [
    { semanticKey: "ghost-target", componentId: "gone01", componentType: "text" }
  ]);
});

test("generated targets pass the strict target-map validation contract", async () => {
  const { generateTargets } = await keygenPromise;
  const { loadMcpTargetMap } = await targetMapPromise;
  const result = generateTargets({ inventory: fixtureInventory(), catalog });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-targets-"));
  const mapPath = path.join(tempDir, "mcp-targets.json");
  fs.writeFileSync(
    mapPath,
    JSON.stringify({ meta: { version: 1 }, targets: result.targets }, null, 2)
  );

  const loaded = loadMcpTargetMap({ mcp: { targetMapPath: mapPath } });
  assert.equal(loaded.targets.length, result.targets.length);
});

test("regression: main-template manual map componentIds survive regeneration", async () => {
  const { generateTargets } = await keygenPromise;
  const manualMap = JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        "cardbuilder",
        "projects",
        "main-template",
        "data",
        "manifests",
        "mcp-targets.json"
      ),
      "utf8"
    )
  );

  // Rebuild a live inventory from the manual map's recorded live state.
  const components = manualMap.targets.map((target) => ({
    componentId: target.componentId,
    componentType: target.componentType,
    elementId: target.currentElementId || "",
    classes: target.existingClasses || [],
    attributes: "",
    childIds: target.live?.childIds || [],
    topLevelIndex: target.live?.topLevelIndex ?? -1,
    textSnippet: "",
    listCounts: {}
  }));
  const canvasOrder = components
    .filter((row) => row.topLevelIndex >= 0)
    .sort((left, right) => left.topLevelIndex - right.topLevelIndex)
    .map((row) => row.componentId);

  const result = generateTargets({
    inventory: { components, canvasOrder, generatedAt: "x" },
    catalog,
    existingMap: manualMap
  });

  for (const manual of manualMap.targets) {
    const regenerated = result.targets.find(
      (target) => target.componentId === manual.componentId
    );
    assert.ok(regenerated, `componentId ${manual.componentId} must survive`);
    assert.equal(regenerated.semanticKey, manual.semanticKey, "stable key preserved");
    for (const mutation of manual.allowedMutations) {
      assert.ok(
        regenerated.allowedMutations.some((item) => item.path === mutation.path),
        `mutation ${mutation.path} preserved for ${manual.semanticKey}`
      );
    }
  }
});

test("computeCoverage flags missing and stale components", async () => {
  const { computeCoverage } = await onboardingPromise;
  const inventory = fixtureInventory();
  const targetMap = {
    targets: [
      { componentId: "container02" },
      { componentId: "gone01" }
    ],
    unmapped: [{ componentId: "widget01" }]
  };

  const coverage = computeCoverage({ inventory, targetMap });
  assert.equal(coverage.complete, false);
  assert.ok(coverage.missing.includes("text09"));
  assert.deepEqual(coverage.stale, ["gone01"]);

  const fullMap = {
    targets: inventory.components
      .filter((row) => row.componentType !== "widget")
      .map((row) => ({ componentId: row.componentId })),
    unmapped: [{ componentId: "widget01" }]
  };
  assert.equal(computeCoverage({ inventory, targetMap: fullMap }).complete, true);
});

test("serializeRuntimePayload escapes U+2028/U+2029 line separators", async () => {
  const { serializeRuntimePayload } = await controlPromise;
  const payload = { value: "line break end" };
  const serialized = serializeRuntimePayload(payload);

  assert.ok(!serialized.includes(" "));
  assert.ok(!serialized.includes(" "));
  // Must survive an eval round-trip exactly like Runtime.evaluate would.
  const roundTrip = eval(`(${serialized})`);
  assert.equal(roundTrip.value, "line break end");
});

test("findMatchingSiteTab prioritizes the Builder tab over the published site tab", async () => {
  const { findMatchingSiteTab } = await cdpPromise;
  const site = {
    builderUrl: "https://carrd.co/dashboard/4155176224428477/build",
    publishedSiteUrl: "https://mini.crd.co/"
  };
  const tabs = [
    {
      id: "published",
      type: "page",
      url: "https://mini.crd.co/",
      title: "minigree"
    },
    {
      id: "builder",
      type: "page",
      url: "https://carrd.co/dashboard/4155176224428477/build",
      title: "minigree - My Sites - Dashboard - Carrd"
    }
  ];

  const match = findMatchingSiteTab(tabs, site);
  assert.equal(match.id, "builder");
});

test("evaluateTab rejects with a timeout instead of hanging forever", async () => {
  const { evaluateTab } = await cdpPromise;

  // Minimal WebSocket server that completes the handshake and then goes silent.
  const server = http.createServer();
  const sockets = new Set();
  server.on("connection", (socket) => sockets.add(socket));
  server.on("upgrade", (request, socket) => {
    const key = request.headers["sec-websocket-key"];
    const accept = crypto
      .createHash("sha1")
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest("base64");
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );
    // Never respond to any frame.
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    await assert.rejects(
      () => evaluateTab(`ws://127.0.0.1:${port}/silent`, "1 + 1", { timeoutMs: 250 }),
      /timed out after 250ms/
    );
  } finally {
    for (const socket of sockets) socket.destroy();
    server.close();
  }
});

test("onboardSite requires operator input for unknown builder URLs", async () => {
  const { onboardSite } = await onboardingPromise;
  const report = await onboardSite({
    builderUrl: "https://carrd.co/dashboard/000000/build",
    dryRun: true
  });

  assert.equal(report.status, "operator-input-required");
  assert.deepEqual(report.needed.sort(), ["chromeProfileDir", "slug"]);
});

test("onboardSite fails fast when the Builder tab is unreachable", async () => {
  const { onboardSite } = await onboardingPromise;
  const report = await onboardSite({
    site: "main-template",
    port: "1",
    dryRun: true
  });

  assert.equal(report.status, "builder-unavailable");
  assert.equal(report.readiness.connected, false);
});
