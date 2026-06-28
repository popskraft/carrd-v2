# Repository Architecture Plan

## Purpose
Keep historical Carrd sites on their existing jsDelivr files while Carrd Plugins V2 ships from a separate runtime repo with separate CDN links and public identity.

## Decision
Two runtime repos:

1. `popskraft/carrd-plugins` — legacy CDN repo. Its name, `main` branch, and existing `dist/...` paths must not be replaced by v2 output because published Carrd sites already reference them.
2. `popskraft/carrd-v2` — V2 runtime repo at `/Users/popskraft/Projects/carrd-v2`, connected to `https://github.com/popskraft/carrd-v2.git`. New sites and new install snippets use only this repo; it owns plugin runtime, `admincarrd`, and `cardbuilder`.

## Non-Negotiables
- Do not rename or replace `popskraft/carrd-plugins`.
- Do not publish v2 bundles into legacy `popskraft/carrd-plugins` paths.
- Do not rely on GitHub redirects for runtime delivery.
- Do not update old Carrd sites automatically to v2.
- Do not change existing legacy paths such as `https://cdn.jsdelivr.net/gh/popskraft/carrd-plugins@main/dist/...`.

## V2 Naming Policy
V2 uses explicit suffixes so v1 and v2 can coexist on CDN, globals, and markup.
- Repo: `popskraft/carrd-v2` · Package: `carrd-v2` · Public title: `Carrd Plugins V2`
- Bundle: `theme-core-v2.min.css`, `theme-core-v2.min.js`, `theme-core-v2-cdn.html`
- Plugin folders/files: `src/<plugin>-v2/`, `dist/<plugin>-v2/<plugin>-v2.min.*`
- Globals: `window.Carrd<Plugin>V2`, `window.CarrdPluginOptionsV2`
- Public attrs: `data-*-v2` (e.g. `data-slider-v2`, `data-modal-v2-open`, `data-switcher-v2-target`)

Example CDN bundle:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.css">
<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.js"></script>
```

## Migration Policy
- **Old sites:** stay on `popskraft/carrd-plugins`, keep old snippets, receive only emergency legacy fixes.
- **New sites:** use only `popskraft/carrd-v2`, v2 bundle and snippets, v2 names in docs/attrs/globals.
- **Migrated sites:** migrated manually; replace old CDN snippets with v2 snippets; replace legacy markup attrs/classes/hashes with v2 contract; validated before old snippets are removed.

## Implemented State
Architecture is implemented and live:
- Legacy `popskraft/carrd-plugins` is frozen at tag `legacy-freeze-2026-06-23` and serves old sites untouched.
- `popskraft/carrd-v2` main + tag `v2.0.0` is published; jsDelivr purge was scoped to v2 paths only.
- All v2 plugins carry `*-v2` public identity; v2 snippets contain no links to `popskraft/carrd-plugins`.

## What Not To Do
- Do not create `popskraft/carrd-plugins-archive` instead of freezing `popskraft/carrd-plugins`.
- Do not reuse old CDN paths for v2.
- Do not publish v2 bundle in `popskraft/carrd-plugins`.
- Do not change old snippets on live Carrd sites without a manual migration checklist.
- Do not keep v1 and v2 under identical globals when they may appear on one page.
