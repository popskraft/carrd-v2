# ADR: Canonical live smoke surface

## Status

Accepted — 2026-06-30. Resolves `OPEN-QUESTIONS.md` Q005. Implementation is tracked in `ROADMAP.md` #39 after the Switcher cluster migration in #37.

## Context

Repeatable live validation needs one authoritative Carrd surface. Splitting plugin families across equal-status sites would allow their markup, embeds and runtime versions to drift independently.

`main-template` is the development template and `mini.crd.co` is its published result. `faktura` is a real integration consumer with site-specific content and services. `faktura-app` is a downstream application consumer, not a Carrd page.

## Decision

- Treat the `main-template` Builder draft and `https://mini.crd.co/` as one canonical smoke surface.
- Keep minimal fixtures for all 13 active plugins in `main-template`.
- Define each fixture through a smoke matrix: plugin, element, action and expected result.
- Validate both Builder draft behavior and the published page on desktop and mobile.
- Use `faktura` only as a secondary integration surface after the canonical smoke surface passes.
- Do not classify `faktura-app` as a Carrd smoke surface.

## Implementation Order

1. Complete the accepted Switcher target-only migration and remove cluster mode.
2. Inventory the current `main-template` fixtures against all 13 active plugins.
3. Add only missing minimal fixtures.
4. Record the deterministic smoke matrix and regenerate the live inventory.
5. Verify the Builder draft, perform operator-approved publication, then verify `mini.crd.co` on desktop and mobile.
6. Run the separate `faktura` integration pass only after the canonical surface passes.

## Release Guard

Do not treat a plugin release as live-validated when its canonical fixture is missing or when only `faktura` or `faktura-app` has been checked.
