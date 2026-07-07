# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Stacker**: New scroll-stacking plugin (`data-stacker`, legacy alias `data-stacked`): grouped containers pin below a configurable top offset and slide over each other, then the whole stack scrolls away after the last card. Included in the `theme-core` CDN bundle.
- **Accessibility tests**: New `tests-js/a11y-contract.test.js` locks the WCAG-critical contract for interactive plugins — modal dialog role/accessible name/`aria-hidden` toggling and Tab focus-trap wrapping, plus coherent `aria-expanded`/`aria-hidden`/`aria-pressed` state for faq, accordeon and switcher. Uses the existing jsdom harness (no new dependency).
- **Coverage gate**: New `test:coverage` script using Node's built-in test coverage (no dependency), wired into `npm run validate` with thresholds (src lines ≥ 90 %, branches ≥ 85 %, functions ≥ 90 %); current plugin source coverage is 100 %.
- **Admincarrd security**: Added HTTPS-only, config-gated `Strict-Transport-Security` (HSTS) header alongside the existing CSP/X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy set.
- **Bundle budget gate**: New standalone `scripts/check_bundle_budget.py` + `scripts/bundle-budget.json` enforce a per-asset minified-size ceiling for every `dist/` bundle; wired into `npm run validate` after `verify:dist`.
- **Dead-code gate**: Added `knip` (dev dependency) with `knip.json` scoped to `src/**/*.js`, `tests-js/**/*.js`, and `cardbuilder/scripts/**/*.mjs` (each file its own entry, so browser-global IIFE plugins don't false-positive); `npm run check:deadcode` is wired into `npm run validate`. First run was clean, so `no-unused-vars` was promoted from `warn` to `error`.

### Changed

- **Code Quality**: Refactored all functions exceeding the cyclomatic-complexity budget (cards, faq, stacker, shopping-cart, slider, modal) into focused helpers within each plugin's single IIFE — no runtime/embed structure change — and promoted the ESLint `complexity` rule from `warn` to `error` (max 10). Behaviour preserved; 225/225 JS tests green.
- **Tests**: Made `test:py` machine-independent — admincarrd PHP-harness tests now `skipUnless(shutil.which("php"))`, so `npm run test` no longer errors on hosts without the `php` CLI (skipped, not error).

### Removed

- **Cards**: Removed the shared `--theme-card-bg-default` fallback token and the matching `defaultCardBg` runtime option. `cards` backgrounds now come only from container styling or explicit `data-cards-color*` overrides.
