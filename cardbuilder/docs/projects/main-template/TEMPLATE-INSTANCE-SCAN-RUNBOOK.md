# Template-Instance Scan Runbook

## Purpose

Run the canonical `template-instance` scan package for this site package.

This runbook is site-scoped and must be used after `builder-static` knowledge is already considered sufficiently resolved.

If the active Builder URL belongs to another Carrd site, do not reuse this `main-template` package. First create a dedicated site package as described in:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/shared/guides/CARRD_PER_SITE_PROCESS.md](/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/shared/guides/CARRD_PER_SITE_PROCESS.md)

## Scope

This workflow captures:

- current builder component tree
- controls and anchors
- style map
- top-level ordering
- live builder plugin heuristics
- published-site plugin asset evidence

This workflow does not change plugin source code and does not publish the site.

## Output Package

Store the collected outputs under:

- `cardbuilder/projects/main-template/data/snapshots/`
- `cardbuilder/projects/main-template/data/style-maps/`
- `cardbuilder/projects/main-template/data/inventories/`
- `cardbuilder/projects/main-template/data/diffs/`

Expected files:

1. `snapshots/template-instance-builder-scan.json`
   - source: `cardbuilder/scripts/carrd/carrd-template-instance-scan.js`
2. `snapshots/template-instance-dom-audit.json`
   - source: `cardbuilder/scripts/carrd/carrd-dom-audit.js`
3. `style-maps/template-instance-style-map.json`
   - source: `cardbuilder/scripts/carrd/carrd-deep-audit-style-map.js`
4. `inventories/published-site-plugin-scan.json`
   - source: `cardbuilder/scripts/carrd/carrd-published-site-plugin-scan.js`
5. `inventories/live-plugin-inventory.json`
   - derived from the builder scan and style scan
6. `diffs/template-vs-repo-plugin-sync.json`
   - derived comparison against `/Users/popskraft/Projects/carrd-v2/src` and `/Users/popskraft/Projects/carrd-v2/dist`
7. `cardbuilder/docs/projects/main-template/TEMPLATE-INSTANCE-SCAN-REPORT.md`
   - narrative report for the package

## Step Order

### Step 1 — Builder component/state scan

Run in the active builder tab:

- `cardbuilder/scripts/carrd/carrd-template-instance-scan.js`

Save result as:

- `cardbuilder/projects/main-template/data/snapshots/template-instance-builder-scan.json`

### Step 2 — DOM audit snapshot

Run in the active builder tab:

- `cardbuilder/scripts/carrd/carrd-dom-audit.js`

Save result as:

- `cardbuilder/projects/main-template/data/snapshots/template-instance-dom-audit.json`

### Step 3 — Style map and top-level structure

Run in the active builder tab:

- `cardbuilder/scripts/carrd/carrd-deep-audit-style-map.js`

Save result as:

- `cardbuilder/projects/main-template/data/style-maps/template-instance-style-map.json`

### Step 4 — Published-site plugin scan

Open the published site URL from the active registry:

- `https://mini.crd.co/`

Run:

- `cardbuilder/scripts/carrd/carrd-published-site-plugin-scan.js`

Save result as:

- `cardbuilder/projects/main-template/data/inventories/published-site-plugin-scan.json`

### Step 5 — Normalize live plugin inventory

From the builder scan and published-site scan, produce:

- `cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json`

Minimum fields:

- plugin name
- detected in builder scan: yes/no
- detected in published scan: yes/no
- evidence list
- confidence

### Step 6 — Compare against repo plugin roots

Compare live inventory against:

- `/Users/popskraft/Projects/carrd-v2/src`
- `/Users/popskraft/Projects/carrd-v2/dist`

Store result as:

- `cardbuilder/projects/main-template/data/diffs/template-vs-repo-plugin-sync.json`

Minimum fields:

- plugin
- exists in src
- exists in dist
- detected live
- mismatch type
- evidence
- recommended next action

### Step 7 — Write report

Populate:

- `cardbuilder/docs/projects/main-template/TEMPLATE-INSTANCE-SCAN-REPORT.md`

## Acceptance Conditions

The first canonical `template-instance` scan package is considered complete when:

1. all 4 raw scan files exist
2. live plugin inventory exists
3. repo sync diff exists
4. the report is filled in
5. `knowledge-status.json` is updated with:
   - `templateInstance.status`
   - `templateInstance.lastScanAt`
   - `fullScanCompletedAt`

## Safety Rules

- Do not click `Publish Changes`.
- Do not treat builder-static behavior as template-instance findings.
- Do not treat project-specific section labels as builder-static canon.
- If the published site and builder state disagree, record the mismatch instead of hiding it.
