# Agent Contract

Purpose: AI-first operating contract for project admincarrd.
Human-facing explanations and long history live in `admincarrd/docs/`.

## Precedence

1. Explicit user instruction.
2. This project AGENTS.md.
3. Parent/root AGENTS.md at `/Users/popskraft/Projects/AGENTS.md`.
4. `admincarrd/docs/INDEX.md` and the docs owner files when needed.

## Identity

Project: admincarrd
Root: `/Users/popskraft/Projects/carrd-v2/admincarrd`
Type: project workspace
Primary output: project-specific code, docs, and operations artifacts.

## Canon

Source of truth for stable operating rules: this file.
Source of truth for docs navigation: `admincarrd/docs/INDEX.md`.
Source of truth for human orientation: `admincarrd/docs/README.md`.
Source of truth for change history: `admincarrd/docs/CHANGELOG.md`.

## Must

- Keep durable non-sensitive documentation inside `admincarrd/docs/`.
- Keep AGENTS.md compact and operational.
- Keep one meaning in one owner file.
- Update docs owner files after material changes when their scope changes.

## Never

- Do not create external memory roots by default.
- Do not store secrets, tokens, cookies, or session artifacts in docs.
- Do not duplicate the entire project canon here.
- Do not use destructive rollback/history-rewrite commands without explicit human approval.

## Commands

- Install/deps: use the project-standard package manager and lockfile policy.
- Validate: run the project's native checks for the touched surface.
- Deploy/publish: only through the project-approved workflow.

If exact commands are needed, keep them in `admincarrd/docs/` owner docs.

## Local Exceptions

None.

## Ask Before

- Irreversible data/schema changes.
- Production/publication actions.
- Structural source-of-truth changes.
- New external dependencies with cost/compliance impact.

## Audit Status

Status: OK (compact contract).
If this file grows into runbook/history/research bulk, split it and move that material to `admincarrd/docs/`.
