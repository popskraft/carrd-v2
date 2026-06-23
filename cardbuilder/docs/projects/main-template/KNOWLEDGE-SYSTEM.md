# Main Template Knowledge System

## Purpose

Define a deterministic knowledge workflow for the universal Carrd template so builder structure, plugin state, and sync decisions can be reused safely across sessions.

## Canonical Source Priority

1. Live template state in Carrd Builder for the active URL from `cardbuilder/data/active-template.json`
2. Repo-local deterministic artifacts under `cardbuilder/projects/main-template/data/`
3. Repo-local durable docs under `cardbuilder/docs/projects/main-template/`
4. Root plugin source and distributives:
   - `/Users/popskraft/Projects/carrd-v2/src`
   - `/Users/popskraft/Projects/carrd-v2/dist`
5. Supplemental Carrd reference repo:
   - `/Users/popskraft/Projects/docs-rag-mvp`

If sources disagree, prefer the higher item in this list and record the mismatch.

## Knowledge Domains

All Carrd knowledge in this workflow belongs to one of two domains.

### Domain A — `builder-static`

This is knowledge about the Carrd Builder itself rather than about one specific site.

Examples:

- global menu actions
- menu item meaning and stable action patterns
- `#menu [data-action="view-site"]` as the builder action for opening the ready site/design view
- properties panel structure
- stable tab groups such as content/design/settings-like sections
- recurring builder UI selectors, `data-action`, `data-type`, panel widgets, and control conventions

Behavior rules:

- treat it as reusable across projects by default
- refresh it when builder UI drift is suspected
- do not confuse it with the component structure of a specific site

### Domain B — `template-instance`

This is knowledge about the current active template or another specific Carrd project.

Examples:

- component tree for the active builder URL
- published site URL for the active project
- project-specific classes, IDs, anchors, embeds, galleries, forms, and sections
- project-specific settings and style assignments
- live plugin inventory and plugin-to-template mappings
- sync diffs against `/Users/popskraft/Projects/carrd-v2/src` and `/Users/popskraft/Projects/carrd-v2/dist`

Behavior rules:

- always tie it to a specific template id and builder URL
- treat it as project-scoped even if many parts appear stable
- refresh it when project content, plugin wiring, or structure meaningfully changes

## Boundary Rule

The split must stay explicit:

- `builder-static` answers questions like:
  - how the builder is organized,
  - where actions live,
  - how the settings panel is structured,
  - which UI patterns are stable across Carrd projects.
- `template-instance` answers questions like:
  - what exists in this template,
  - which IDs/classes/settings this project currently uses,
  - which plugins are embedded here,
  - whether this template is synchronized with repo plugin state.

Never promote `template-instance` observations into `builder-static` canon without evidence across scans.

## Storage Layers

### Layer 1 — Deterministic Canon

Store machine-readable artifacts here:

- `cardbuilder/projects/main-template/data/manifests/`
- `cardbuilder/projects/main-template/data/snapshots/`
- `cardbuilder/projects/main-template/data/style-maps/`
- `cardbuilder/projects/main-template/data/inventories/`
- `cardbuilder/projects/main-template/data/diffs/`

Required artifact types:

- scan status manifest
- builder-static knowledge manifest
- full builder snapshot
- DOM audit snapshot
- style map
- live template plugin inventory
- semantic registries when a project-scoped entity set must stay stable across updates
- repo-vs-template sync diff when comparison work is requested

### Layer 2 — Durable Human Docs

Store reusable interpretation and operating guidance here:

- `cardbuilder/docs/projects/main-template/`

Examples:

- knowledge system rules
- scan runbook
- sync workflow notes
- stable mapping notes that are easier to review in Markdown than JSON
- normalized GUI action maps and critical reviews of external browser reports
- deterministic reproduction rules and operation-package protocols

### Layer 3 — Supplemental Retrieval Layer

Allowed repo:

- `/Users/popskraft/Projects/docs-rag-mvp`

Use it only for:

- Carrd public docs retrieval
- exported Markdown/text summaries derived from canonical local artifacts
- fast lookup after local canonical artifacts already exist

Do not use it as the only store for builder structure, IDs, classes, menu actions, or template/plugin sync state.

## Mandatory Metadata

Every machine-readable canonical artifact set must make it possible to answer:

- which knowledge domain the artifact belongs to
- which template was scanned
- which builder URL was scanned
- when it was scanned
- whether the scan was full or partial
- which plugin source root and dist root were used for comparison
- whether the scan is still trusted for sync work

At minimum, this metadata must exist in:

- `cardbuilder/projects/main-template/data/manifests/knowledge-status.json`

## Freshness Rules

A fresh full scan is required when any of the following is true:

1. The active template URL changed.
2. The active template project path changed.
3. There is no prior full scan for the active template.
4. The last full scan predates meaningful template edits or plugin changes relevant to the task.
5. The user asks for plugin sync, audit, or deterministic comparison and current artifacts are missing key structures.

A fresh full scan is recommended when:

- the latest full scan is old enough that Carrd Builder UI drift is plausible,
- or public Carrd behavior appears inconsistent with stored artifacts.

## Minimum Full Scan Package

A full scan package for the active template should include:

1. Builder component export from `window.app.builder.site.components`
2. DOM audit snapshot
3. style map snapshot
4. controls and anchors map
5. live plugin/template inventory
6. manifest update with `fullScanCompletedAt`

## Scan Separation Rule

When performing knowledge capture, separate the work into two tracks:

1. `builder-static` scan track
   - capture stable builder menu/actions/panel structure
   - update reusable builder knowledge artifacts only when needed
2. `template-instance` scan track
   - capture the current project-specific component tree and plugin state
   - update project-scoped artifacts for the active template

The second track may be repeated more often than the first.

## Final Validation Rule

Final validation should distinguish between:

1. Builder-side validation
   - inspect the live builder state in DevTools
   - confirm expected structure, settings, and plugin wiring
2. Published-view validation
   - use `#menu [data-action="view-site"]` when available to open the ready site/design view
   - or open the project's published site URL from the active template registry directly

For the canonical main template project, the published site URL is project-scoped `template-instance` knowledge, while the `view-site` action itself is `builder-static` knowledge.

## Plugin Sync Rules

When the task involves template/plugin comparison or synchronization:

1. Read the active template registry.
2. Read the knowledge status manifest.
3. Confirm whether the stored scan is sufficient.
4. If not sufficient, run a fresh full scan first.
5. Compare live template state against:
   - `/Users/popskraft/Projects/carrd-v2/src`
   - `/Users/popskraft/Projects/carrd-v2/dist`
6. Store the comparison result as a deterministic diff artifact before claiming the systems are synchronized.

## Operation Recording Rules

All meaningful Carrd work must be recorded as a reproducible operation package.

Use:

- raw evidence under `cardbuilder/projects/main-template/data/raw-imports/`
- canonical normalized artifacts under the stable `data/` subfolders
- durable Markdown interpretation under `cardbuilder/docs/projects/main-template/`

The controlling protocol for this is:

- `cardbuilder/docs/projects/main-template/DETERMINISTIC-REPRODUCTION-RULES.md`

If a result matters for future sessions, do not leave it only in chat history.

## Export To RAG Rules

If knowledge should be searchable through `docs-rag-mvp`:

1. Export summaries from canonical local artifacts into Markdown or text.
2. Keep the export explicit about source template, builder URL, and scan date.
3. Keep the domain explicit: `builder-static` or `template-instance`.
3. Ingest those exports into `docs-rag-mvp` as a supplemental layer.
4. Never skip local canonical storage just because RAG ingestion succeeded.
