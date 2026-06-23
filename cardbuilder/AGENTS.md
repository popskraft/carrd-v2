# Agent Contract

Purpose: AI-first operating contract for project cardbuilder.
Human-facing explanations and long history live in `cardbuilder/docs/`.

## Precedence

1. Explicit user instruction.
2. This project AGENTS.md.
3. Parent/root AGENTS.md at `/Users/popskraft/Projects/AGENTS.md`.
4. `cardbuilder/docs/INDEX.md` and the relevant site-package docs indexes when needed.

## Identity

Project: cardbuilder
Root: `/Users/popskraft/Projects/carrd-v2/cardbuilder`
Type: multi-site Carrd workspace
Primary output: shared docs, site-package docs, data manifests, and automation artifacts.

## Canon

Source of truth for stable operating rules: this file.
Source of truth for workspace docs navigation: `cardbuilder/docs/INDEX.md`.
Source of truth for site-package docs navigation: `cardbuilder/docs/projects/<site-slug>/INDEX.md`.
Source of truth for site/package state: the relevant `data/manifests/*`, `data/snapshots/*`, and `data/runs/*` files under each site package.

## Must

- Keep durable non-sensitive documentation inside `cardbuilder/docs/`.
- Keep AGENTS.md compact and operational.
- Keep one meaning in one owner file.
- Update the relevant site state files after material changes when they exist.
- Route long-form procedures and reference material to `cardbuilder/docs/`.

## Never

- Do not create external memory roots by default.
- Do not store secrets, tokens, cookies, or session artifacts in docs.
- Do not duplicate the entire workspace canon here.
- Do not use destructive rollback/history-rewrite commands without explicit human approval.

## Commands

- Install/deps: use the project-standard package manager and lockfile policy.
- Validate: run the project's native checks for the touched surface.
- Deploy/publish: only through the project-approved workflow.

If exact commands are needed, keep them in `cardbuilder/docs/` owner docs.

## Local Exceptions

None.

## Ask Before

- Irreversible data/schema changes.
- Production/publication actions.
- Structural source-of-truth changes.
- New external dependencies with cost/compliance impact.

## Audit Status

Status: OK (compact contract).
If this file grows into runbook/history/research bulk, split it and move that material to `cardbuilder/docs/`.
