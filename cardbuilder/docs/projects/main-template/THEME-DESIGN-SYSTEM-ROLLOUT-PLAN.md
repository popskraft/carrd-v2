---
id: THEME_DESIGN_SYSTEM_ROLLOUT_PLAN
status: planned
domain: template-instance
owner: human_owner
last_updated: 2026-04-07
updated_by: codex
---

# Theme Design System Rollout Plan

## TL;DR

This document fixes the rollout contract for moving the Carrd theme setup from a user-facing two-file install flow to a single ready-to-paste `theme-design-system.html` flow.

Current repo work already prepares the new artifact locally.
This plan defines what still needs to be aligned across repo docs, Builder draft state, published behavior, and canonical evidence before the rollout can be treated as complete.

This document is an execution plan.
It is not the rollout itself.

## Purpose

Create one explicit, saveable plan that answers all of these questions without ambiguity:

1. what existed before
2. what the target state must be
3. which steps must happen in order
4. how completion is judged
5. which final control must be performed on the live site

## Related Canon

- [/Users/popskraft/Projects/carrd-v2/AGENTS.md](/Users/popskraft/Projects/carrd-v2/AGENTS.md)
- [/Users/popskraft/Projects/carrd-v2/docs/INDEX.md](/Users/popskraft/Projects/carrd-v2/docs/INDEX.md)
- [/Users/popskraft/Projects/carrd-v2/docs/specs/carrd-contract.md](/Users/popskraft/Projects/carrd-v2/docs/specs/carrd-contract.md)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/PLUGIN-SYNC-REVIEW.md](/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/PLUGIN-SYNC-REVIEW.md)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/DETERMINISTIC-REPRODUCTION-RULES.md](/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/DETERMINISTIC-REPRODUCTION-RULES.md)

## As-Is

### Repo Product State

The old user-facing theme setup was explained as:

1. install `theme-design-tokens.css`
2. then install `theme-ui.css`
3. manually wrap CSS in a Carrd `HEAD` `<style>` block

The repo now has a local draft implementation of the new artifact:

- `dist/theme-design-system.html`

Its job is to provide one ready-to-paste `HEAD` embed that already wraps:

- `theme-design-tokens.css`
- `theme-ui.css`

### Documentation State

The main user-facing README flow has already been shifted toward `theme-design-system.html` in:

- [/Users/popskraft/Projects/carrd-v2/README.md](/Users/popskraft/Projects/carrd-v2/README.md)
- [/Users/popskraft/Projects/carrd-v2/scripts/templates/plugin_readme.md](/Users/popskraft/Projects/carrd-v2/scripts/templates/plugin_readme.md)
- [/Users/popskraft/Projects/carrd-v2/docs/templates/plugin-readme-template.md](/Users/popskraft/Projects/carrd-v2/docs/templates/plugin-readme-template.md)

But the broader doc surface is not yet fully normalized.
At minimum, historical or developer-facing references still exist that point to the old two-file mental model, for example in:

- [/Users/popskraft/Projects/carrd-v2/docs/specs/carrd-contract.md](/Users/popskraft/Projects/carrd-v2/docs/specs/carrd-contract.md)
- older Builder/template scan artifacts under `cardbuilder/projects/main-template/data/`

### Builder And Live State

The currently saved canonical Builder/template artifacts were produced before this rollout was recorded.
That means the last normalized Builder evidence and scan-package evidence should be treated as still reflecting the old two-file foundation language unless proven otherwise by a fresh execution and re-scan.

### Operational Risk

Without one explicit rollout plan, the repo can drift into an ambiguous state where:

- repo docs say the new flow is standard
- Builder draft still uses older foundation assumptions
- live site may or may not match
- future sessions cannot tell whether the rollout is complete or only partially prepared

## Target State

The desired stable state is:

1. `theme-design-system.html` is the default documented install flow for Carrd theme setup
2. `theme-design-tokens.css` remains the required manual fallback
3. `theme-ui.css` remains the recommended manual companion file
4. generated plugin README files and root README all present the same install order
5. Builder draft, if updated as part of this rollout, uses the new theme foundation artifact intentionally and reproducibly
6. published-site validation confirms the live site still renders correctly after the new theme foundation flow is applied
7. canonical operation evidence proves the rollout result instead of leaving the conclusion only in chat

## In Scope

- repo build output for `theme-design-system.html`
- repo documentation for the new install flow
- Builder draft update if the owner chooses to push the new theme foundation into the live template
- published-view regression check
- post-rollout evidence and canon update

## Out Of Scope

- redesigning plugin visuals
- changing plugin behavior unrelated to theme setup
- removing `theme-design-tokens.css` or `theme-ui.css` from `dist/`
- silently publishing Builder changes without owner approval

## Completion Criteria

The task is complete only when all criteria below are true:

1. `dist/theme-design-system.html` is generated by the normal build flow
2. root README and generated plugin README files present `theme-design-system.html` as the default install path
3. manual fallback language remains explicit:
   - `theme-design-tokens.css` required
   - `theme-ui.css` recommended
4. no user-facing README instructs the user to manually assemble the default theme setup from scratch when `theme-design-system.html` is available
5. if Builder draft was changed, before-state and after-state evidence are both saved
6. if Builder draft was changed, readback verification confirms the intended theme foundation content is actually present
7. live published-site check shows no obvious regression in layout, controls, or shared plugin styling
8. an execution or verification record exists in `cardbuilder/docs/projects/main-template/`

