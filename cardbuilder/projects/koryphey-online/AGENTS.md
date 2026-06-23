# Agent Contract

Purpose: AI-first operating contract for project koryphey-online.
Human-facing explanations and long history live in `cardbuilder/docs/projects/koryphey-online/`.

## Precedence

1. Explicit user instruction.
2. This project AGENTS.md.
3. Parent/root AGENTS.md at `/Users/popskraft/Projects/carrd-v2/AGENTS.md`.
4. `cardbuilder/docs/projects/koryphey-online/INDEX.md` and the migration state files when needed.

## Identity

Project: koryphey-online
Root: `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/koryphey-online`
Type: migration workspace
Primary output: migration docs, run artifacts, and automation artifacts.

## Canon

Source of truth for stable operating rules: this file.
Source of truth for site docs navigation: `cardbuilder/docs/projects/koryphey-online/INDEX.md`.
Source of truth for migration manifest: `data/manifests/SITE2_TO_SITE1_TRANSFER_MANIFEST.tsv`.
Source of truth for execution evidence: `data/runs/` and `data/snapshots/`.

## Must

- Keep durable non-sensitive documentation inside `cardbuilder/docs/projects/koryphey-online/`.
- Keep AGENTS.md compact and operational.
- Keep one meaning in one owner file.
- Update the migration manifest and run evidence after material changes when their scope changes.
- Route long-form procedures and reference material to `cardbuilder/docs/projects/koryphey-online/`.
- Treat `automation/` as read-only by default unless the owner explicitly authorizes a write run.

## Never

- Do not create external memory roots by default.
- Do not store secrets, tokens, cookies, or session artifacts in docs.
- Do not duplicate the entire package canon here.
- Do not use destructive rollback/history-rewrite commands without explicit human approval.

## Commands

- Install/deps: use the project-standard package manager and lockfile policy.
- Validate: run the project's native checks for the touched surface.
- Deploy/publish: only through the project-approved workflow.

If exact commands are needed, keep them in `cardbuilder/docs/projects/koryphey-online/` or `automation/README.md`.

## Local Exceptions

None.

## Ask Before

- Irreversible data/schema changes.
- Production/publication actions.
- Structural source-of-truth changes.
- New external dependencies with cost/compliance impact.

## Audit Status

Status: OK (compact contract).
If this file grows into runbook/history/research bulk, split it and move that material to `cardbuilder/docs/projects/koryphey-online/`.
