# Carrd Browser Control Implementation Plan

## Goal

Implement the Carrd browser-control architecture so the repo can manage many Carrd Builder projects through Chrome/CDP with deterministic routing, per-site profiles, explicit operation capabilities, and reproducible evidence.

This plan implements the architecture recorded in:

- `cardbuilder/docs/shared/guides/CARRD_BROWSER_CONTROL_ARCHITECTURE.md`

## Goals and KPIs

| Goal | Success signal |
|---|---|
| Resolve every Builder URL to the correct local site package | a command can map a live Builder URL or explicit slug to one `cardbuilder/projects/<site-slug>/` and one `cardbuilder/docs/projects/<site-slug>/` |
| Stop relying on one global template path for all operations | `active-template.json` remains a pointer, while known sites are listed in a registry and site truth lives in site packages |
| Make operation mode selection explicit | every scan/edit command declares `state-read`, `state-write`, `ui-automation`, or `operator-only` before it runs |
| Preserve current working flows | existing `main-template` and `lunar-auto-film` scans still work after resolver changes |
| Reduce wrong-action risk | docs and scripts agree on `propertiesPanel.showById`, DOM click limits, and Playwright/UI automation boundaries |
| Keep future changes testable | profile schema, registry resolver, and drift resolver have automated tests or deterministic smoke checks |

## Current State

Audit date: 2026-06-18.

### Confirmed Current Architecture

The repo already has the correct raw materials:

- shared CDP evaluator: `cardbuilder/scripts/carrd/cdp-eval.mjs`
- debug Chrome bootstrap: `cardbuilder/scripts/carrd/open-debug-chrome.sh`
- debug Chrome status: `cardbuilder/scripts/carrd/debug-chrome-status.sh`
- template scan scripts under `cardbuilder/scripts/carrd/`
- site packages under `cardbuilder/projects/<site-slug>/`
- site docs under `cardbuilder/docs/projects/<site-slug>/`
- deterministic evidence packages under `data/snapshots/`, `data/inventories/`, `data/diffs/`, and `data/raw-imports/`

### Confirmed Site Packages

Existing packages:

- `main-template`
- `lunar-auto-film`
- `faktura`

Separate migration workspace:

- `koryphey-online`

### Confirmed Runtime Evidence

Live Builder evidence from the previous connection check showed:

- `window.app.builder` exists
- `window.app.builder.site.components` exists
- `window.app.builder.ui.propertiesPanel` exists
- `window.app.builder.ui.propertiesPanel.showById` is a function
- `#menu [data-action]` exposes Builder actions

Current CDP audit state:

- Chrome debug endpoint on `127.0.0.1:9222` is reachable
- no matching Builder page tab was available during this plan audit
- no live mutation was performed

### Validation State

Commands run during the audit:

- `npm run lint --silent`: passed
- `npm run test --silent`: passed
- `npm run verify:dist --silent`: passed
- `node cardbuilder/scripts/carrd/check-site-readiness.mjs --site main-template --no-fail`: passed

Current caveat:

- the live Builder readiness smoke is now verified on `main-template`; other site packages still depend on a matching authenticated tab being open in debug Chrome

## Context Sufficiency

Status: `sufficient for planning`, `insufficient for implementation without approval`.

Enough is known to design the architecture and implementation sequence:

- project root is `/Users/popskraft/Projects/carrd-v2`
- working subsystem is `/Users/popskraft/Projects/carrd-v2/cardbuilder`
- current browser-control entrypoints are known
- existing site-package pattern is known
- main risks and current validation failures are known

Implementation should wait for owner approval because the work changes project architecture, scripts, and docs. It does not require production publish or irreversible Carrd mutations.

## Scope

### In Scope

- site registry contract
- site profile schema
- resolver utilities
- readiness and drift commands that resolve site package by URL or slug
- documentation canon cleanup for browser-control behavior
- migration path for `main-template` and `lunar-auto-film`
- test/smoke coverage for registry/profile behavior

### Out of Scope

- publishing Carrd sites
- changing plugin runtime behavior in `src/`
- fixing unrelated `switcher` test failure unless it blocks implementation validation
- rebuilding or committing unrelated `dist/` drift unless the owner approves
- rewriting all historical docs
- replacing all Playwright automation immediately

