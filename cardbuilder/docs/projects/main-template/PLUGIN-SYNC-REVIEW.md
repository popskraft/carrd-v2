# Plugin Sync Review

## Purpose

Provide the first decision-oriented review of plugin alignment between the live main template and the repo plugin bundle.

This document does not change the live template by itself.
It turns the deterministic scan package into a concrete sync decision surface.

## Draft Caveat

As of `2026-04-07`, the active Builder draft has a pending `0.1.17` plugin rollout recorded in:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/PLUGIN-ROLLOUT-0.1.17-DRAFT-EXECUTION.md](/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/PLUGIN-ROLLOUT-0.1.17-DRAFT-EXECUTION.md)

That draft now includes refreshed current plugin embeds plus newly inserted `Typography` and `Header Nav`.

This review still describes the last published/canonical template-instance baseline until owner publish and a fresh post-publish scan supersede it.

## Inputs

- `TEMPLATE-INSTANCE-SCAN-REPORT.md`
- `live-plugin-inventory.json`
- `template-vs-repo-plugin-sync.json`
- `/Users/popskraft/Projects/carrd-v2/src`
- `/Users/popskraft/Projects/carrd-v2/dist`

## Baseline Summary

### Confirmed live in template

- `cards`
- `faq`
- `grid-cluster`
- `modal`
- `no-loadwaiting`
- `shopping-cart`
- `slider`

### Present in repo but not detected live

- `columns`
- `cookie-banner`
- `header-nav`
- `typography`

### Important structural note

`grid-cluster` is live, while `columns` is no longer detected live.

This matters because:

- `columns` is documented in the repo as a deprecated legacy compatibility plugin
- `grid-cluster` is the intended modern grid behavior for new pages
- the current post-migration template now reflects that intended direction instead of the old legacy grid layer

## Decision Categories

### Category A — Keep As Current Baseline

These plugins are already detected live and align with the current template behavior.

1. `cards`
2. `faq`
3. `modal`
4. `shopping-cart`
5. `slider`
6. `typography`

Current decision:

- keep them in the live baseline
- treat them as currently integrated
- only revisit if the template architecture changes

### Category B — Approved Migration Direction

1. `columns` -> `grid-cluster`

Interpretation:

- the live template currently proves the older `columns` layer
- the repo direction says new work should prefer `grid-cluster` and `cards`

Owner decision:

- the universal template should keep `grid-cluster`
- `columns` should be removed from the universal template baseline
- the two block/grid-driving layers for the baseline become:
  - `cards`
  - `grid-cluster`

Current sync recommendation:

- treat `grid-cluster` as required for the target baseline
- treat `columns` as legacy behavior already removed from the live template baseline
- do not preserve `columns` just for backward-compatible showcase reasons unless the owner later reopens that decision
- execute the replacement through `COLUMNS-TO-GRID-CLUSTER-MIGRATION-PLAN.md`
- current live Builder draft execution status is recorded in `COLUMNS-TO-GRID-CLUSTER-MIGRATION-DRAFT-EXECUTION.md`
- preferred final live implementation shape is now separate embeds for `Cards` and `Grid Cluster`, not a permanently combined replacement block

Priority:

- high strategic importance
- approved baseline change

### Category C — Likely Optional / Product-Decision Plugins

These plugins are not inherently required in every universal template and may remain absent by design.

1. `cookie-banner`
   - likely depends on legal/compliance scope, locale, and site policy
   - absence is not automatically drift

2. `no-loadwaiting`
   - useful as a performance/UX helper
   - absence is not automatically drift
   - should be installed only if its effect is part of the intended baseline experience

Current sync recommendation:

- treat these as opt-in plugins
- do not classify their absence as a defect without product intent

### Category D — Review Before Sync

1. `header-nav`

Interpretation:

- a universal template often benefits from a strong reusable header/navigation pattern
- but this plugin is not detected live
- current repo tests for `header-nav` are already failing, so promoting it into the baseline right now would increase uncertainty instead of reducing it

Current sync recommendation:

- do not install or rely on `header-nav` in the live template until the plugin itself is re-stabilized
- decide later whether the universal template should use:
  - plain Carrd navigation only
  - a repaired `header-nav`
  - a different navigation pattern

Priority:

- medium product importance
- lower implementation readiness at the moment because of existing test failures

## Recommended Sync Order

### Step 1 — Lock the current baseline

Treat the current live baseline as:

- `cards`
- `faq`
- `grid-cluster`
- `modal`
- `no-loadwaiting`
- `shopping-cart`
- `slider`

This is the current truth of the main template.

### Step 2 — Separate intentional absence from missing integration

For each repo-only plugin, classify it as one of:

- intentionally absent
- desired in baseline
- desired later but blocked

Best current default classification:

- `cookie-banner` -> intentionally absent unless compliance scope says otherwise
- `columns` -> intentionally absent because the migration to `grid-cluster` is complete
- `header-nav` -> desired only after plugin stabilization and explicit template design decision
- `no-loadwaiting` -> already installed in the live baseline
- `typography` -> intentionally absent unless the template explicitly adopts it as a dedicated plugin layer

### Step 3 — Avoid false "sync completeness"

Do not say the template is fully synchronized with `src/` just because all live plugins exist in the repo.

The more accurate statement is:

- the live template is synchronized with a subset of repo plugins
- the repo contains additional plugins that are currently not part of the main-template baseline

### Step 4 — Use explicit target states

Future sync work should use one of these target states:

1. conservative baseline
   - keep current live set
   - no new plugins added

2. modernized baseline
   - already achieved for the current template:
   - `columns` removed
   - `grid-cluster` installed
   - `no-loadwaiting` installed
   - `header-nav` postponed until stable

3. expanded showcase baseline
   - keep current live set
   - selectively add future product-demo plugins only if the template grows a matching section

## Current Recommendation

The strongest next sync move is not "install all missing plugins".

The strongest next sync move is:

1. accept the current live baseline as intentional for now
2. treat the `columns` -> `grid-cluster` migration as complete
3. keep `header-nav` out of baseline sync until its test failures are addressed
4. treat `cookie-banner` and `typography` as optional unless the template scope changes

Operational consequence:

- the current live template now matches the intended target grid baseline
- the target baseline for block/grid composition is:
  - `cards`
  - `grid-cluster`
- once the draft Builder replacement is reviewed and published, the sync baseline must be re-scanned before this document is treated as fully current again

## Decision Snapshot

| Plugin | Current status | Sync posture |
|---|---|---|
| cards | live | keep |
| columns | repo-only, legacy | keep absent from universal template baseline |
| cookie-banner | repo-only | optional |
| faq | live | keep |
| grid-cluster | live | keep |
| header-nav | repo-only | hold until stabilized and chosen |
| modal | live | keep |
| no-loadwaiting | live | keep |
| shopping-cart | live | keep |
| slider | live | keep |
| typography | repo-only | optional |
