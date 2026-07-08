# Audit Report — Codebase + Live Carrd Surface

Date: `2026-07-07`
Scope: repository `carrd-v2`, Carrd Builder draft `4155176224428477`, published site `https://mini.crd.co/`

## Verdict

Repository health is strong.
Live placement is also healthy.
The main-template admin knowledge pack was stale at the start of the audit, but it was refreshed during this pass.
The remaining risks after the follow-up pass are no longer release-gating: CI now enforces the full local `validate` gate, and jsDelivr purge now defaults to the version-pinned release ref from `VERSION` with an explicit compatibility override for `@main`.

## Stack Profile

- Backend: none detected as product backend; local tooling in Python 3
- Frontend: vanilla JS + vanilla CSS plugins for Carrd
- Admin: Carrd Builder + local `cardbuilder` / MCP tooling
- Database: none detected
- Tests: Node test runner + jsdom + Python `unittest`
- Build: `pnpm` scripts + Python build pipeline
- CSS: vanilla CSS
- CI/CD: GitHub Actions

## Verification Summary

- `npm run validate` passed locally on `2026-07-07`
- JS tests: `235/235` runtime + `27/27` cardbuilder passed
- Python tests: `32/32` passed
- Coverage: `src/**` `100%` lines / branches / functions; `cardbuilder/**` `54.79% / 53.52% / 68.63%` against enforced `50/50/65` thresholds
- Lint: passed
- Dead code gate (`knip`): passed
- Bundle budget: passed for all checked assets
- Clean contract check: passed
- Legacy consistency check: passed

## Live Readiness

| Flag | Value | Evidence |
|---|---|---|
| `connected` | yes | Chrome CDP on `127.0.0.1:9222`; Builder tab open |
| `authenticated` | yes | Builder URL `https://carrd.co/dashboard/4155176224428477/build` loaded directly |
| `builder-ready` | yes | `hasBuilder: true`, `hasComponents: true`, `hasUiPanel: true` |
| `state-mapped` | yes | fresh live tab scan completed on `2026-07-07` |
| `docs-sync-status` | synced | `main-template` manifests, scans, and review docs refreshed on `2026-07-07` |
| `safe-to-edit` | yes | deterministic targeting and live-read tooling now match the current draft; save/publish remains operator-gated by policy |

## Live State Observed

- Builder currently exposes `106` components across `11` types.
- Builder currently contains `6` embed elements: `embed08`, `embed03`, `embed14`, `embed02`, `embed04`, `embed05`.
- Published `mini.crd.co` currently loads version-pinned CDN assets from `popskraft/carrd-v2@2.1.0`.
- Published `mini.crd.co` shows `0` matches for `@main`.
- Published `mini.crd.co` shows `0` active `data-*-v2` markers.
- Published `mini.crd.co` still exposes expected globals: `CarrdModal`, `CarrdShoppingCart`, `CarrdSlider`.

## Findings

### 1. `main-template` knowledge drift was real, and is now fixed

Severity: resolved during audit

Observed fact:
- The audit started with stale Builder/site knowledge for `main-template`.
- Fresh live scans on `2026-07-07` confirmed `106` Builder components and `6` embed elements.
- Published `mini.crd.co` was confirmed to run version-pinned CDN assets from `popskraft/carrd-v2@2.1.0`.
- The following artifacts were refreshed to match live state:
  - [`cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-07-07.json`](../../cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-07-07.json)
  - [`cardbuilder/projects/main-template/data/snapshots/template-instance-builder-scan.json`](../../cardbuilder/projects/main-template/data/snapshots/template-instance-builder-scan.json)
  - [`cardbuilder/projects/main-template/data/inventories/published-site-plugin-scan.json`](../../cardbuilder/projects/main-template/data/inventories/published-site-plugin-scan.json)
  - [`cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json`](../../cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json)
  - [`cardbuilder/projects/main-template/data/diffs/template-vs-repo-plugin-sync.json`](../../cardbuilder/projects/main-template/data/diffs/template-vs-repo-plugin-sync.json)
  - [`cardbuilder/projects/main-template/data/manifests/mcp-targets.json`](../../cardbuilder/projects/main-template/data/manifests/mcp-targets.json)
  - [`cardbuilder/projects/main-template/data/manifests/site-profile.json`](../../cardbuilder/projects/main-template/data/manifests/site-profile.json)
  - [`cardbuilder/projects/main-template/data/manifests/knowledge-status.json`](../../cardbuilder/projects/main-template/data/manifests/knowledge-status.json)
  - [`cardbuilder/docs/projects/main-template/ELEMENT-TABS-MAP.md`](../../cardbuilder/docs/projects/main-template/ELEMENT-TABS-MAP.md)
  - [`cardbuilder/docs/projects/main-template/TEMPLATE-INSTANCE-SCAN-REPORT.md`](../../cardbuilder/docs/projects/main-template/TEMPLATE-INSTANCE-SCAN-REPORT.md)
  - [`cardbuilder/docs/projects/main-template/PLUGIN-SYNC-REVIEW.md`](../../cardbuilder/docs/projects/main-template/PLUGIN-SYNC-REVIEW.md)

Inference:
- The earlier risk was real, but it is no longer the current repo state.
- Deterministic admin reads now align with the actual Builder draft and published site.

Recommendation:
1. Keep future Builder/site changes coupled to the same refresh flow.
2. Treat `site-profile.json` and `mcp-targets.json` as the live contract owners for admin automation.

### 2. Three `cardbuilder` tooling defects were fixed during the audit

