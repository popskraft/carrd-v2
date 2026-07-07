# Carrd Browser Control Architecture

## Purpose

Define how this repo controls Carrd Builder through Chrome and what architecture is required to support many Carrd site instances with different element matrices, style assignments, and plugin topologies.

## When To Use

- before adding a new Carrd site package
- before choosing an automation strategy for a task
- before claiming a workflow is deterministic across projects
- before building or refactoring multi-site browser automation

## Current Architecture

The current system already has four real layers.

### 1. Session bootstrap

Owner files:

- `cardbuilder/data/active-template.json`
- `cardbuilder/scripts/carrd/open-debug-chrome.sh`
- `cardbuilder/scripts/carrd/debug-chrome-status.sh`

Role:

- choose the currently active Carrd site
- start or attach to debug Chrome
- expose the Builder tab and published tab through CDP

Important rule:

- `active-template.json` is a routing pointer, not the durable source of truth for all sites

### 2. Builder-static control plane

Owner files:

- `cardbuilder/scripts/carrd/cdp-eval.mjs`
- `cardbuilder/docs/projects/main-template/BUILDER-GUI-ACTION-MAP.md`
- `cardbuilder/docs/shared/guides/CARRD_DETERMINISTIC_AUDIT.md`

Role:

- reuse Carrd Builder knowledge that is expected to be stable across site instances
- expose a deterministic JS/CDP entrypoint into the live Builder runtime

Observed stable surfaces verified in the live Builder on 2026-06-18:

- `window.app.builder`
- `window.app.builder.site.components`
- `window.app.builder.ui`
- `window.app.builder.ui.propertiesPanel`
- `window.app.builder.ui.propertiesPanel.showById`
- `#menu [data-action]`
- `#canvas .component-wrapper[data-id][data-type]`

### 3. Site package layer

Owner paths:

- `cardbuilder/projects/<site-slug>/data/`
- `cardbuilder/docs/projects/<site-slug>/`

Role:

- store `template-instance` truth for one Carrd site only
- keep scans, inventories, diffs, and runbooks separated per site

This layer already exists for:

- `main-template` (registered)
- `faktura` (registered)
- `lunar-auto-film` (project workspace, not in the site registry)

### 4. Operation layer

This repo currently uses three execution modes.

#### A. Deterministic state-read

Examples:

- `carrd-template-instance-scan.js`
- `carrd-dom-audit.js`
- `carrd-deep-audit-style-map.js`
- `cdp-tab-map-scan.js`

Pattern:

- connect to the live Builder tab
- read `window.app.builder` state or Builder DOM
- serialize normalized evidence into a site package

#### B. Deterministic state-write

Example:

- `refresh-builder-plugins.mjs`

Pattern:

- resolve target embeds by id or title
- mutate live component objects directly
- call `b.site.markChanged(...)`
- call `b.site.syncCanvas("change")`
- call `b.ui.refresh("site")`
- read back content and verify by hash

This is the strongest current write path for plugin/embed updates.

#### C. Best-effort UI automation

Examples:

- `cardbuilder/projects/faktura/automation/*`

Pattern:

- connect to Chrome through Playwright CDP
- click, drag, type, and reorder through the visible UI

This mode is useful for structural Builder operations, but it is the least deterministic path in the repo.

## Scenario Classes

The system is not one workflow. It is a strategy router over several scenario classes.

| Scenario | Preferred mode | Why |
|---|---|---|
| Connect to Builder and confirm readiness | state-read | low risk, reusable |
| Full site scan and drift detection | state-read | canonical evidence path |
| Properties/tabs audit | panel API via state-read | deterministic and cheap |
| Plugin/embed refresh | state-write | exact asset control + readback |
| Simple structured content/config patch | state-write when data path is known | avoid UI fragility |
| Add/reorder/remove visual blocks | best-effort UI automation | Builder layout operations are still UI-heavy |
| Cross-site copy/migration | best-effort UI automation plus site manifests | highly project-specific |

## Deterministic Invariants

These are the parts that can be reused across many sites.

- Chrome remote debugging on a known port
- CDP page discovery through `/json/list`
- the Builder JS root at `window.app.builder`
- the flat component map at `site.components`
- the top toolbar action system at `#menu [data-action]`
- the split between `builder-static` and `template-instance`
- reproducible operation packages with evidence, canonical artifacts, and Markdown interpretation

## Site-Specific Variables

These are the parts that must live in a per-site profile.

- Builder URL
- published URL
- element count and type distribution
- top-level ordering
- anchor/control map
- tabs map for the actual live element set
- semantic container roles
- embed ids, titles, and placements
- plugin inventory
- style names and assignments
- project-specific caveats and unsupported operations

The important point is that the site difference is not only raw DOM order. It is a full profile of structure, style, embeds, and operation capability.

## Current Gaps

### Gap 1. Resolved — per-site Chrome profiles in place

Each site in `sites.json` now has a `chromeProfileDir` field. `open-debug-chrome.sh` reads that field
and uses the matching Chrome user-data directory. Switching `active-template.json` to a different site
automatically launches Chrome under the correct profile. The env var override `CARRD_DEBUG_PROFILE`
remains available for one-off runs.

### Gap 2. Canon is internally inconsistent

Static builder readings and live Builder verification can conflict on interaction methods.

