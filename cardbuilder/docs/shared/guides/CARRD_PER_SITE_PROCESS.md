# Carrd Per-Site Process

## Purpose

Run Carrd work with one canonical process package per site.

## When To Use

- a Builder URL points to a site that does not match the current active package
- a scan, audit, migration, or plugin rollout is requested for a different Carrd site
- the current local canon mentions another Builder URL, published URL, or embed inventory

## Steps

1. Identify the site instance.
   - record the Builder URL
   - record the published site URL if known
   - choose a stable site slug, usually from the brand or project name
2. Create a dedicated site package.
   - `cardbuilder/projects/<site-slug>/`
   - `cardbuilder/docs/projects/<site-slug>/`
3. Treat `cardbuilder/data/active-template.json` as a pointer, not the canon.
   - update it only when intentionally switching the active working site
   - do not overwrite another site's package to fit the current Builder tab
4. Run the standard template-instance scan package into the site package.
   - snapshots
   - style maps
   - inventories
   - diffs
   - scan report
5. Keep site-specific operations inside that site package.
   - migration plans
   - embed replacement maps
   - rollout notes
   - readback evidence
6. Reuse only `builder-static` knowledge across sites.
   - Carrd UI behavior
   - Builder action model
   - panel/tab rules
   - CDP interaction rules

## Edge Cases

- If two sites share the same plugin bundle, they still need separate scan packages.
- If a site is only a temporary draft or copy, give it its own slug until it is explicitly merged or discarded.
- If the Builder URL changed but the site is actually the same long-lived project, keep the existing site slug and add a transition note in that site's docs.

## Done

- the current Builder URL has a matching site package
- site-specific truth no longer depends on `main-template`
- future scans and edits can be classified against the correct site baseline