## Assumptions

- `active-template.json` remains as an operator convenience pointer.
- A new registry file is allowed under `cardbuilder/data/`.
- Per-site canonical profile files belong under `cardbuilder/projects/<site-slug>/data/manifests/`.
- Existing `main-template` and `lunar-auto-film` package paths should not be renamed.
- `propertiesPanel.showById` is currently valid for panel/tabs reads, but scripts must verify it at runtime before relying on it.
- DOM `.click()` examples in shared docs should be downgraded or marked as UI-specific, not used as generic deterministic guidance.

## Open Questions

### Blocking Before Implementation

- None. `faktura` is included in the live registry/profile first wave, and the `switcher`/`dist` blockers were fixed before registry integration continued.

### Non-Blocking

- Should registry entries include tags such as `draft`, `client`, `template`, and `archive`?
- Should operation reports be grouped by operation id or by date-first folder naming?
- Should old `main-template` docs be rewritten to stop saying the registry is canonical, or only patched where they affect execution?

## Dependencies

### Internal

- `cardbuilder/data/active-template.json`
- `cardbuilder/scripts/carrd/cdp-eval.mjs`
- `cardbuilder/scripts/carrd/open-debug-chrome.sh`
- `cardbuilder/scripts/carrd/debug-chrome-status.sh`
- `cardbuilder/scripts/carrd/check-element-tabs-drift.mjs`
- `cardbuilder/scripts/carrd/refresh-builder-plugins.mjs`
- `cardbuilder/projects/<site-slug>/data/manifests/knowledge-status.json`
- `cardbuilder/docs/shared/guides/CARRD_BROWSER_CONTROL_ARCHITECTURE.md`
- `cardbuilder/docs/shared/guides/CARRD_PER_SITE_PROCESS.md`

### External

- Chrome with remote debugging enabled
- authenticated Carrd session in the debug Chrome profile
- local Node runtime
- local Python runtime for repo validation scripts

## Acceptance Criteria

| Criterion | Must Be True | Evidence |
|---|---|---|
| AC-01 | `cardbuilder/data/sites.json` or equivalent registry must exist and include known site packages. | registry file plus resolver output |
| AC-02 | `active-template.json` must validate against the registry entry for the active site. | validator command output |
| AC-03 | `site-profile.json` must exist for `main-template` and `lunar-auto-film`. | file existence plus schema validation |
| AC-04 | resolver must resolve by site slug, exact Builder URL, active pointer, and live debug tab URL when a Builder tab is open. | resolver test output |
| AC-05 | `check-element-tabs-drift.mjs` must accept a site package or profile path and must not silently default all work to `main-template`. | command output for `main-template` and `lunar-auto-film` |
| AC-06 | `open-debug-chrome.sh` must still open the active pointer with current environment variables. | dry or live smoke output |
| AC-07 | readiness checks must report `connected`, `authenticated`, `builder-ready`, `site-resolved`, `profile-freshness`, and `safe-to-edit`. | readiness command output |
| AC-08 | active docs must not contain contradictory executable guidance for `propertiesPanel.showById` and generic DOM `.click()` use. | `rg` check plus reviewed doc diff |
| AC-09 | implementation and validation must not trigger Carrd publish/save actions. | command review and absence of `quickPublish` execution |
| AC-10 | `npm run lint --silent` must pass. | command output |
| AC-11 | resolver/profile tests must pass. | test command output |
| AC-12 | known unrelated validation failures must either be fixed or explicitly recorded as pre-existing blockers outside this implementation. | handoff note or fixed test/dist output |

## Pipeline

### Phase 0. Preflight Freeze

Purpose:

- establish the exact starting state before edits

Owner:

- main agent

Inputs:

- `git status --short`
- current `active-template.json`
- current debug Chrome status
- current validation failures

Outputs:

- short preflight note in the implementation log or final handoff

Validation gate:

- no unclassified live Builder mutation
- no unrelated dirty files touched

Related criteria:

- 9, 12

Rollback:

- no code changes in this phase

### Phase 1. Registry Contract

Purpose:

