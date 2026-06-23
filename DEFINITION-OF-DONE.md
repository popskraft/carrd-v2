# Definition of Done — Carrd Plugins V2

## Project Done
- [x] Durable docs live in `docs/` with a single `docs/INDEX.md` navigator.
- [x] `README.md` carries the active key-idea registry and matches the generated public docs.
- [x] `AGENTS.md` and `CLAUDE.md` follow the mini-office contract without duplicated policy text.
- [x] Legacy `_docs/` is absent; do not recreate it.

## Deliverable Done
- [x] `src/<plugin>/README.md` follows the shared plugin README contract.
- [x] Generated `dist/<plugin>/README.md` matches the source README and template rules.
- [x] `theme-design-system.html` remains the required base artifact for inline installs.

## Validation
- [x] `npm run build`
- [x] `npm run verify:dist`
- [x] `npm run test`
- [x] `npm run lint`

## Release Done
- [x] Legacy `popskraft/carrd-plugins` has a named historical freeze ref before public v2 rollout.
- [x] `popskraft/carrd-v2` main and tag `v2.0.0` are pushed.
- [x] Only v2 jsDelivr paths are purged after publish.
