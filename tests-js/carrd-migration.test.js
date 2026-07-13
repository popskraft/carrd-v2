const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "..");
const migrationModule = import(
  pathToFileURL(
    path.join(repoRoot, "cardbuilder", "scripts", "carrd", "lib", "migration-core.mjs")
  ).href
);

function legacyBuilderScanFixture() {
  return {
    meta: { generatedAt: "2026-07-13T10:00:00.000Z" },
    topLevel: {
      items: [
        {
          index: 0,
          dataId: "container01",
          dataType: "container",
          textSample: "Fresh pasta daily"
        },
        {
          index: 1,
          dataId: "control01",
          dataType: "control",
          textSample: "Section break"
        }
      ]
    },
    components: {
      safeById: {
        container01: {
          id: "container01",
          container: {},
          settings: {
            element: {
              id: "",
              classes: "hero-block",
              attributes: ""
            }
          },
          children: {
            text01: {
              id: "text01",
              text: {
                html: "<p>Fresh pasta daily</p>"
              },
              settings: {
                element: {
                  id: "hero-title",
                  classes: "",
                  attributes: ""
                }
              },
              children: {}
            }
          }
        },
        control01: {
          id: "control01",
          control: {},
          settings: {
            element: {
              id: "faq",
              classes: "",
              attributes: ""
            }
          },
          children: {}
        }
      }
    }
  };
}

function sourceInventoryFixture() {
  return {
    generatedAt: "2026-07-13T10:00:00.000Z",
    canvasOrder: ["container01", "control01", "text09"],
    components: [
      {
        componentId: "container01",
        componentType: "container",
        elementId: "",
        classes: ["hero-block"],
        attributes: "",
        childIds: ["text01"],
        topLevelIndex: 0,
        textSnippet: "",
        listCounts: {},
        tabs: []
      },
      {
        componentId: "text01",
        componentType: "text",
        elementId: "hero-title",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: -1,
        textSnippet: "Fresh pasta daily",
        listCounts: {},
        tabs: ["Content"]
      },
      {
        componentId: "control01",
        componentType: "control",
        elementId: "faq",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: 1,
        textSnippet: "FAQ",
        listCounts: {},
        tabs: []
      },
      {
        componentId: "text09",
        componentType: "text",
        elementId: "",
        classes: [],
        attributes: "",
        childIds: [],
        topLevelIndex: 2,
        textSnippet: "How fast is delivery",
        listCounts: {},
        tabs: ["Content"]
      }
    ]
  };
}

function canonSnapshotFixture() {
  return {
    snapshotId: "canon-fixture",
    canonSite: "main-template",
    semanticNamespace: "cx",
    targets: [
      {
        semanticKey: "main-hero-block-container",
        componentType: "container",
        sectionScope: "main",
        aliases: ["hero-block"],
        currentElementId: "",
        existingClasses: ["hero-block"],
        proposedClass: "cx-main-hero-block-container",
        readPaths: [],
        allowedMutations: [],
        live: {
          childIds: ["textX"],
          topLevelIndex: 0,
          tabs: [],
          classes: ["hero-block"],
          elementId: ""
        }
      },
      {
        semanticKey: "main-hero-title-text",
        componentType: "text",
        sectionScope: "main",
        aliases: ["hero title", "Fresh pasta daily"],
        currentElementId: "hero-title",
        existingClasses: [],
        proposedClass: "cx-main-hero-title-text",
        readPaths: [],
        allowedMutations: [],
        live: {
          childIds: [],
          topLevelIndex: -1,
          tabs: ["Content"],
          classes: [],
          elementId: "hero-title"
        }
      },
      {
        semanticKey: "faq-faq-control",
        componentType: "control",
        sectionScope: "faq",
        aliases: ["faq"],
        currentElementId: "faq",
        existingClasses: [],
        proposedClass: "cx-faq-faq-control",
        readPaths: [],
        allowedMutations: [],
        live: {
          childIds: [],
          topLevelIndex: 1,
          tabs: [],
          classes: [],
          elementId: "faq"
        }
      },
      {
        semanticKey: "main-shopping-cart-order-form-container",
        componentType: "container",
        sectionScope: "main",
        aliases: ["shopping cart form"],
        currentElementId: "",
        existingClasses: [],
        proposedClass: "cx-main-shopping-cart-order-form-container",
        readPaths: [],
        allowedMutations: [],
        live: {
          childIds: [],
          topLevelIndex: 3,
          tabs: [],
          classes: [],
          elementId: ""
        }
      }
    ]
  };
}

