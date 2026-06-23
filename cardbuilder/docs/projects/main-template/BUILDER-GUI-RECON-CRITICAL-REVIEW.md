# Builder GUI Recon Critical Review

## Purpose

Critically process the externally supplied full Carrd Builder GUI reconnaissance report before promoting any of its claims into local `builder-static` canon.

This document exists to keep three things separate:

1. accepted `builder-static` refinements
2. useful but still caveated observations
3. report content that is not canonical because it is project-specific, weakly supported, or too implementation-fragile

## Source Under Review

- external browser report received on `2026-04-06`
- scope:
  - full Carrd Builder GUI reconnaissance
  - toolbar action map
  - panel map
  - mode/view map
  - residual unknowns

Source quality:

- high-value because it includes DOM/CSS/state-transition claims
- not self-reproduced by this agent in the live builder
- must not override stronger local canon unless the new claim materially improves it and does not create unresolved contradiction

## Review Outcome

### Accepted As Canonical Refinements

The following claims materially improve local `builder-static` knowledge and are accepted into canon.

1. Panel sibling model
   - `#properties-panel`, `#publish-panel`, and `#sections-panel` should be treated as sibling panels under the builder UI wrapper rather than nested inside one another.

2. Sections panel population timing
   - `#sections-panel .list` is not treated as a static pre-rendered list.
   - the list is populated when the sections panel is opened.

3. Panel docking mechanics
   - `.do-ui-previous` and `.do-ui-next` are panel-side switchers.
   - the governing state is the wrapper-side change between `is-right` and `is-left`.
   - these controls do not navigate between selected canvas elements.

4. Mobile crop behavior
   - `data-action="crop-view"` belongs to mobile-canvas behavior.
   - it is hidden outside mobile view and acts as a crop/expand toggle once mobile view is active.

5. Publish quick action
   - `data-action="publish"` should be treated as a publish surface that also supports `Shift+click` quick publish.
   - this is useful operationally even though Save/Publish remains operator-only by project rule.

6. Instructions overlay as builder evidence
   - the instructions overlay is a meaningful secondary builder-static evidence source because it maps toolbar icons to actions from inside Carrd itself.

### Accepted With Caveat

The following observations are useful and likely correct, but they are not frozen as strong canon without future direct verification by this agent.

1. Direct toolbar `view-site`
   - the reviewed report presents `view-site` as a direct toolbar icon in the current UI.
   - this improves on older incomplete readings, but current local evidence is mixed:
     - user icon reading omitted it
     - the screenshot can plausibly be read either way
     - DOM evidence from earlier passes already showed `view-site` in builder menu structures
   - working rule:
     - treat `view-site` as a stable Carrd action
     - do not yet hard-freeze direct-toolbar visibility as universal without a direct live check

2. Full More Actions inventory
   - the reviewed report includes a broader dropdown inventory, including duplicated `undo`, `redo`, and `view-site`, plus `exit`.
   - this is plausible and partly supported by earlier DOM findings, but the currently accepted screenshot-derived menu reading was narrower.
   - working rule:
     - treat the action names as likely present in the builder system
     - do not treat the exact visible dropdown composition as immutable across states or breakpoints

3. Properties-panel text-element map
   - the report gives a rich text-element panel structure that is useful as a reference pattern.
   - however, it must not be generalized to all element types.

4. Panel-side visibility micro-rules
   - claims such as which specific side-switch arrow is hidden on which side are plausible and useful.
   - they remain accepted operationally at the behavior level, but the exact CSS implementation detail is still treated as implementation-sensitive, not as durable canon.

### Rejected Or Not Promoted To Canon

The following items are intentionally not promoted into canonical `builder-static` knowledge.

1. Pixel-precise layout measurements
   - x/y coordinates
   - panel widths
   - exact viewport geometry
   - exact z-index numbers

2. Project-specific section labels
   - `Header`
   - `home`
   - `shopping-cart`
   - `exclude-section-bellow-the-line`
   - `Footer`

These belong to `template-instance`, not `builder-static`.

3. Over-generalized panel universals
   - claims such as "only one panel is visible at a time" are useful heuristics but not yet promoted as hard canon unless directly reproduced.

4. Unverified behavior for risky actions
   - `start-over`
   - any destructive flow not safely exercised

These remain non-canonical until confirmed without violating project safety rules.

## Conflict Handling

### Conflict 1 — Current visible toolbar set

Existing local canon had a narrower visible toolbar model.

The reviewed report suggests a broader direct-toolbar set that may include `view-site`.

Normalized position:

- `view-site` is accepted as a stable builder action
- its exact direct-toolbar visibility in the current live UI remains medium-confidence until directly rechecked

### Conflict 2 — Current dropdown composition

Earlier screenshot-based reading showed a narrower More Actions list.

The reviewed report presents a broader dropdown inventory.

Normalized position:

- action existence is more trustworthy than screenshot completeness
- exact visible grouping/order should still be treated as state-sensitive unless directly reproduced

## Resulting Canonical Position

After this review, the broader GUI reconnaissance report is considered:

- valid as a high-confidence external source
- useful for expanding the builder-static map
- insufficient to blindly replace local canon

The canonical outcome is:

1. keep `BUILDER-LIVE-VERIFICATION-ACCEPTED.md` as the resolution source for the original residual questions
2. use this review document as the gatekeeper for wider GUI-map claims
3. use the normalized action map as the operational reference for future builder work

## Remaining Residuals For A Future First-Party Live Pass

These do not block current work, but they are the right targets if a direct live Builder recheck is later requested.

1. whether `view-site` is directly visible in the current toolbar state or only present in menu structures
2. the exact visible More Actions composition in the current active UI state
3. exact per-element tab sets beyond the currently best-understood element types
4. safe confirmation of non-destructive but still unverified actions such as `keyboard-shortcuts`, `docs`, and title-cycle behavior
