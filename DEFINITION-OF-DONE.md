# Definition of Done — Carrd Plugins V2

## Project Done
- [ ] Root docs live in `docs/` with a single `docs/INDEX.md` navigator.
- [ ] `README.md` carries the active key-idea registry and matches the generated public docs.
- [ ] `AGENTS.md` and `CLAUDE.md` follow the mini-office contract without duplicated policy text.
- [ ] Legacy `_docs/` files are reduced to bridge/pointer content only.

## Deliverable Done
- [ ] `src/<plugin>/README.md` follows the shared plugin README contract.
- [ ] Generated `dist/<plugin>/README.md` matches the source README and template rules.
- [ ] `theme-design-system.html` remains the required base artifact for inline installs.

## Validation
- [ ] `npm run build:docs`
- [ ] `npm run verify:dist`
- [ ] `npm run test`
- [ ] `npm run lint`
