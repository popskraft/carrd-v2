# ADR — Header Nav Structural Contract

## Status

Accepted

## Decision

`header-nav` remains a structural exception. Its public Carrd contract stays:

- `#header` scope
- one or more `.header-mobile-hide` elements inside `#header`

No new public `data-*` contract is required.
Legacy `.header-mobile-el-collapsing` remains a backward-compat alias during the transition.

## Evidence

- `mini.crd.co` and `faktura-dev.crd.co` both initialize `header-nav` correctly from the same structural marker.
- The mobile anti-jump behavior was verified on both live pages.
- The observed regression on `mini.crd.co` was not caused by missing markers. It was caused by Carrd header blur on the authored header container, which re-anchored the fixed hamburger during scroll.

## Operational Rule

- Do not rely on Carrd background blur on the authored header container when using the default fixed hamburger toggle.
- If a glass effect is required, move it to another layer or use a different toggle positioning strategy.

## Consequence

- `header-nav` docs continue to describe `.header-mobile-hide` as the canonical authored marker.
- Header migrations should remove legacy `site-header`, `header-collapsing`, and `site-header-cta` hooks unless a compatibility need is explicitly retained.
