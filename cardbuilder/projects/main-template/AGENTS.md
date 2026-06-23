# Agent Contract

Purpose: AI-first operating contract for project main-template.
Human-facing explanations and long history live in `cardbuilder/docs/projects/main-template/`.

## Precedence

1. Explicit user instruction.
2. This project AGENTS.md.
3. Parent/root AGENTS.md at `/Users/popskraft/Projects/carrd-v2/AGENTS.md`.
4. `cardbuilder/docs/projects/main-template/INDEX.md` and the site state manifests when needed.

## Identity

Project: main-template
Root: `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template`
Type: site-package workspace
Primary output: site-specific code, docs, and operation artifacts.

## Canon

Source of truth for stable operating rules: this file.
Source of truth for site docs navigation: `cardbuilder/docs/projects/main-template/INDEX.md`.
Source of truth for site profile and scan status: `data/manifests/site-profile.json` and `data/manifests/knowledge-status.json`.
Source of truth for execution evidence: the `data/` subfolders under this package.

## Must

- Keep durable non-sensitive documentation inside `cardbuilder/docs/projects/main-template/`.
- Keep AGENTS.md compact and operational.
- Keep one meaning in one owner file.
- Update the relevant state manifests after material changes when their scope changes.
- Route long-form procedures and reference material to `cardbuilder/docs/projects/main-template/`.

## Never

- Do not create external memory roots by default.
- Do not store secrets, tokens, cookies, or session artifacts in docs.
- Do not duplicate the entire package canon here.
- Do not use destructive rollback/history-rewrite commands without explicit human approval.

## Commands

- Install/deps: use the project-standard package manager and lockfile policy.
- Validate: run the project's native checks for the touched surface.
- Deploy/publish: only through the project-approved workflow.

If exact commands are needed, keep them in `cardbuilder/docs/projects/main-template/`.

## Local Exceptions

None.

## Ask Before

- Irreversible data/schema changes.
- Production/publication actions.
- Structural source-of-truth changes.
- New external dependencies with cost/compliance impact.

## Audit Status

Status: OK (compact contract).
If this file grows into runbook/history/research bulk, split it and move that material to `cardbuilder/docs/projects/main-template/`.
