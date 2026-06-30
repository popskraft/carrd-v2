# Repository Architecture Plan

## Purpose
Keep historical Carrd sites on their existing jsDelivr files while the separate `carrd-v2` runtime repo ships clean public naming from its own CDN path.

## Decision
Two runtime repos:

1. `popskraft/carrd-plugins` — legacy CDN repo. Its name, `main` branch, and existing `dist/...` paths must not be replaced by v2 output because published Carrd sites already reference them.
2. `popskraft/carrd-v2` — runtime repo at `/Users/popskraft/Projects/carrd-v2`, connected to `https://github.com/popskraft/carrd-v2.git`. New sites and new install snippets use only this repo; it owns plugin runtime, `admincarrd`, and `cardbuilder`.

## Non-Negotiables
- Do not rename or replace `popskraft/carrd-plugins`.
- Do not publish v2 bundles into legacy `popskraft/carrd-plugins` paths.
- Do not rely on GitHub redirects for runtime delivery.
- Do not update old Carrd sites automatically to v2.
- Do not change existing legacy paths such as `https://cdn.jsdelivr.net/gh/popskraft/carrd-plugins@main/dist/...`.

## Public Naming Policy
The repo path stays `popskraft/carrd-v2`, but the public runtime surface uses clean names.
- Repo: `popskraft/carrd-v2` · Package path: `carrd-v2` · Public title: `Carrd Plugins`
- Bundle: `theme-core.min.css`, `theme-core.min.js`, `theme-core-cdn.html`
- Plugin folders/files: `src/<plugin>/`, `dist/<plugin>/<plugin>.min.*`
- Globals: `window.Carrd<Plugin>`, `window.CarrdPluginOptions`
- Legacy globals: `window.Carrd<Plugin>V2` are transient migration code and are removed before the clean-runtime release
- Public attrs: clean `data-*` markers (e.g. `data-slider`, `data-modal-open`, `data-switcher-target`)
- Legacy attrs: `data-*-v2` are transient migration code and are removed before the clean-runtime release

Example CDN bundle:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core.min.css">
<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core.min.js"></script>
```

## Migration Policy
- **Old sites:** stay on `popskraft/carrd-plugins`, keep old snippets, receive only emergency legacy fixes.
- **New sites:** use only `popskraft/carrd-v2`, current bundle/snippets, and clean names in docs/attrs/globals.
- **Migrated sites:** migrated manually; replace old CDN snippets with current `carrd-v2` snippets; replace legacy markup attrs/classes/hashes with the clean contract; validate before old snippets are removed.

## Implemented State
Architecture is implemented and live:
- Legacy `popskraft/carrd-plugins` is frozen at tag `legacy-freeze-2026-06-23` and serves old sites untouched.
- `popskraft/carrd-v2` main + tag `v2.0.0` is published; jsDelivr purge was scoped to v2 paths only.
- `popskraft/carrd-v2` has clean public paths prepared, but runtime aliases remain until the staged clean-runtime migration is completed.

## What Not To Do
- Do not create `popskraft/carrd-plugins-archive` instead of freezing `popskraft/carrd-plugins`.
- Do not reuse old CDN paths for v2.
- Do not publish v2 bundle in `popskraft/carrd-plugins`.
- Do not change old snippets on live Carrd sites without a manual migration checklist.
- Do not reintroduce `-v2` public names for new installs.
