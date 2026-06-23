# Knowledge System

## Purpose

Define the canonical knowledge rules for the `lunar-auto-film` Carrd site package.

## When To Use

- before scanning this site
- before comparing live Builder state to local canon
- before storing migration or rollout evidence

## Rules

- Reuse `builder-static` Carrd knowledge from shared repo-local canon.
- Store `template-instance` truth only inside the `lunar-auto-film` package.
- Do not classify `main-template` snapshots or docs as truth for this site.
- Treat `cardbuilder/data/active-template.json` as the active routing pointer only.
- Refresh this site's own scan package before making canon-based drift claims.

## Storage

- Project root: `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/lunar-auto-film`
- Docs root: `/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/lunar-auto-film`
- Manifest: `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/lunar-auto-film/data/manifests/knowledge-status.json`

## Edge Cases

- If the live site is only a copy, keep it separate until an owner explicitly merges or discards it.
- If the published URL is unknown, keep it `null` until directly verified.
- If Builder behavior itself changes, update shared `builder-static` canon rather than this site package alone.

## Done

- the site has its own manifest
- future scans land in this package
- drift checks for this site no longer depend on `main-template`
