# Columns To Grid Cluster Migration Plan

## Purpose

Prepare the universal main template for migration from legacy `columns` to the modern `grid-cluster + cards` system.

This document is an execution plan.
It is not the migration itself.

## Decision Basis

Owner-approved baseline:

- keep `cards`
- keep `grid-cluster`
- remove `columns` from the universal template baseline

Technical readiness basis:

- `grid-cluster` grid logic is at parity with the grid portion of `columns`
- the missing `justify` CSS parity rule was restored and covered by tests
- current blocking unrelated test failures remain in `header-nav` and `slider`, not in `grid-cluster`
- current live template evidence shows `embed05` is a legacy combined `columns + cards` inline embed, so the migration must replace both layers together

## Scope

### In scope

- replace `columns` plugin usage in the live main template
- preserve `cards`
- preserve existing grid authoring semantics where possible
- update plugin/config embeds in Carrd Builder
- validate the result in Builder and published view

### Out of scope

- redesigning page content
- adding optional plugins such as `header-nav`, `cookie-banner`, `no-loadwaiting`
- changing publish ownership rules

## Migration Principle

The migration should behave like a plugin-layer replacement, not a content rewrite.

Target architecture:

- card styling layer: `cards`
- grid clustering layer: `grid-cluster`

Legacy layer to remove:

- `columns`

## Expected Compatibility

The migration is low-risk because `grid-cluster` already supports the same grid authoring vocabulary used by the template:

- `.grid-2` to `.grid-6`
- `.grid-sm-2`
- `.justify`
- width helper classes such as `.w-20` to `.w-80`

This means the likely migration surface is:

1. plugin assets
2. plugin config
3. verification of any edge-case layout that depended on legacy combined behavior

Not the raw Carrd content structure itself.

## Pre-Migration Checks

Before touching the Builder:

1. Confirm current active template registry:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/data/active-template.json`
2. Confirm latest scan manifest:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/manifests/knowledge-status.json`
3. Confirm current live plugin baseline:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json`
4. Confirm current sync decision:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/PLUGIN-SYNC-REVIEW.md`
5. Confirm current GUI action map for Builder operations:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/BUILDER-GUI-ACTION-MAP.md`
6. Confirm exact live replacement targets:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/LIVE-PLUGIN-REFRESH-MAP.md`
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/live-embed-replacement-map.json`

## Builder-Side Migration Steps

### Phase 1 — Freeze The Current Baseline

Goal:

- make current state explicit before changing plugin embeds

Actions:

1. Record which Carrd embed blocks currently reference `columns`.
2. Record which embed/config blocks currently reference `cards`.
3. Record any shared `window.CarrdPluginOptions.columns` config still present in the template.
4. Record current published behavior for all grid/card sections that matter to the universal template.

Expected output:

- explicit list of `columns` references to remove or replace

### Phase 2 — Prepare Replacement Inputs

Goal:

- define the target asset/config state before editing Builder embeds

Target plugin layer:

- keep `cards`
- add or enable `grid-cluster`
- remove `columns`

Prepared replacement assets:

- HEAD foundation:
  - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/head-theme-foundation-0.1.15.html`
- BODY END staged combined replacement:
  - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/embed05-cards-grid-cluster-0.1.15.html`
- BODY END final split replacements:
  - `/Users/popskraft/Projects/carrd-v2/dist/cards/cards-embed.html`
  - `/Users/popskraft/Projects/carrd-v2/dist/grid-cluster/grid-cluster-embed.html`

Target config rule:

- move any still-needed grid options from `window.CarrdPluginOptions.columns` to `window.CarrdPluginOptions.gridCluster`
- keep card options under `window.CarrdPluginOptions.cards`
- remove legacy dependence on `window.CarrdPluginOptions.columns` where practical

Likely mapping:

- `columns.gridClasses` -> `gridCluster.gridClasses`
- `columns.widthClasses` -> `gridCluster.widthClasses`
- `columns.cardSelector` and `columns.defaultCardBg` should remain under `cards`, not under grid config

### Phase 3 — Replace Plugin Assets In Builder

Goal:

- swap the live template from legacy `columns` assets to `grid-cluster`

Operational sequence:

1. Open the template in Builder.
2. Replace `embed02` with the prepared HEAD foundation file so the token layer can safely support both old and new plugin names during migration.
3. Locate `embed05` titled `Columns`.
4. Replace its content with the prepared combined replacement as a safe staging step, or directly split it into separate embeds if the Builder workflow allows it cleanly.
5. Final desired live structure:
   - `embed05` -> `Cards`
   - new following embed -> `Grid Cluster`
6. Remove the live dependence on legacy `columns` behavior for the grid layer.
7. If any explicit `window.CarrdPluginOptions.columns` settings still exist separately, remap them to:
   - `window.CarrdPluginOptions.gridCluster`
   - `window.CarrdPluginOptions.cards`

Safety rule:

- do not Save/Publish automatically unless explicitly authorized by the owner

### Phase 4 — Builder Validation

Goal:

- verify that Builder state already reflects the intended migration before publish handoff

Check these in Builder:

1. Consecutive `.grid-*` containers still cluster correctly.
2. `.grid-sm-2` behavior still appears correct on mobile view.
3. `.justify` groups still stretch correctly.
4. width-helper-based desktop templates still apply.
5. `.cards` styling still works exactly where expected.
6. no section loses layout because the old combined plugin used to provide both grid and cards behavior in one script.

### Phase 5 — Published-View Validation

Goal:

- confirm no regression in the user-facing site

Validation path:

- use `view-site` in Builder and/or the published URL

Check these in published view:

1. all grid groups preserve their intended column structure
2. card sections still render as cards
3. no double-wrapping or broken spacing appears
4. desktop widths and mobile behavior remain acceptable
5. image frames in grid sections still constrain correctly where expected

### Phase 6 — Post-Migration Canon Update

After successful migration:

1. run a fresh `template-instance` scan
2. regenerate:
   - live plugin inventory
   - template-vs-repo sync diff
   - template-instance scan report
3. confirm:
   - `columns` is no longer detected live
   - `grid-cluster` is detected live
4. update plugin sync review to mark the migration complete

## Acceptance Criteria

The migration is considered complete only if all of the following are true:

1. live template detects `grid-cluster`
2. live template no longer detects `columns`
3. `cards` remains detected and working
4. `cards` and `grid-cluster` are separated into their own live embed blocks
5. grid layout behavior remains acceptable in both Builder and published view
6. no new plugin mismatch is introduced by the replacement

## Known Watchouts

1. Combined legacy behavior
   - `columns` historically combined grid + cards
   - ensure both layers are still present after the replacement

2. Hidden legacy config
   - old `window.CarrdPluginOptions.columns` values may still silently influence behavior
   - remove or remap them explicitly

3. False success in Builder
   - Builder-side structure may look acceptable while published output still differs
   - always validate published view

4. Unrelated repo red tests
   - `header-nav` and `slider` currently have known red tests
   - these are not blockers for this migration, but they should not be confused with migration regressions

## Recommended Execution Order

1. identify all live `columns` references
2. prepare the exact replacement asset/config block
3. swap `columns` out and `grid-cluster` in
4. validate in Builder
5. validate in published view
6. run a fresh scan package
7. update canonical sync artifacts
