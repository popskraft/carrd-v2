# Cardbuilder Stability Audit

## Суть

`cardbuilder` is usable as the migrated working Carrd Builder workspace inside `carrd-v2`. The main stability gap is not basic loading: the registry resolves live site packages and the active template. The remaining work is to finish site-package evidence, keep external knowledge optional, and prove live operations on real Carrd pages.

## Ядро

| Area | Status | Required next work |
|---|---|---|
| Workspace ownership | done | Keep parent canon anchored to `/Users/popskraft/Projects/carrd-v2/AGENTS.md`. |
| Registry resolution | done | Keep `cardbuilder/data/sites.json` as the first source for site packages. |
| External workspace references | guarded | Do not require external project roots for normal operation. |
| `main-template` package | stable baseline | Run fresh live smoke checks after plugin or Builder behavior changes. |
| `lunar-auto-film` package | partial | Confirm published URL, run published-site scan, and promote full-scan status only after evidence exists. |
| `faktura` package | automation-first | Capture canonical builder scan package, live plugin inventory, published URL, and published-site scan. |
| `koryphey-online` package | migration workspace | Keep as migration package unless owner promotes it to first-class live-site registry entry. |
| Broken legacy links | partially checked | Extend automated checks from operational canon to docs indexes and critical runbooks. |

## Детали

Completed in this pass:

- Updated `cardbuilder` and site-package `AGENTS.md` precedence links to the current repo root.
- Removed the external supplemental knowledge path from `cardbuilder/data/active-template.json`.
- Linked `faktura` registry entry to its existing docs package.
- Added `test:cardbuilder` coverage that blocks legacy workspace roots in operational canon.

Stability acceptance criteria for a standalone version:

- `npm run test:cardbuilder` passes.
- `node cardbuilder/scripts/carrd/resolve-site.mjs --field siteSlug` resolves the active template.
- Every registry entry has existing `projectWorkspace`, `projectDocs` when a docs package exists, `knowledgeStatusManifest`, and `profilePath`.
- No operational canon file depends on paths outside `/Users/popskraft/Projects/carrd-v2`.
- Each active live-site package has a current builder scan, DOM audit, tabs map, live plugin inventory, repo sync diff, and published-site verification when a published URL exists.

Deferred:

- Full docs link validation across historical project docs. Current guardrails cover operational canon only.
- Live Carrd smoke checks require authenticated Builder access and owner-approved publish/save actions.
