# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Stacker**: New scroll-stacking plugin (`data-stacker`, legacy alias `data-stacked`): grouped containers pin below a configurable top offset and slide over each other, then the whole stack scrolls away after the last card. Included in the `theme-core` CDN bundle.

### Changed

- **Code Quality**: Refactored all functions exceeding the cyclomatic-complexity budget (cards, faq, stacker, shopping-cart, slider, modal) into focused helpers within each plugin's single IIFE — no runtime/embed structure change — and promoted the ESLint `complexity` rule from `warn` to `error` (max 10). Behaviour preserved; 225/225 JS tests green.
- **Tests**: Made `test:py` machine-independent — admincarrd PHP-harness tests now `skipUnless(shutil.which("php"))`, so `npm run test` no longer errors on hosts without the `php` CLI (skipped, not error).

### Removed

- **Cards**: Removed the shared `--theme-card-bg-default` fallback token and the matching `defaultCardBg` runtime option. `cards` backgrounds now come only from container styling or explicit `data-cards-color*` overrides.
