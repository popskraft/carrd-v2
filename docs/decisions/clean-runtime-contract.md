# ADR: Clean runtime with controlled compatibility delivery tails

## Status

Accepted — 2026-06-30. Resolves `OPEN-QUESTIONS.md` Q004.

**Superseded in part — 2026-07-11 (`2.0.0`, resolves Q016).** The compatibility-tail delivery described below (`theme-core.*`, `theme-ui.css` as a legacy bridge, mutable `@main` CDN rollout) was removed entirely. Distribution is now inline-embed-only; there is no CDN/jsDelivr channel and no compatibility bridge. The clean-naming decision (no version suffixes, no `V2` aliases) still stands. See `docs/specs/release-contract.md` and `docs/specs/carrd-contract.md` for the current contract.

## Context

Legacy sites remain permanently attached to `popskraft/carrd-plugins`. The separate `popskraft/carrd-v2` repo should keep a clean source/runtime contract for new installs, but mutable `@main` consumers and old site-owned token overrides still need a controlled compatibility bridge during rollout.

Keeping `CarrdPluginOptionsV2`, `Carrd*V2`, `data-*-v2` and v1 compatibility fallbacks in the new source/runtime creates two competing contracts and makes future version upgrades harder.

## Decision

- `popskraft/carrd-v2` keeps a clean source/runtime contract for new installs.
- Public paths keep the repo name `carrd-v2`, but plugin folders, files, globals, config and markup use clean names without version suffixes.
- V2 aliases and compatibility-only v1 fallbacks are removed before live-site migration.
- Repo-owned delivery may keep compatibility artifacts for controlled rollout:
  - canonical new-install artifacts: `theme-runtime.min.css`, `theme-runtime.min.js`, `theme-design-tokens-embed.html`, `theme-ui-runtime.css`
  - compatibility artifacts: `theme-core.min.css`, `theme-core.min.js`, `theme-ui.css`
- Compatibility artifacts are rollout tails only. They must not become the canonical install path for new sites.
- The site-owned token embed defines only global/shared defaults. Each plugin owns its component defaults in a leading low-specificity `:where(:root)` block, so ordinary site-owned `:root` overrides win regardless of load order.
- Canonical CSS treats global and plugin `--theme-*` variables as mandatory and does not hide missing ownership behind fallback values. Legacy fallback chains remain isolated in the compatibility bridge.
- Historical snapshots and raw imports may retain old strings as immutable evidence but never participate in runtime, build, current docs guidance or active automation.
- Old sites and the legacy runtime remain untouched in `popskraft/carrd-plugins`.

## Consequences

- `main-template`, Carrd `faktura` and `faktura-app` must be migrated in a controlled sequence.
- All 13 plugins require a full clean-contract test pass before the first live migration.
- Removing old `carrd-v2@main/dist/*-v2*` paths is delayed until all known consumers have passed post-migration verification.
- Compatibility delivery tails stay allowed until version-pinned rollout has replaced mutable `@main` installs.
- Loading old and new runtime lines on the same page remains unsupported.

## Execution

- `docs/specs/plugin-unification-migration-plan.md`
- `docs/specs/repository-architecture-plan.md`
