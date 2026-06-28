# Plugin Unification Migration Plan

## Purpose
Execution surface for the remaining live-Carrd migration to the v2 semantic contract. Binding rules live in `docs/specs/carrd-v2-contract.md`; the per-plugin binding syntax and Naming Matrix live in `docs/specs/plugin-v2-data-contract.md`. This doc tracks only what is not yet done.

## Status
Repo-level unification is complete: primary `data-*` contracts are implemented in runtime, source READMEs are normalized, `dist` is regenerated from source + templates, and tests/lint pass. Remaining work is concentrated in live Carrd migration, exception policy, and legacy-freeze decisions.

## Remaining Work

### Repo
- Re-check canonical docs for wording drift after the v2 cleanup.
- Decide documented exception policy for `header-nav`, `no-loadwaiting`, `typography`, and `shopping-cart`.
- Confirm `plugin-v2-data-contract.md` and `carrd-markup-contract.md` still match real runtime behavior after live migration decisions.

### Live Carrd
- Verify `header-nav` anti-jump on a real mobile page.
- Verify multi-controller `switcher` sync on a real page.
- Verify `switcher` cluster mode on a real page.
- Verify `accordeon` on the `ppf` group.
- Verify at least one page per contract family:
  - hash-driven: `modal` or `accordeon`
  - grouped marker: `cards`, `grid-cluster`, or `slider`
  - runtime clone / floating UI: `floating-cta` or `shopping-cart`
  - structural exception: `header-nav` or `no-loadwaiting`

### Freeze
- Create a legacy freeze branch/tag before any fallback removal.
- Decide which fallbacks remain long-term compatibility features and which are temporary migration bridges (OPEN-QUESTIONS Q004).

## Stop Rules
- Stop before removing any fallback that still has historical installs.
- Stop before changing live Carrd pages without a reversible checklist.
- Stop if docs cleanup would desync source and generated `dist`.
- Stop if a new public marker is required before it is approved in `plugin-v2-data-contract.md`.

## Validation
- `npm run build` / `npm run verify:dist` / `npm run test` / `npm run lint`
- Live: verify one page per risky contract family and record any failure before changing fallback policy.

Keep detailed unresolved decisions in `OPEN-QUESTIONS.md`, not as repeated checklists here.
