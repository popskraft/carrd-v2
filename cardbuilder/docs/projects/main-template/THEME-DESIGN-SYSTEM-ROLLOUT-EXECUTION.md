---
id: THEME_DESIGN_SYSTEM_ROLLOUT_EXECUTION
status: complete
domain: template-instance
owner: human_owner
last_updated: 2026-04-07
updated_by: codex
related_plan: /Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/THEME-DESIGN-SYSTEM-ROLLOUT-PLAN.md
---

# Theme Design System Rollout Execution

## TL;DR

The rollout is complete.

The project now has:

- a generated `dist/theme-design-system.html`
- root and generated plugin README flows centered on that artifact
- source README guidance normalized so style overrides point to `theme-design-system.html` first

The Builder and published-site checks confirmed that the active draft and the live site already carry the new theme design system foundation in semantically equivalent form.

Current rollout mode is therefore:

- repo/docs complete
- Builder draft verified
- published-site control passed

## Execution Status

### Overall

- status: `complete`
- completion class: `repo/docs + builder/live verification complete`
- live mutation status: `no new mutation required`
- publish status: `no new publish required for verification`

### Rollout Mode Decision

Decision for this execution:

- `verification-first rollout completion`

Reason:

- repo and documentation work were completed deterministically in the local workspace
- the active Builder draft already exposed `embed02` as `Theme Design System (in HEAD)`
- the draft content matched the local distributive artifact at normalized/squashed equivalence
- the published site CSS also matched the same foundation at squashed equivalence
- no additional draft mutation or fresh publish was required to complete the rollout verification

## Scope Executed In This Pass

### Completed

1. generated and retained the new distributive artifact:
   - `/Users/popskraft/Projects/carrd-v2/dist/theme-design-system.html`
2. updated the main user-facing install flow in:
   - `/Users/popskraft/Projects/carrd-v2/README.md`
3. updated generated plugin README guidance through:
   - `/Users/popskraft/Projects/carrd-v2/scripts/templates/plugin_readme.md`
4. updated README generation guidance in:
   - `/Users/popskraft/Projects/carrd-v2/docs/templates/plugin-readme-template.md`
5. normalized active developer guidance in:
   - `/Users/popskraft/Projects/carrd-v2/docs/specs/carrd-v2-contract.md`
6. normalized plugin-specific source README override wording in:
   - `/Users/popskraft/Projects/carrd-v2/src/cards/README.md`
   - `/Users/popskraft/Projects/carrd-v2/_archive/columns/README.md`
   - `/Users/popskraft/Projects/carrd-v2/src/faq/README.md`
   - `/Users/popskraft/Projects/carrd-v2/src/grid-cluster/README.md`
   - `/Users/popskraft/Projects/carrd-v2/src/header-nav/README.md`
   - `/Users/popskraft/Projects/carrd-v2/src/modal/README.md`
   - `/Users/popskraft/Projects/carrd-v2/src/shopping-cart/README.md`
   - `/Users/popskraft/Projects/carrd-v2/src/slider/README.md`
   - `/Users/popskraft/Projects/carrd-v2/src/typography/README.md`
7. regenerated distributive README files in `dist/`
8. verified the active Builder draft target:
   - `embed02`
   - title: `Theme Design System (in HEAD)`
9. verified the published site carries the same theme foundation at squashed CSS equivalence
10. saved live verification evidence:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed02-live-theme-design-system-0.1.16.html`
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/theme-design-system-rollout-verify-0.1.16.json`

### Not Executed

1. fresh Builder mutation
2. fresh publish
3. post-publish template-instance re-scan package refresh

## Commands Run

### Build And Generation

Executed successfully:

```bash
python3 scripts/minify_plugins.py
python3 scripts/minify_plugins.py --docs-only
```

The full build created the new distributive theme artifact.
The docs-only rebuild was then used to propagate wording fixes through generated README files after source documentation normalization.

### Builder / Live Verification

Executed successfully via CDP + Playwright against the active debug Chrome session:

- read back `window.app.builder.site.components.embed02`
- compared draft content against `dist/theme-design-system.html`
- extracted the published style block from `https://mini.crd.co/`
- compared published CSS against the same local artifact

## Evidence

### Primary Artifact

- `/Users/popskraft/Projects/carrd-v2/dist/theme-design-system.html`

### Root Install Flow

- `/Users/popskraft/Projects/carrd-v2/README.md`
- `/Users/popskraft/Projects/carrd-v2/dist/README.md`

### Generated Plugin Install Flow

Examples checked after regeneration:

- `/Users/popskraft/Projects/carrd-v2/dist/faq/README.md`
- `/Users/popskraft/Projects/carrd-v2/dist/slider/README.md`

### Builder / Published Verification Evidence

- `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed02-live-theme-design-system-0.1.16.html`
- `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/theme-design-system-rollout-verify-0.1.16.json`

### Builder Context Confirmed

Active template registry checked:

- `/Users/popskraft/Projects/carrd-v2/cardbuilder/data/active-template.json`

Confirmed values:

- builder URL:
  - `https://carrd.co/dashboard/4155176224428477/build`
- published URL:
  - `https://mini.crd.co/`
- save/publish policy:
  - `operator-only`

## Plan Step Status

### Completed Steps

1. Step 1 — Freeze The Decision
   - completed by creating the rollout plan and implementing the repo default around `theme-design-system.html`

2. Step 2 — Confirm Repo Input Files
   - completed

3. Step 3 — Build And Verify The New Artifact
   - completed

4. Step 4 — Normalize Root README Messaging
   - completed

5. Step 5 — Normalize Generated Plugin README Messaging
   - completed

6. Step 6 — Clean Secondary Documentation Drift
   - completed for active repo guidance in this pass

7. Step 7 — Prepare Builder Rollout Decision
   - completed

8. Step 8 — If Approved, Update Builder Draft Deterministically
   - completed as a no-op convergence check:
     - active draft already carried the intended theme design system foundation
     - current live draft content was backed up and verified instead of being replaced again

9. Step 9 — Validate Builder Draft Before Publish
   - completed

10. Step 10 — Control On The Live Site
    - completed
    - published site passed semantic equivalence checks for the shared theme foundation

### Pending Steps

None for this rollout.

## Current Acceptance Check

### Passed Now

1. `dist/theme-design-system.html` exists as a generated artifact
2. root README presents `theme-design-system.html` as the default install path
3. generated plugin README files present `theme-design-system.html` as the default install path
4. manual fallback remains explicit:
   - `theme-design-tokens.css` required
   - `theme-ui.css` recommended
5. active repo guidance no longer treats manual assembly of the two-file flow as the default user path
6. active Builder draft `embed02` is present and verified against the local theme design system artifact
7. published site theme CSS is verified against the same local foundation at squashed equivalence

### Verification Interpretation

Carrd normalizes embed content formatting between local distributive files, Builder draft storage, and published HTML.

For this rollout, the pass condition for Builder/published verification was therefore:

- normalized or squashed semantic equivalence of the shared theme CSS content

not strict byte-for-byte equality of the wrapped HTML file.

## Next Required Move

No further move is required for this rollout itself.

Optional follow-on:

1. refresh the template-instance scan package if we want the new theme design system title/state reflected in the canonical scan artifacts
2. keep using `theme-design-system.html` as the default theme setup artifact for future Builder/plugin operations
