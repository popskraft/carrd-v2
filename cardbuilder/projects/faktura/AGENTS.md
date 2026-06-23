# Agent Contract

Purpose: AI-first operating contract for project faktura.
Human-facing explanations and long history live in `cardbuilder/docs/projects/faktura/`.

## Precedence

1. Explicit user instruction.
2. This project AGENTS.md.
3. Parent/root AGENTS.md at `/Users/popskraft/Projects/AGENTS.md`.
4. `cardbuilder/docs/projects/faktura/INDEX.md` and the site state manifests when needed.

## Identity

Project: faktura
Root: `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/faktura`
Type: Carrd live-site package and browser-automation workspace.
Primary output: project-specific code, docs, and automation artifacts.

## Canon

Source of truth for stable operating rules: this file.
Source of truth for site docs navigation: `cardbuilder/docs/projects/faktura/INDEX.md`.
Source of truth for site profile and scan status: `data/manifests/site-profile.json` and `data/manifests/knowledge-status.json`.
Source of truth for execution evidence: the `data/` subfolders under this package.

## Must

- Keep durable non-sensitive documentation inside `cardbuilder/docs/projects/faktura/`.
- Keep AGENTS.md compact and operational.
- Keep one meaning in one owner file.
- Update the relevant state manifests after material changes when their scope changes.
- Treat the live Builder URL as a tracked site package, not a generic probe target.
- Treat `automation/` as read-only by default unless the owner explicitly authorizes a write run.

## Never

- Do not store secrets, tokens, cookies, or session artifacts in docs.
- Do not create external memory roots by default.
- Do not use destructive rollback/history-rewrite commands without explicit human approval.

## Local Exceptions

- Builder URL currently tracked here: `https://carrd.co/dashboard/4778178033233108/build`
- Published URL is not yet confirmed in canon.
- Automation scripts in `automation/` are read-only by default unless the owner explicitly authorizes a write run.

## Ask Before

- Irreversible data/schema changes.
- Production/publication actions.
- Structural source-of-truth changes.
- New external dependencies with cost/compliance impact.

## Audit Status

Status: OK.
