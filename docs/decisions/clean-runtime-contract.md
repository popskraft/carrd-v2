# ADR: Clean-only runtime contract

## Status

Accepted — 2026-06-30. Resolves `OPEN-QUESTIONS.md` Q004.

## Context

Legacy sites remain permanently attached to `popskraft/carrd-plugins`. The separate `popskraft/carrd-v2` repo therefore does not need runtime compatibility with old sites after its known consumers are migrated.

Keeping `CarrdPluginOptionsV2`, `Carrd*V2`, `data-*-v2` and v1 compatibility fallbacks in the new runtime creates two competing contracts and makes future version upgrades harder.

## Decision

- `popskraft/carrd-v2` becomes a clean-only runtime.
- Public paths keep the repo name `carrd-v2`, but plugin folders, files, globals, config and markup use clean names without version suffixes.
- V2 aliases and compatibility-only v1 fallbacks are removed before live-site migration.
- Historical snapshots and raw imports may retain old strings as immutable evidence but never participate in runtime, build, current docs guidance or active automation.
- Old sites and the legacy runtime remain untouched in `popskraft/carrd-plugins`.

## Consequences

- `main-template`, Carrd `faktura` and `faktura-app` must be migrated in a controlled sequence.
- All 13 plugins require a full clean-contract test pass before the first live migration.
- Removing old `carrd-v2@main/dist/*-v2*` paths is delayed until all known consumers have passed post-migration verification.
- Loading old and new runtime lines on the same page remains unsupported.

## Execution

- `docs/specs/plugin-unification-migration-plan.md`
- `docs/specs/repository-architecture-plan.md`