## Ten-Step Rollout

### Step 1 — Freeze The Decision

Goal:

- make the rollout intent explicit before any further edits

Action:

- treat `theme-design-system.html` as the approved default Carrd theme install artifact
- treat `theme-design-tokens.css` and `theme-ui.css` as manual fallback assets, not as the primary user flow

Output:

- this plan document

### Step 2 — Confirm Repo Input Files

Goal:

- ensure the source of truth for the new theme foundation is stable

Actions:

1. confirm the current source files:
   - `/Users/popskraft/Projects/carrd-v2/src/theme-design-tokens.css`
   - `/Users/popskraft/Projects/carrd-v2/src/theme-ui.css`
2. confirm the build script composes them into:
   - `/Users/popskraft/Projects/carrd-v2/dist/theme-design-system.html`

Output:

- deterministic mapping from source files to distributive artifact

### Step 3 — Build And Verify The New Artifact

Goal:

- prove the new distributive file is build-generated, not hand-edited

Actions:

1. run:
   - `python3 scripts/minify_plugins.py`
2. confirm the output file exists:
   - `/Users/popskraft/Projects/carrd-v2/dist/theme-design-system.html`
3. confirm the file contains one `<style>...</style>` block with both theme layers included

Output:

- build-confirmed theme design system artifact

### Step 4 — Normalize Root README Messaging

Goal:

- make the main installation story unambiguous

Actions:

1. confirm root README presents:
   - `theme-design-system.html` as default
   - `theme-design-tokens.css` and `theme-ui.css` as manual fallback
2. remove any remaining root-level wording that suggests the user should manually assemble the default flow first

Output:

- one stable root install narrative

### Step 5 — Normalize Generated Plugin README Messaging

Goal:

- ensure every plugin README inherits the same installation logic

Actions:

1. confirm `scripts/templates/plugin_readme.md` matches the target wording
2. rebuild docs
3. spot-check generated plugin README files in `dist/`

Output:

- plugin README layer aligned with root README

### Step 6 — Clean Secondary Documentation Drift

Goal:

- reduce future confusion from older helper docs

Actions:

1. review secondary docs that still describe the old two-file setup as the primary path
2. update only the docs that function as active guidance
3. leave historical evidence untouched if it is archival and clearly older

Minimum review targets:

- `/Users/popskraft/Projects/carrd-v2/docs/specs/carrd-contract.md`
- any active runbook or theme-setup instruction that future operators are likely to follow

Output:

- reduced documentation drift between primary and secondary guidance

### Step 7 — Prepare Builder Rollout Decision

Goal:

- explicitly decide whether this change remains repo-only or also updates the live Carrd template

Actions:

1. check the active template registry:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/data/active-template.json`
2. check current template sync context:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/PLUGIN-SYNC-REVIEW.md`
3. decide one of these modes:
   - repo-only rollout
   - repo + Builder draft rollout

Decision rule:

- if no Builder mutation is approved, stop after repo/doc completion and record that live rollout is pending

Output:

- explicit rollout mode

### Step 8 — If Approved, Update Builder Draft Deterministically

Goal:

- move the Carrd draft from the old foundation install assumption to the new one without ambiguity

Actions:

1. identify the exact `HEAD` embed block that carries the theme foundation
2. save before-state evidence
3. replace or refresh that Builder content using the new `theme-design-system.html`
4. save after-state readback evidence
5. do not publish automatically unless the owner explicitly approves

Required evidence:

- before-state backup
- after-state content readback
- exact target embed id or title

Output:

- reproducible Builder draft mutation record

### Step 9 — Validate Builder Draft Before Publish

Goal:

- catch regressions before live exposure

Checks:

1. shared theme colors still apply
2. shared UI controls still render
3. slider arrows and dots still look correct
4. modal close control still looks correct
5. shopping-cart shared controls still look correct
6. no obvious missing styles appear because of the new theme foundation packaging

Output:

- Builder-side pass or fail result

### Step 10 — Control On The Live Site

Goal:

- make the final decision against the published reality, not only the Builder draft

Actions:

1. publish only with owner approval
2. open the published site through the approved validation path
3. verify real user-facing behavior on the live site

Required live checks:

1. page styling is intact
2. shared plugin controls are still styled
3. no obvious loss of theme variables is visible
4. no obvious regression appears in mobile-relevant or control-heavy areas
5. the live result matches the intended rollout mode

Completion rule:

- the rollout must not be called complete until this live-site control is passed or explicitly marked pending because publish approval was withheld

Output:

- final live validation decision

## Evidence Package To Save

If the rollout goes beyond repo-only documentation work, save:

1. before-state Builder foundation content
2. after-state Builder foundation content
3. any relevant screenshot or readback proof
4. execution summary in a sibling execution doc
5. refreshed canonical scan artifacts if publish occurred

## Failure And Stop Conditions

Stop and escalate if any of the following becomes true:

1. it is unclear which Builder embed is the active theme foundation block
2. the new `theme-design-system.html` content cannot be matched back to the local build artifact
3. secondary docs and primary docs disagree on the approved default path after the rollout pass
4. Builder looks acceptable but the published site regresses
5. owner approval for publish is missing

## Final Definition Of Done

The rollout is fully done only when:

1. repo build output is correct
2. repo documentation is coherent
3. Builder state is either:
   - intentionally untouched and marked as pending live rollout
   - or deterministically updated with saved evidence
4. the published site has passed the final control step, if publish was part of the approved scope