- add a stable multi-site registry while preserving `active-template.json`

Owner:

- main agent

Inputs:

- `active-template.json`
- known site package manifests
- existing per-site docs

Outputs:

- `cardbuilder/data/sites.json`
- optional `cardbuilder/scripts/carrd/resolve-site.mjs`
- JSON schema or inline validator for registry entries

Validation gate:

- resolver maps `main-template` and `lunar-auto-film` correctly
- resolver rejects unknown Builder URL with clear error
- `active-template.json` still parses and points to one registry entry

Related criteria:

- 1, 2, 4

Fallback:

- if registry feels too heavy, use `cardbuilder/data/sites/<slug>.json` files and generate an index later

### Phase 2. Site Profile Schema

Purpose:

- introduce one normalized capability-aware profile per site

Owner:

- main agent

Inputs:

- `knowledge-status.json`
- latest builder scan
- latest tabs map
- live plugin inventory
- sync diff

Outputs:

- `cardbuilder/projects/main-template/data/manifests/site-profile.json`
- `cardbuilder/projects/lunar-auto-film/data/manifests/site-profile.json`
- shared profile schema or validator

Validation gate:

- every profile references existing artifacts or marks the artifact as missing
- every capability value is one of:
  - `state-read`
  - `state-write`
  - `panel-api`
  - `ui-automation`
  - `operator-only`
  - `unsupported`

Related criteria:

- 3, 7

Fallback:

- create minimal profiles first, then fill semantic and capability details after resolver is stable

### Phase 3. Resolver Integration

Purpose:

- make scripts use site resolution instead of hardcoded `main-template` defaults

Owner:

- main agent

Inputs:

- registry
- site profiles
- existing scripts

Outputs:

- updated `check-element-tabs-drift.mjs`
- updated readiness/check command or new `check-site-readiness.mjs`
- updated debug/status guidance

Validation gate:

- `check-element-tabs-drift.mjs --site main-template` works
- `check-element-tabs-drift.mjs --site lunar-auto-film` works
- default behavior is explicit:
  - active pointer
  - live tab
  - or clear error

Related criteria:

- 4, 5, 7

Rollback:

- keep old arguments supported during transition

### Phase 4. Canon Cleanup

Purpose:

- remove contradictions that can lead agents to wrong browser actions

Owner:

- main agent plus project-documenter discipline

Inputs:

- `CARRD_AGENT_INSTRUCTION.md` (legacy bridge only; do not use as active source of truth)
- `CARRD_BROWSER_CONTROL_ARCHITECTURE.md`
- `CARRD_PER_SITE_PROCESS.md`
- `TEMPLATE-INSTANCE-SCAN-RUNBOOK.md`
- external skill notes if maintained separately

Outputs:

- patched shared docs
- updated runbook language:
  - `propertiesPanel.showById` is allowed only after runtime verification
  - DOM `.click()` is not generic deterministic guidance
  - Playwright locator/mouse clicks are classified as `ui-automation`

Validation gate:

- `rg` finds no unqualified generic guidance telling agents to use DOM `.click()` as the primary deterministic action path
- docs clearly separate state-read, state-write, panel-api, UI automation, and operator-only actions

Related criteria:

- 8

Fallback:

- if a historical doc must keep old text, add a clear superseded warning and link to the new contract

### Phase 5. Operation Engine Boundary

Purpose:

- prevent future mutation scripts from being one-off hardcoded project tools

Owner:

- main agent

Inputs:

- `refresh-builder-plugins.mjs`
- existing operation packages under `data/raw-imports/`
- profile capabilities

Outputs:

- extraction plan or first utility for:
  - resolve site
  - read profile
  - classify operation
  - require backup/readback for writes

Validation gate:

- no existing plugin refresh behavior breaks
- new mutation flow refuses to run when site profile is missing or capability is not allowed

Related criteria:

- 7, 9

Fallback:

- leave `refresh-builder-plugins.mjs` intact and wrap it with a preflight guard before deeper refactor

### Phase 6. Tests and Validation

Purpose:

- prove architecture-level behavior without requiring live Carrd mutation

Owner:

- main agent

Inputs:

- registry/profile utilities
- fixture registry entries
- existing package scripts