test("builderScanToInventory converts the legacy builder scan format", async () => {
  const { builderScanToInventory } = await migrationModule;
  const inventory = builderScanToInventory(legacyBuilderScanFixture());

  assert.deepEqual(inventory.canvasOrder, ["container01", "control01"]);
  assert.equal(inventory.totalComponents, 3);
  assert.equal(inventory.components.find((row) => row.componentId === "text01").textSnippet, "Fresh pasta daily");
});

test("freezeCanonSnapshot builds a deterministic snapshot from the live canon package", async () => {
  const { freezeCanonSnapshot } = await migrationModule;
  const first = freezeCanonSnapshot({ canonSite: "main-template", generatedAt: "2026-07-13T10:00:00.000Z" });
  const second = freezeCanonSnapshot({ canonSite: "main-template", generatedAt: "2026-07-13T10:00:00.000Z" });

  assert.equal(first.snapshotId, second.snapshotId);
  assert.equal(first.canonSite, "main-template");
  assert.ok(first.stats.targetCount >= 10);
});

test("normalizeSourceInventory is deterministic for the same input", async () => {
  const { normalizeSourceInventory } = await migrationModule;
  const first = normalizeSourceInventory({ sourceInventory: sourceInventoryFixture(), sourceRef: "fixture-a" });
  const second = normalizeSourceInventory({ sourceInventory: sourceInventoryFixture(), sourceRef: "fixture-a" });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(first.totalComponents, 4);
  assert.equal(first.nodes[0].sectionScope, "main");
});

test("planCanonicalMigration compiles a dry-run plan with mappings, manual resolution, and create operations", async () => {
  const { planCanonicalMigration } = await migrationModule;
  const report = planCanonicalMigration({
    sourceInventory: sourceInventoryFixture(),
    sourceRef: "fixture-source",
    canonSnapshot: canonSnapshotFixture(),
    runId: "migration-test-run"
  });

  assert.equal(report.run.runId, "migration-test-run");
  assert.equal(report.canonSnapshot.snapshotId, "canon-fixture");
  assert.equal(report.planStatus, "manual-resolution-required");
  assert.equal(report.summary.operationSummary.ANNOTATE >= 1, true);
  assert.equal(report.summary.operationSummary.MANUAL_REQUIRED, 1);
  assert.equal(report.summary.operationSummary.CREATE_COMPONENT, 1);
  assert.equal(report.approvals.some((gate) => gate.kind === "destructive-operations"), true);
});

test("finalizeRunVerdict rejects PASS when approval or verification gates are still pending", async () => {
  const {
    createMigrationRun,
    finalizeRunVerdict,
    queueApprovalGate,
    queueVerificationGate
  } = await migrationModule;

  const run = createMigrationRun({ runId: "guarded-run" });
  queueApprovalGate(run, "save", "Save is irreversible.");
  queueVerificationGate(run, "persistence", "Persistence proof required.");

  assert.throws(() => finalizeRunVerdict(run, "PASS"), /PASS requires approved gates/);
});

test("writeMigrationPlanReport persists the dry-run report", async () => {
  const { planCanonicalMigration, writeMigrationPlanReport } = await migrationModule;
  const report = planCanonicalMigration({
    sourceInventory: sourceInventoryFixture(),
    sourceRef: "fixture-source",
    canonSnapshot: canonSnapshotFixture()
  });
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "carrd-migration-"));
  const outputPath = path.join(tempDir, "plan.json");

  writeMigrationPlanReport(report, outputPath);
  const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));

  assert.equal(written.run.runId, report.run.runId);
  assert.equal(written.planStatus, report.planStatus);
});
