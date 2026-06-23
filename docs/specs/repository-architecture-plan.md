# Repository Architecture Plan

## Purpose

Keep historical Carrd sites on their existing jsDelivr files while Carrd Plugins V2 ships from a separate runtime repo with separate CDN links and public identity.

## Decision

Use two runtime repos:

1. `popskraft/carrd-plugins`
   Legacy CDN repo. Its name, `main` branch, and existing `dist/...` paths must not be replaced by v2 output because published Carrd sites already reference them.

2. `popskraft/carrd-v2`
   V2 runtime repo. New sites and new install snippets use only this repo.

Current local roots:

```text
/Users/popskraft/Projects/CARRD
  planning/staging workspace and legacy project canon

/Users/popskraft/Projects/carrd-v2
  V2 runtime repo connected to https://github.com/popskraft/carrd-v2.git
```

## Non-Negotiables

- Do not rename or replace `popskraft/carrd-plugins`.
- Do not publish v2 bundles into legacy `popskraft/carrd-plugins` paths.
- Do not rely on GitHub redirects for runtime delivery.
- Do not update old Carrd sites automatically to v2.
- Do not change existing legacy paths such as `https://cdn.jsdelivr.net/gh/popskraft/carrd-plugins@main/dist/...`.

## Target Runtime Model

### Legacy: `popskraft/carrd-plugins`

Role:
- serves already published sites;
- keeps legacy `dist/...` files by old names;
- remains available through the same jsDelivr URLs.

Rules:
- only critical fixes if old sites break;
- no v2 plugin renames;
- no new install docs for new projects;
- after freeze, repo is a legacy runtime surface.

### V2: `popskraft/carrd-v2`

Role:
- main repo for new plugin delivery;
- source of new CDN links;
- owner of v2 plugin names, paths, globals, and docs.

Example:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.css">
<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.js"></script>
```

## V2 Naming Policy

V2 uses explicit suffixes so v1 and v2 can coexist on CDN, globals, and markup.

- Repo: `popskraft/carrd-v2`
- Package name: `carrd-v2`
- Public docs title: `Carrd Plugins V2`
- Bundle: `theme-core-v2.min.css`, `theme-core-v2.min.js`, `theme-core-v2-cdn.html`
- Plugin folders and files: `src/<plugin>-v2/`, `dist/<plugin>-v2/<plugin>-v2.min.*`
- JavaScript globals: `window.Carrd<Plugin>V2`, `window.CarrdPluginOptionsV2`
- Public attrs: `data-*-v2`, for example `data-slider-v2`, `data-modal-v2-open`, `data-switcher-v2-target`

## Migration Policy

Old sites:
- stay on `popskraft/carrd-plugins`;
- keep old snippets;
- receive only emergency legacy fixes.

New sites:
- use only `popskraft/carrd-v2`;
- use v2 bundle and v2 plugin snippets;
- use v2 names in docs, attrs, and globals.

Migrated sites:
- are migrated manually;
- replace old CDN snippets with v2 snippets;
- replace legacy markup attrs/classes/hashes with v2 contract;
- are validated before old snippets are removed.

## Implementation State

- V2 repo exists locally at `/Users/popskraft/Projects/carrd-v2`.
- V2 remote is configured as `https://github.com/popskraft/carrd-v2.git`.
- V2 source and dist use `*-v2` plugin folders and `theme-core-v2` bundle files.
- V2 snippets point to `popskraft/carrd-v2@main`.
- Legacy freeze/publish remains a publication gate because it requires external GitHub/jsDelivr action.

## Remaining Publication Steps

1. Freeze legacy repo.
   Record the current `popskraft/carrd-plugins@main` delivery state with a tag or branch.

2. Publish v2.
   Push validated `popskraft/carrd-v2@main`.

3. Purge v2 CDN only.
   Run the v2 purge against `popskraft/carrd-v2@main/dist`.

4. Keep legacy untouched.
   Do not update legacy docs/snippets except to mark them as legacy if needed.

## What Not To Do

- Do not create `popskraft/carrd-plugins-archive` instead of freezing `popskraft/carrd-plugins`.
- Do not reuse old CDN paths for v2.
- Do not publish v2 bundle in `popskraft/carrd-plugins`.
- Do not change old snippets on live Carrd sites without a manual migration checklist.
- Do not keep v1 and v2 under identical globals when they may appear on one page.

## Done

Architecture is implemented when:

- `popskraft/carrd-plugins@main/dist/...` continues to serve old sites;
- `popskraft/carrd-v2@main/dist/...` serves new v2 sites;
- all v2 plugins have `*-v2` public identity;
- v2 snippets contain no links to `popskraft/carrd-plugins`;
- legacy repo has a named freeze ref;
- v2 repo has separate build, verify, purge, and release instructions.