Outputs:

- Node tests for resolver/profile validation
- documented smoke commands

Validation gate:

- `npm run lint --silent`
- targeted Node tests for resolver/profile
- `node cardbuilder/scripts/carrd/check-element-tabs-drift.mjs --site main-template --no-fail-on-drift`
- `node cardbuilder/scripts/carrd/check-element-tabs-drift.mjs --site lunar-auto-film --no-fail-on-drift`

Related criteria:

- 10, 11, 12

Fallback:

- if full `npm run test` still fails due to pre-existing `switcher`, report it separately and do not claim full repo green

### Phase 7. Live Read-Only Smoke

Purpose:

- verify the new resolver against a real debug Chrome session without editing Carrd

Owner:

- main agent with operator session available

Inputs:

- debug Chrome page list
- live Builder tab
- resolver
- site profile

Outputs:

- readiness report

Validation gate:

- live Builder URL resolves to site package
- builder readiness flags are true
- no publish/save action occurs

Related criteria:

- 4, 7, 9

Stop condition:

- no authenticated Builder tab is open

## Validation

Minimum validation before implementation is accepted:

```bash
cd /Users/popskraft/Projects/carrd-v2
npm run lint --silent
node cardbuilder/scripts/carrd/check-element-tabs-drift.mjs --site main-template --no-fail-on-drift
node cardbuilder/scripts/carrd/check-element-tabs-drift.mjs --site lunar-auto-film --no-fail-on-drift
```

Additional validation when current repo blockers are fixed:

```bash
cd /Users/popskraft/Projects/carrd-v2
npm run test --silent
npm run verify:dist --silent
```

Live read-only validation:

```bash
/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/debug-chrome-status.sh
node /Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/cdp-eval.mjs \
  --url-includes "/dashboard/" \
  --js "({ href: location.href, hasBuilder: !!window.app?.builder, hasComponents: !!window.app?.builder?.site?.components })"
```

Do not run:

```bash
window.app.builder.ui.quickPublish()
```

## Risks

| Risk | Priority | Mitigation |
|---|---|---|
| Resolver chooses wrong site package | P1 | exact Builder URL match wins over active pointer; ambiguous matches fail closed |
| Site profile becomes stale | P1 | freshness gate reads `knowledge-status.json` and scan artifact timestamps |
| Docs still contain old action guidance | P1 | run `rg` checks and patch only active docs first |
| Hardcoded embed ids survive in shared mutation flow | P1 | move id/title maps into site profile before generic mutation work |
| Existing validation failures mask new regressions | P2 | record pre-existing `switcher` and `dist` blockers before edits |
| UI automation is over-classified as deterministic | P1 | capability matrix must distinguish `ui-automation` from `state-write` |
| Live Builder behavior changes again | P2 | runtime readiness check verifies required APIs before each operation |

## Rollback and Recovery

For local repo changes:

- keep registry/profile additions additive first
- preserve old script arguments during transition
- do not remove `active-template.json`
- revert only the files touched by this implementation if owner requests rollback

For live Carrd:

- no publish/save action is part of this plan
- read-only phases do not need live rollback
- any future state-write phase must capture before-state evidence and must stop before publish unless the owner approves

## Stop Rules

Stop and ask the owner when:

- implementing would require publishing or saving Carrd changes
- a live Builder URL matches multiple site profiles
- a site package is missing and the slug cannot be inferred safely
- a mutation operation has no explicit capability in `site-profile.json`
- tests fail in a way that touches files modified by the implementation
- current validation blockers must be fixed before architecture work can be trusted
- a new external dependency is proposed

## Handoff

Current audit conclusion:

- the proposed architecture is the best fit for this repo and the registry/profile layer is now implemented in the first wave
- implementation should continue from registry/profile resolution into live read-only smoke and canon cleanup, not back into ad hoc mutation automation
- the existing CDP/state-read core should be preserved
- Playwright/UI automation should be wrapped and classified, not promoted to the deterministic core

Current blocker to track separately:

- none; the remaining work is follow-up canon cleanup and optional additional site-tab readiness smokes

Next owner action:

- approve or amend this plan
- continue the remaining canon cleanup and multi-site readiness work
