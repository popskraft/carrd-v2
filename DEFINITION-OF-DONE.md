# Definition of Done — Carrd Plugins V2

## Project Done
- [x] Durable docs live in `docs/` with a single `docs/INDEX.md` navigator.
- [x] `README.md` is a concise English end-user guide and matches the generated public docs.
- [x] `AGENTS.md` and `CLAUDE.md` follow the mini-office contract without duplicated policy text.
- [x] Legacy `_docs/` is absent; do not recreate it.

## Deliverable Done
- [x] `src/<plugin>/README.md` follows the shared plugin README contract.
- [x] Generated `dist/<plugin>/README.md` matches the source README and template rules.
- [x] Plugin install wording is derived from bundle membership and placement rules, with no manual `dist/` edits or build-date drift.
- [x] Public README files contain no local project or user filesystem paths.
- [x] `theme-design-system.html` remains the required base artifact for inline installs.
- [x] `theme-design-tokens.css` owns only global/shared tokens; every plugin CSS owns its `--theme-<plugin>-*` defaults.
- [x] Canonical CSS consumes mandatory `--theme-*` tokens without fallback arguments; compatibility fallbacks stay isolated in `theme-compat.css`.

## Validation
- [x] `npm run build`
- [x] `npm run verify:dist`
- [x] `npm run test`
- [x] `npm run lint`

## Release Done
- [x] Legacy `popskraft/carrd-plugins` has a named historical freeze ref before public v2 rollout.
- [x] `popskraft/carrd-v2` main and tag `v2.0.0` are pushed.
- [x] Only v2 jsDelivr paths are purged after publish.

## Module Workspace Done
- [x] `admincarrd/` lives in `carrd-v2` without local runtime logs, sessions, uploads, or private password state.
- [x] `cardbuilder/` lives in `carrd-v2` and points site registry paths at `/Users/popskraft/Projects/carrd-v2`.
- [x] `test:cardbuilder` owns the local site-registry test outside the default JS suite.
