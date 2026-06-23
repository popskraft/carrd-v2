# Deterministic Reproduction Rules

## Purpose

Define how Carrd Builder work must be recorded so future sessions can reproduce the same behavior without relying on memory, screenshots alone, or ambiguous chat history.

This protocol applies to:

- scans
- live Builder edits
- plugin refreshes
- migrations
- validation passes
- post-publish re-scans

## Core Principle

Every meaningful Carrd operation must leave behind a reproducible operation package.

An operation package is sufficient when another agent can answer all of these questions without guessing:

1. What was the intent?
2. Which live template was targeted?
3. Which exact source assets or scripts were used?
4. Which live Carrd elements were read or changed?
5. What evidence proves the before-state?
6. What evidence proves the after-state?
7. How was success validated?
8. Which canonical artifacts were updated as a result?

If one of these answers is missing, the operation is not yet deterministic enough.

## Four Recording Layers

### Layer 1 — Registry Context

Always anchor the work to the active registry first:

- `cardbuilder/data/active-template.json`

This is the minimum context required before any scan or live edit.

Record at least:

- builder URL
- published URL
- project id
- project data root

### Layer 2 — Raw Evidence

Store machine outputs that came directly from DevTools, browser scripts, CDP reads, or downloaded JSON artifacts.

Preferred storage:

- `cardbuilder/projects/main-template/data/raw-imports/<date-or-operation>/`

Examples:

- raw builder scan JSON
- raw DOM audit JSON
- raw published plugin scan JSON
- raw CDP readback payloads
- raw pre/post embed content backups

Rule:

- raw evidence is append-only
- do not overwrite raw evidence with interpreted or normalized data

### Layer 3 — Canonical Normalization

Store the stable, referenced artifact set in canonical paths:

- `data/snapshots/`
- `data/style-maps/`
- `data/inventories/`
- `data/diffs/`
- `data/manifests/`

Rule:

- canonical files are the current trusted working set
- raw files may be timestamped, but canonical files must use stable names
- canonical files may be replaced only when a newer scan or verification supersedes the prior baseline

### Layer 4 — Durable Interpretation

Store the human-readable explanation of what happened and how to repeat it:

- `cardbuilder/docs/projects/main-template/`

This layer contains:

- runbooks
- migration plans
- execution logs
- accepted findings
- action maps
- sync reviews

Rule:

- no canonical conclusion should live only in chat
- if the conclusion matters later, it must exist in Markdown here

## Operation Package Format

Every non-trivial Carrd operation should produce or update these records.

### A. Intent Record

What the operation was trying to achieve.

Store in a Markdown execution doc or operation-specific report.

Minimum fields:

- operation name
- domain: `builder-static` or `template-instance`
- status: planned / in-progress / complete / partial / superseded
- target template
- reason for running

### B. Inputs Record

What exact inputs were used.

Minimum fields:

- source repo version
- relevant plugin version
- exact local files used
- exact scan scripts used
- if live edit: target embed ids/titles or target controls

### C. Before-State Evidence

Minimum required before mutating live Builder state:

- either a raw export, or a content backup, or a deterministic readback
- and at least one human-readable note explaining what the pre-state was

Examples:

- saved embed HTML before replacement
- current plugin inventory before refresh
- screenshot of Builder with target embed visible

### D. Action Record

Record the exact mutation or scan steps.

Minimum detail:

- what tab or URL was used
- what script or method was used
- which embed/control was touched
- whether the step was read-only or mutating

If CDP or DevTools automation is used, record enough detail to know:

- which page was targeted
- which operation class was executed
- which local assets were injected or compared

### E. After-State Evidence

Minimum required after mutation:

- deterministic readback or saved output
- and verification evidence that the intended state was actually reached

Examples:

- hash match between live embed content and local distributive file
- post-publish plugin scan
- Builder screenshot after replacement

### F. Validation Record

Every operation must declare how it was validated.

Use one or both:

1. Builder-side validation
2. Published-view validation

Minimum detail:

- what was checked
- where it was checked
- pass / fail / caveat

### G. Canon Update Record

If the operation changed what future sessions should trust, update:

- canonical artifact paths
- relevant Markdown docs
- `knowledge-status.json`
- `cardbuilder/docs/projects/main-template/INDEX.md` or `KNOWLEDGE-SYSTEM.md` if the transition changed active truth or workflow

## Reproducibility Thresholds

### Scan Work Is Reproducible When

- the exact scan scripts are named
- raw outputs are preserved
- canonical normalized files are updated
- report/manifest explains freshness and trust level

### Live Builder Edit Is Reproducible When

- target embeds or controls are unambiguously identified
- local replacement assets are named
- before-content is backed up
- after-content is read back and matched
- validation path is recorded

### Migration Is Reproducible When

- there is a plan doc
- there is a draft execution log
- there is a post-publish re-scan
- the final live inventory reflects the intended baseline

If any one of these is missing, the migration is only partially reproducible.

## Naming Rules

Use stable canonical names for current truth and timestamped names for raw evidence.

### Canonical

- `template-instance-builder-scan.json`
- `template-instance-dom-audit.json`
- `template-instance-style-map.json`
- `published-site-plugin-scan.json`
- `live-plugin-inventory.json`
- `template-vs-repo-plugin-sync.json`

### Raw Evidence

Place timestamped or imported files under:

- `data/raw-imports/<operation-id-or-date>/`

Recommended renames:

- `template-instance-builder-scan.raw.json`
- `template-instance-dom-audit.raw.json`
- `template-instance-style-map.raw.json`
- `published-site-plugin-scan.raw.json`

### Execution Docs

Prefer explicit names:

- `*-PLAN.md`
- `*-DRAFT-EXECUTION.md`
- `*-REPORT.md`
- `*-ACCEPTED.md`
- `*-REVIEW.md`

## Decision Recording Rule

If a scan or migration leads to a lasting decision, record it in at least two places:

1. the task-specific doc
2. a durable system surface such as:
   - `PLUGIN-SYNC-REVIEW.md`
   - `KNOWLEDGE-SYSTEM.md`
   - `cardbuilder/docs/projects/main-template/INDEX.md`

This prevents important decisions from being trapped inside one report.

## Chat Is Not Storage

Conversation history is helpful but not durable enough to be trusted as the only source.

If a future session would need a result, save it to:

- raw evidence
- canonical artifact
- durable Markdown interpretation

At least one machine-readable file and one human-readable file must exist for important work.

## Minimum Protocol By Task Type

### For a Scan

Required:

- raw scan output
- canonical normalized file
- report update
- manifest freshness update

### For a Plugin Refresh

Required:

- refresh map or execution log
- pre-state evidence
- post-state readback evidence
- validation note

### For a Live Migration

Required:

- migration plan
- before backups
- draft execution log
- post-publish scan package
- sync review update

### For a Semantic Registry

Required:

- source scan artifacts
- machine-readable registry file under `data/inventories/`
- human-readable registry doc under `docs/projects/main-template/`
- naming rule that explains when semantic names are preferred over numeric suffixes
- stable lifecycle rule for added, renamed, and removed entries

### For External Browser Reports

Required:

- preserve the source report or import location
- create a critical review
- promote only accepted findings into canon

## Default Rule For Future Sessions

When asked to repeat similar Carrd work, do this in order:

1. read the registry
2. read `knowledge-status.json`
3. read the relevant plan/runbook/review docs
4. inspect canonical artifacts
5. inspect raw evidence only if canonical trust is unclear or a mismatch appears
6. execute
7. write back the operation package

This is the default reproduction path unless the owner explicitly requests a one-off exploratory workflow.
