# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [2.0.0] - 2026-07-11

### Versioning note

This release intentionally uses `2.0.0`, a lower number than the preceding `2.1.0`. Both project owner and this changelog record it as a deliberate, separate lineage rather than a normal SemVer step: `2.0.0` marks the start of the **embed-only era** (no CDN delivery). If CDN/jsDelivr delivery is ever reintroduced, that future release will be numbered `3.0.0`, not a continuation of `2.1.x`. `v2.1.0` and all older tags remain in git history untouched and keep serving already-published `@2.1.0` sites via jsDelivr indefinitely; they are simply no longer the active delivery path for new work.

### Removed

- **CDN/jsDelivr delivery removed entirely.** No more `theme-runtime.min.css/js`, `theme-core.min.css/js`, `theme-runtime-cdn.html`, `theme-core-cdn.html`, or per-plugin `*-cdn.html` files are generated. `dist/` now ships inline Carrd embeds only.
- **Legacy compatibility layer removed.** `src/theme-compat.css` and the compat-merged `dist/theme-ui.css` variant are gone; there is exactly one canonical `theme-ui.css` (embed: `theme-ui-embed.html`) plus `theme-design-tokens.css` (embed: `theme-design-tokens-embed.html`), matching `src/theme-ui.css` and `src/theme-design-tokens.css` 1:1.
- `bundle.config.json` no longer declares `cdn_bundle`/`compat_bundle`; the build script no longer has any CDN-bundle or CDN-embed generation code path.
- `npm run cdn:purge` / `cdn:purge:main` removed from `package.json` (nothing left to purge).

### Changed

- `README.md` "Install Paths" reduced to a single **Inline Embed** path for the whole site (theme + every plugin).
- `AGENTS.md` release-governance rule rewritten: sold templates are inline-embed-only; the old "immutable SemVer CDN refs" rule no longer applies to new deliveries.
- `docs/specs/release-contract.md` rewritten for the embed-only distribution model.

## [2.1.0] - 2026-07-07

### Added

- **Stacker**: New scroll-stacking plugin (`data-stacker`, legacy alias `data-stacked`): grouped containers pin below a configurable top offset and slide over each other, then the whole stack scrolls away after the last card. Included in the `theme-core` CDN bundle.
- **Accessibility tests**: New `tests-js/a11y-contract.test.js` locks the WCAG-critical contract for interactive plugins — modal dialog role/accessible name/`aria-hidden` toggling and Tab focus-trap wrapping, plus coherent `aria-expanded`/`aria-hidden`/`aria-pressed` state for faq, accordeon and switcher. Uses the existing jsdom harness (no new dependency).
- **Coverage gate**: New `test:coverage` script using Node's built-in test coverage (no dependency), wired into `npm run validate` with thresholds (src lines ≥ 90 %, branches ≥ 85 %, functions ≥ 90 %); current plugin source coverage is 100 %.
- **Admincarrd security**: Added HTTPS-only, config-gated `Strict-Transport-Security` (HSTS) header alongside the existing CSP/X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy set.
- **Bundle budget gate**: New standalone `scripts/check_bundle_budget.py` + `scripts/bundle-budget.json` enforce a per-asset minified-size ceiling for every `dist/` bundle; wired into `npm run validate` after `verify:dist`.
- **Dead-code gate**: Added `knip` (dev dependency) with `knip.json` scoped to `src/**/*.js`, `tests-js/**/*.js`, and `cardbuilder/scripts/**/*.mjs` (each file its own entry, so browser-global IIFE plugins don't false-positive); `npm run check:deadcode` is wired into `npm run validate`. First run was clean, so `no-unused-vars` was promoted from `warn` to `error`.

### Changed

- **Theme Tokens**: Limited `theme-design-tokens.css` to global/shared primitives and moved every component default into the owning plugin CSS through low-specificity `:where(:root)` blocks.
- **Plugin CSS**: Removed canonical `--theme-*` fallback arguments and returned slider, modal, and Shopping Cart component selectors from shared `theme-ui.css` to their owning plugins.
- **Code Quality**: Refactored all functions exceeding the cyclomatic-complexity budget (cards, faq, stacker, shopping-cart, slider, modal) into focused helpers within each plugin's single IIFE — no runtime/embed structure change — and promoted the ESLint `complexity` rule from `warn` to `error` (max 10). Behaviour preserved; 225/225 JS tests green.
- **Tests**: Made `test:py` machine-independent — admincarrd PHP-harness tests now `skipUnless(shutil.which("php"))`, so `npm run test` no longer errors on hosts without the `php` CLI (skipped, not error).

### Fixed

- **Theme Guardrails**: Added exact compatibility-bridge mapping checks, version-pin enforcement for canonical automation paths, token ownership validation, and protection against compatibility-only `theme-ui.css` leaking into new-install snippets.
- **Plugin README completeness**: Documented every previously-undocumented `CarrdPluginOptions` key across accordeon, cards, cookie-banner, faq, floating-cta, grid-cluster, modal, shopping-cart, slider, stacker, switcher, and typography (`src/<plugin>/README.md`, generated `dist/` copies rebuilt). FAQ's README no longer contradicts the code by claiming no JS configuration exists.

### Removed

- **Cards**: Removed the shared `--theme-card-bg-default` fallback token and the matching `defaultCardBg` runtime option. `cards` backgrounds now come only from container styling or explicit `data-cards-color*` overrides.