Example:

- older static readings could not confirm `propertiesPanel.showById()`; live Builder verification on 2026-06-18 shows `propertiesPanel.showById` is a working function
- DOM `.click()` can produce false conclusions, so live evidence is preferred over static-only readings

Impact:

- an agent can choose the wrong interaction method if it trusts a static reading over live verification

### Gap 3. No explicit capability matrix per operation type

The repo has real modes, but not a single contract that says which mode is allowed for which class of task.

Impact:

- structural operations may incorrectly reuse plugin-refresh assumptions
- high-friction tasks fall back to ad hoc probes

### Gap 4. Site packages store evidence, but not enough normalized operation bindings

Current site packages are strong on scans and reports, but weaker on reusable action bindings such as:

- semantic target registry
- preferred write strategy by operation type
- stable embed/title mapping
- manual-review zones

Impact:

- future sessions must rediscover too much before editing safely

## Target Architecture

The target model should be a four-layer architecture with an explicit per-site profile contract.

### Layer A. Builder-static core

Scope:

- shared Carrd Builder runtime knowledge
- CDP transport
- stable selectors and panel/action rules
- proven internal APIs

Owner:

- `cardbuilder/scripts/carrd/*`
- shared Builder docs

### Layer B. Site registry

Scope:

- one active pointer for operator convenience
- a registry entry for every known site package

Minimum contract per site:

- `siteSlug`
- `builderUrl`
- `publishedSiteUrl`
- `projectWorkspace`
- `projectDocs`
- `knowledgeStatusManifest`
- `runtimeMode`
- `savePublishPolicy`

`active-template.json` should remain only the selected current entry, not the only registry surface.

### Layer C. Site profile package

Each site package should hold a normalized profile with four views.

#### 1. Structure view

- component snapshot
- top-level order
- parent/child graph
- control and anchor map
- tabs map

#### 2. Semantic view

- container registry by role
- section names
- known action targets
- manual danger zones

#### 3. Runtime asset view

- live embed inventory
- plugin/title/id map
- source-vs-live sync diff
- style assignment map

#### 4. Capability view

- which operations are supported deterministically
- which require panel driving
- which require pointer/UI automation
- which are operator-only

### Layer D. Operation engine

Every task should use the same pipeline:

1. Resolve site package from Builder URL or explicit slug.
2. Run freshness gate against the site manifest.
3. Classify the requested scenario.
4. Select the lowest-risk execution mode from the capability view.
5. Capture before-state evidence.
6. Execute.
7. Read back deterministically.
8. Update canonical artifacts if truth changed.
9. Ask the operator only at the publish or ambiguous-impact boundary.

## Recommended Site Profile Schema

The repo does not need a complex database. A compact JSON contract is enough.

Suggested file:

- `cardbuilder/projects/<site-slug>/data/manifests/site-profile.json`

Minimum fields:

```json
{
  "siteSlug": "example-site",
  "builderUrl": "https://carrd.co/dashboard/.../build",
  "publishedSiteUrl": "https://example.crd.co/",
  "structure": {
    "tabsSnapshot": "data/snapshots/template-instance-element-tabs-map-YYYY-MM-DD.json",
    "builderScan": "data/snapshots/template-instance-builder-scan.json",
    "styleMap": "data/style-maps/template-instance-style-map.json"
  },
  "runtimeAssets": {
    "liveInventory": "data/inventories/live-plugin-inventory.json",
    "syncDiff": "data/diffs/template-vs-repo-plugin-sync.json"
  },
  "capabilities": {
    "scan": "state-read",
    "embedRefresh": "state-write",
    "contentPatch": "state-write",
    "layoutMutation": "ui-automation",
    "publish": "operator-only"
  },
  "caveats": [
    "Nested container reorder is not deterministic enough for blind automation."
  ]
}
```

## Architecture Decision

The correct model for this repo is not “one universal Carrd automation workflow”.

The correct model is:

- one shared Builder control core
- many site-specific profiles
- one strategy router that selects the safest execution mode per scenario

This lets the repo support many Carrd projects even when they share the same plugin system but differ in element matrix, style topology, and operational risk.

## Implementation Order

1. Normalize canon conflicts around interaction methods.
   - prefer live Builder verification over static-only readings; keep static readings caveated until reproduced live
2. Add `site-profile.json` to each site package.
3. Add a small registry of known site packages instead of relying only on one active pointer.
4. Teach drift and readiness commands to resolve the site package from the live Builder URL first.
5. Move project-specific Playwright/CDP automations behind the capability model instead of leaving them as isolated probes.
6. Only after that, build new multi-site mutation flows.

## Edge Cases

- If two sites share the same plugin bundle, they still need separate site profiles.
- If a draft copy has no published URL yet, keep it as its own site package with `publishedSiteUrl: null`.
- If Builder-static behavior changes, update the shared control core first, then re-run affected site profiles.
- If a task needs layout mutation but the capability view says `ui-automation`, do not pretend it is as deterministic as embed refresh.

## Done

This architecture is in place when:

- every live Builder URL resolves to a site package
- every site package has a capability-aware profile
- every operation chooses its execution mode deliberately
- deterministic tasks no longer depend on ad hoc probes
- non-deterministic tasks are explicitly marked as such instead of being described as generic automation
