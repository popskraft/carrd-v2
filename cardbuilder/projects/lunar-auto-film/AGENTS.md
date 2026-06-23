# Agent Contract

Purpose: AI-first operating contract for project lunar-auto-film.
Human-facing explanations and long history live in `cardbuilder/docs/projects/lunar-auto-film/`.

## Precedence

1. Explicit user instruction.
2. This project AGENTS.md.
3. Parent/root AGENTS.md at `/Users/popskraft/Projects/AGENTS.md`.
4. `cardbuilder/docs/projects/lunar-auto-film/INDEX.md` and the site state manifests when needed.

## Identity

Project: lunar-auto-film
Root: `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/lunar-auto-film`
Type: site-package workspace
Primary output: site-specific scan docs, manifests, and operation artifacts.

## Canon

Source of truth for stable operating rules: this file.
Source of truth for site docs navigation: `cardbuilder/docs/projects/lunar-auto-film/INDEX.md`.
Source of truth for site profile and scan status: `data/manifests/site-profile.json` and `data/manifests/knowledge-status.json`.
Source of truth for execution evidence: the `data/` subfolders under this package.

## Must

- Keep durable non-sensitive documentation inside `cardbuilder/docs/projects/lunar-auto-film/`.
- Keep AGENTS.md compact and operational.
- Keep one meaning in one owner file.
- Update the relevant state manifests after material changes when their scope changes.
- Route long-form procedures and reference material to `cardbuilder/docs/projects/lunar-auto-film/`.

## Never

- Do not create external memory roots by default.
- Do not store secrets, tokens, cookies, or session artifacts in docs.
- Do not duplicate the entire package canon here.
- Do not use destructive rollback/history-rewrite commands without explicit human approval.

## Commands

- Install/deps: use the project-standard package manager and lockfile policy.
- Validate: run the project's native checks for the touched surface.
- Deploy/publish: only through the project-approved workflow.

If exact commands are needed, keep them in `cardbuilder/docs/projects/lunar-auto-film/`.

## Local Exceptions

None.

## Ask Before

- Irreversible data/schema changes.
- Production/publication actions.
- Structural source-of-truth changes.
- New external dependencies with cost/compliance impact.

## Audit Status

Status: OK (compact contract).
If this file grows into runbook/history/research bulk, split it and move that material to `cardbuilder/docs/projects/lunar-auto-film/`.