Severity: resolved during audit

Observed fact:
- [`cardbuilder/scripts/carrd/check-element-tabs-drift.mjs`](../../cardbuilder/scripts/carrd/check-element-tabs-drift.mjs) failed against the stored snapshot schema.
- [`cardbuilder/scripts/carrd/lib/cdp-client.mjs`](../../cardbuilder/scripts/carrd/lib/cdp-client.mjs) could resolve the published tab before the Builder tab and return `builder-not-ready`.
- [`cardbuilder/scripts/carrd/cdp-tab-map-scan.js`](../../cardbuilder/scripts/carrd/cdp-tab-map-scan.js) could read tabs before the properties panel finished switching to the requested element.

Inference:
- These were real toolchain defects, not just stale data.
- Left unfixed, they would keep live scans flaky and could corrupt tab-map evidence.

Recommendation:
1. Keep the current Builder-first tab matching in place.
2. Keep the properties-panel wait in the tab scanner.
3. Preserve the broader snapshot parser compatibility in the drift checker.

Resolution:
1. `readSnapshot()` now accepts both raw `{ rows: ... }` and wrapped `{ value: { rows: ... } }` snapshot payloads.
2. `findMatchingSiteTab()` now prefers Builder URL matches before published-site matches.
3. The tab scanner now waits until `propertiesPanel.component.id === expectedId` before reading tabs.
4. A regression test was added for Builder-tab prioritization in [`tests-js/carrd-mcp-onboarding.test.js`](../../tests-js/carrd-mcp-onboarding.test.js).
5. The site-registry test was updated to follow the canonical `site-profile.json` contract instead of a hardcoded dated snapshot path in [`tests-js/site-registry.test.js`](../../tests-js/site-registry.test.js).

### 3. CI parity gap was real, and is now fixed

Severity: resolved during follow-up

Observed fact:
- [`package.json`](../../package.json) defines `validate` as `verify:dist + check:bundle-budget + check:clean-contract + check:deadcode + test + test:coverage + test:coverage:cardbuilder + lint`.
- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) now runs a single `pnpm run validate` step after dependency install.

Inference:
- Pull requests now execute the same high-level gate in CI that the repo uses locally.

Recommendation:
1. Keep `validate` as the single CI entrypoint unless the local gate changes.
2. If `validate` expands again, CI inherits the new checks automatically.

### 4. jsDelivr purge ref mismatch was real, and is now fixed

Severity: resolved during follow-up

Observed fact:
- [`scripts/purge_jsdelivr.py`](../../scripts/purge_jsdelivr.py) now resolves the purge ref from [`VERSION`](../../VERSION) by default and supports `--ref` for explicit overrides.
- [`package.json`](../../package.json) keeps `npm run cdn:purge` as the version-pinned default and adds `npm run cdn:purge:main` as an explicit compatibility path.

Inference:
- Default purge behavior now matches the published release contract instead of a mutable branch ref.

Recommendation:
1. Keep version-pinned purge as the default publish behavior.
2. Use `--ref` or `npm run cdn:purge:main` only for deliberate compatibility tails.

## Benchmark Scores

| Benchmark | Score | Notes |
|---|---:|---|
| Code Coverage | 88 | `src/**` stays at `100%`, and `cardbuilder/**` now has a separate numeric gate; `admincarrd/**` is still outside |
| Duplication | 78 | plugin family is standardized; some intentional repetition remains across plugin runtimes |
| Coupling | 72 | runtime code is reasonably isolated, but `cardbuilder` state files are tightly coupled to live template shape |
| Cohesion | 74 | most plugins stay focused; biggest files are still concentrated in a few large modules |
| Cyclomatic Complexity | 84 | ESLint enforces `complexity: 10` for `src/**/*.js` and lint passes |
| Dead Code | 92 | `knip` is configured and currently green |
| Error Handling | 76 | generally explicit; some clipboard/helper catches intentionally swallow failures in admin scan scripts |
| Documentation Coverage | 88 | repo canon is strong and the `main-template` operational docs were refreshed during this audit |
| CI / Delivery Reliability | 85 | CI now executes `pnpm run validate`, and purge defaults to the version-pinned release ref |
| Live Placement Accuracy | 91 | published site is clean, version-pinned, and now reconciled with refreshed local site knowledge |

## Hotspots Worth Watching

- `scripts/minify_plugins.py` — `1281` lines
- `cardbuilder/scripts/carrd/lib/onboarding-core.mjs` — `802` lines
- `src/shopping-cart/shopping-cart.js` — `799` lines
- `src/slider/slider.js` — `716` lines
- `cardbuilder/scripts/carrd/lib/control-core.mjs` — `618` lines
- `src/modal/modal.js` — `541` lines

These are not current failures.
They are maintainability pressure points and the most likely places for future regressions.

## Recommended Next Actions

1. Preserve the refreshed `main-template` artifacts as the new operational baseline for future Carrd admin work.
2. Keep `validate` as the single CI gate owner unless the repo intentionally splits it again.
3. Use explicit purge overrides only for compatibility scenarios, not as the default release path.

## Final Assessment

The codebase itself is in good shape and is better than average on tests, coverage, and contract enforcement.
The live `mini.crd.co` placement is also healthy and already aligned with the version-pinned `@2.1.0` rollout.
The `cardbuilder` operational truth for `main-template` is now refreshed and the key admin-tooling defects found during the audit are fixed.
The audit follow-up also closed the two release-process gaps: CI now matches the repo’s real validation standard, and CDN purge now targets the actual version-pinned release ref by default.
