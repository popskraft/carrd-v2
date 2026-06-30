# AGENTS.md — Carrd Plugins

## Project
Carrd Plugins — репозиторий с `src/`-плагинами для Carrd, shared theme assets и generated `dist/`-пакетами.

## Root
`/Users/popskraft/Projects/carrd-v2`

## Stack / Environment
- Vanilla JS и CSS
- Node.js + pnpm
- Python 3 build scripts
- ESLint, jsdom, jsDelivr, Carrd

## Structure
- `src/` — editable plugin source и source README
- `dist/` — generated distributive assets и public README
- `scripts/` — build, verify, purge и README generation helpers
- `docs/` — active durable internal docs; `docs/INDEX.md` is the navigator
- `cardbuilder/` — browser-control, site-package docs, data manifests, and Carrd automation workspace
- `admincarrd/` — remote browser admin module source and installer package inputs
- `carrd-source/` — reference template source used for comparisons
- `_temp/` — ephemeral scratch, keep out of git

## Rules
- Keep root clean: no new durable docs at root except canonical start files and manifests.
- `README.md` is the public orientation surface; keep it in sync with source docs and generated `dist/` docs.
- Keep `docs/` as the only active docs root for durable non-sensitive documentation.
- Do not recreate legacy `_docs/`; migrated content belongs in `docs/`.
- `CLAUDE.md` must stay a one-line pointer to `AGENTS.md`.
- `CHANGELOG.md` stays at root as the build-owned source copied to `dist/CHANGELOG.md`.
- Update `ROADMAP.md` after material changes.
- Preserve `KI-NNN` IDs in `README.md`.
- `src/<plugin>/README.md` is the source for public plugin guidance; `dist/<plugin>/README.md` is generated.
- `scripts/templates/root_readme.md` and `scripts/templates/plugin_readme.md` own the shared README scaffolding.
- `cardbuilder/data/sites.json` is the active site registry for Carrd Builder automation.
- `admincarrd/app/config/config.php` is tracked only as a sanitized default config; runtime logs, sessions, uploads, and local secrets stay out of git.
- Keep secrets, tokens, cookies, and `.env` values out of docs.
- Validate the touched surface with the repository's native checks.

## Glossary
- `theme` → shared Carrd foundation (`theme-design-system.html`, `theme-core`)
- `plugin` → one `src/<slug>/` / `dist/<slug>/` pair
- `bundle` → generated CDN bundle assets in `dist/`
- `source` → editable `src/`
- `delivery` → generated `dist/`
- `carrd-source` → reference template source at `/Users/popskraft/Projects/carrd-v2/carrd-source`
- `cardbuilder` → Carrd Builder automation workspace at `/Users/popskraft/Projects/carrd-v2/cardbuilder`
- `admincarrd` → browser admin module at `/Users/popskraft/Projects/carrd-v2/admincarrd`

## Session Start
1. Read `AGENTS.md`
2. Read `README.md` and `## Ключевые Идеи`
3. Read `DEFINITION-OF-DONE.md`
4. Read `ROADMAP.md`
5. Check `OPEN-QUESTIONS.md` if present
6. Read `docs/INDEX.md` and relevant owner docs in `docs/specs/` or `docs/templates/`

## Session End
1. Update `ROADMAP.md` current status
2. Keep `ROADMAP.md` in full-path mode: preserve work rows and change status to `done`, `active`, or `blocked`.
3. Add or remove unresolved questions in `OPEN-QUESTIONS.md` when decisions change.
4. Update `docs/INDEX.md` when durable docs are added, moved, renamed, or archived.
5. Run the repo's native validation for the touched surface.
6. Run `project-compact` when handing off a long-lived thread.

## Local Exceptions
- `CHANGELOG.md` is root-level because build scripts copy it into `dist/CHANGELOG.md`.

## Ask Before
- Irreversible data/schema changes.
- Production/publication actions.
- Structural source-of-truth changes.
- New external dependencies with cost/compliance impact.

## Audit Status
Status: OK (mini-office aligned).
