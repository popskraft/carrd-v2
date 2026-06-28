# Plugin V2 Transition Plan

## Purpose

Historical execution note for the first v2 rollout slice.

Its active replacement is [docs/specs/plugin-unification-migration-plan.md](/Users/popskraft/Projects/carrd-v2/docs/specs/plugin-unification-migration-plan.md). This file stays only to record the original implementation scope and guardrails for the first compatibility-first pass.

## What This Slice Introduced

- shared v2 `data-*` contract for grouped plugins;
- namespaced hash triggers such as `#data-modal-v2-*` and `#data-accordeon-v2-*`;
- backward-compatible runtime support while legacy installs remained active;
- source README updates and generated `dist` sync;
- jsdom coverage for the first v2 plugin family.

## Plugins Covered

- `slider`
- `grid-cluster`
- `switcher`
- `accordeon`
- `modal`
- `cards`

## Accepted Rules For The First Rollout

- `src/` stays the source of truth; `dist/` is generated.
- New docs teach v2 `data-*` first.
- Legacy class/hash fallback stays available during migration.
- Plugin hash handlers must not block unmatched native Carrd hashes.
- No live publish, CDN purge, or fallback removal belongs to this slice.

## Validation Used

- targeted jsdom tests for the covered plugins;
- `npm run test`
- `npm run lint`
- `npm run build:docs`
- `npm run verify:dist`

## Remaining Work Moved Elsewhere

These items are now owned by newer canon:

- current migration execution: [docs/specs/plugin-unification-migration-plan.md](/Users/popskraft/Projects/carrd-v2/docs/specs/plugin-unification-migration-plan.md)
- unresolved policy decisions: [OPEN-QUESTIONS.md](/Users/popskraft/Projects/carrd-v2/OPEN-QUESTIONS.md)
- current shared public contract: [docs/specs/plugin-v2-data-contract.md](/Users/popskraft/Projects/carrd-v2/docs/specs/plugin-v2-data-contract.md)

## Status

This document is no longer the active plan. Keep it as compact historical context only.
