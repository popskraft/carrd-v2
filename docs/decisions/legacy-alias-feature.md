# ADR: Legacy Alias Feature (V1 data-attrs + class fallback) is Resolved

## Status
Accepted — 2026-06-27. Resolves former OPEN-QUESTIONS Q008.

## Context
V2 plugins must keep working on Carrd sites whose sections were authored with v1
markers (`data-faq`, `data-modal`, `.FAQContainer`, `grid-N`, `data-gap`, etc.).
A backward-compat layer was rolled out across all interactive plugins so v2
runtime accepts v1 attributes and the legacy `window.CarrdPluginOptions`
namespace alongside the v2 contract.

This ADR records that the alias feature is implemented, committed, published, and
live-verified, and that the **long-term permanent-vs-temporary policy is still
open** (tracked separately as OPEN-QUESTIONS Q004).

## Decision
The legacy alias surface is a shipped, tested compatibility contract:

- CSS-side: container-scoped `:is()` selectors accept v1 and v2 markers together
  (`1ac3dd4` for faq/cookie/modal; `eca34b3` for the found switcher gap).
- JS-side: every interactive plugin reads v2 attributes first, then falls back to
  v1 attributes and the `window.CarrdPluginOptions` namespace
  (`CarrdShoppingCart` alias included for shopping-cart).
- Tests: `tests-js/backward-compat.test.js` (helper `setLegacyPluginOptions`)
  covers v1-attrs + v1-config + V2-precedence.
- A systematic scan confirmed faq/cookie/modal/switcher are the only
  user-authored container-scoped selectors; cards/floating rely on
  JS-stamped runtime attributes (no gap); the rest use `.theme-*` classes.

## Evidence
- `faktura` Builder synchronized via `automation/sync-v2-embeds.mjs`
  (embed02/03/07, hash-readback 3/3); service/custom embeds untouched.
- Published by operator.
- Live verify on `faktura-dev.crd.co`:
  - FAQ 14× `:is([data-faq],[data-faq],.FAQContainer)` / 0× old-only.
  - modal 8× `:is([data-modal],[data-modal])`.
  - cookie 3× `[data-cookie]`.
- `npm run validate` → 189/189.

## Consequences
- V2 plugins run on legacy-authored Carrd sites without section rework.
- The permanent-vs-temporary fate of these fallbacks remains an open policy
  question (Q004), to be decided after the broader live-migration pass.
- New docs and new installs must teach v2 `data-*` first; legacy markers are
  documented only as migration guidance.

## Related
- `docs/specs/plugin-data-contract.md` — canonical v2 binding + Naming Matrix.
- `docs/specs/carrd-markup-contract.md` — v2-vs-legacy rule.
- `ROADMAP.md` rows 21, 24, 25, 26.
