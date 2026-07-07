# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Stacker**: New scroll-stacking plugin (`data-stacker`, legacy alias `data-stacked`): grouped containers pin below a configurable top offset and slide over each other, then the whole stack scrolls away after the last card. Included in the `theme-core` CDN bundle.

### Removed

- **Cards**: Removed the shared `--theme-card-bg-default` fallback token and the matching `defaultCardBg` runtime option. `cards` backgrounds now come only from container styling or explicit `data-cards-color*` overrides.

## [2.0.0] - 2026-06-23

### Added

- **Runtime Repo**: Promoted Carrd Plugins V2 as the `popskraft/carrd-v2` delivery surface with `*-v2` plugin slugs, `theme-core` bundle assets, and `Carrd*V2` globals.
- **Documentation**: Added a v2 publication contract that keeps legacy `popskraft/carrd-plugins` as the historical jsDelivr surface.
- **Module Workspaces**: Moved `admincarrd` and `cardbuilder` into the v2 repo, with sanitized admin defaults and updated local path bindings.

### Fixed

- **Shopping Cart V2**: Escaped configured widget text labels before inserting widget HTML.
- **Slider V2**: Added carousel region ARIA metadata and dynamic slide position labels.
- **Modal V2**: Added public `refresh()` API for dynamic DOM rescans.
- **FAQ V2**: Deferred open-state height measurement to the next animation frame.
- **Cookie Banner V2**: Added the `Secure` cookie flag on HTTPS pages.
- **Documentation Canon**: Aligned `ROADMAP.md`, `OPEN-QUESTIONS.md`, `docs/INDEX.md`, and release gates with the current `_documenter-rules` full-path documentation canon.

### Removed

- **Root Docs**: Removed obsolete root `BREAKPOINTS.md`; the owner is `docs/specs/breakpoints-contract.md`.

### Added

- **Accordeon**: Added a lightweight container toggle plugin for `#accordeon-*` links and matching `data-accordeon` containers.
- **Accordeon**: Added default smooth scrolling to the first opened target, configurable with `scrollOnOpen`, `scrollBehavior`, and `scrollBlock`.

### Fixed

- **No-loadwaiting**: Removed the synthetic `scroll` event pulse that could trigger browser extension `content_script` errors; layout wake-up now uses resize pulses only.

## [0.1.21] - 2026-04-16

### Added

- **CDN Bundle**: Restored a first-class two-file CDN installation path via `dist/theme-core.min.css` and `dist/theme-core.min.js`.
- **Bundle Config**: `bundle.config.json` now controls the selected plugins included in the restored CDN bundle.

### Changed

- **README**: Reintroduced the CDN bundle installation method alongside the current embed-based install flow.

### Fixed

- **cards**: Added fallback to `data-padding` and `data-padding-mobile` attributes when inherited container padding is zero.
- **header-nav**: Added scroll-based sticky detection so the header only becomes stuck when scrolling reaches the top position, not immediately on desktop.

## [0.1.20] - 2026-04-14

### Fixed

- **header-nav**: Removed dead config option `hideOnScrollDown` (was declared but never implemented).
- **header-nav**: Added 60ms debounce to `resize` event listener to prevent layout jank on window resize.
- **modal**: Guard against duplicate `keydown` Tab-trap listeners when `ModalAPI.open()` is called on an already-open modal.
- **modal**: Added `isConnected` check before restoring focus on modal close to prevent errors on disconnected DOM elements.
- **shopping-cart**: Cache `focusables` array on panel open and invalidate on close; update after cart re-render to avoid re-querying DOM on every Tab keypress.
- **shopping-cart**: Added CSS `pointer-events` fallback for browsers without native `inert` attribute support.

## [0.1.19] - 2026-04-09

### Changed

- **Distributive HTML Banner**: Every generated plugin HTML distributive now starts with a required HTML comment that includes the plugin name and current version.
- **Builder Rollout Prep**: Rebuilt the bundle for a repeat Carrd Builder rollout after the distributive HTML contract change.

## [0.1.18] - 2026-04-09

### Changed

- **Bundle Synchronization**: Consolidated the cross-plugin cleanup wave, synchronized audit/governance wording with the approved Carrd structural-contract rule, and prepared the distributive package for the next Builder rollout.
- **Runtime Hardening**: Kept the active plugin bundle green after lifecycle, fallback, and documentation fixes across `faq`, `slider`, `modal`, `no-loadwaiting`, `shopping-cart`, `typography`, `grid-cluster`, `cards`, `cookie-banner`, `header-nav`, and `floating-cta`.

## [0.1.17] - 2026-04-07

### Changed

- **Release Package**: Bumped the distributive bundle to `0.1.17` so the Carrd template rollout can replace embeds with a clearly newer plugin package after the template refactor.
- **Template Rollout**: Prepared fresh `header-nav` and `typography` embed outputs in `dist/` for manual installation into the Carrd Builder baseline.

### Removed

- **Stacker**: Removed the remaining `stacker` source, config, and test surface so the plugin no longer exists in an active half-supported state.
- **Custom Themes**: Removed the `custom-themes` delivery path from the active build and documentation contract and preserved the old files under `_archive/custom-themes/`.
- **Columns**: Removed the deprecated `columns` plugin from active `src/` and test surfaces and preserved it under `_archive/columns/` as a historical legacy module.
- **Columns Legacy Bridge**: Removed the `window.CarrdPluginOptions.columns` fallback inheritance from active `cards` and `grid-cluster` plugins.

## [0.1.16] - 2026-04-07

### Changed

- **Header Nav**: Refactored the plugin to a class-first contract so the header root, collapsible nav, and keep-visible mobile row can be discovered by selectors before any legacy IDs are used.
- **Cookie Banner**: Switched the preferred authoring contract to class-based banner targeting while preserving the old `cookie-baner` ID as a fallback.
- **Shopping Cart**: Switched the preferred order-field and checkout-target contract to class/name-first selectors while keeping legacy ID fallbacks for older installs.
- **Documentation**: Updated plugin setup docs to reflect class-first Carrd authoring for `header-nav`, `cookie-banner`, and `shopping-cart`.

### Fixed

- **Header Nav Tests**: Aligned runtime behavior with the existing class-marker test suite so the mobile toggle, sticky header behavior, and keep-row behavior now pass again.

## [0.1.15] - 2026-04-06

### Changed

- **Grid Cluster**: Restored missing `justify` CSS parity so the modern grid layer matches the legacy `columns` grid behavior more closely.
- **Migration Workflow**: Added explicit planning and sync artifacts for replacing live-template `columns` with `grid-cluster + cards`.
- **Build Outputs**: Prepared a fresh versioned plugin package so the next Carrd template update can load a clearly newer distributive set.

### Fixed

- **Grid Cluster CSS**: Added the missing `.container-component.justify .inner { width: 100%; }` rule that existed in the legacy `columns` layer.
- **Tests**: Added a parity guard so the restored `justify` behavior remains covered in `grid-cluster` tests.

## [0.1.14] - 2026-03-21

### Removed

- **Stacker**: Removed the non-working `stacker` plugin from the project. It is no longer supported, bundled, or documented as an available plugin.

## [0.1.12] - 2026-02-18

### Changed

- **Versioning**: Bumped project version to `0.1.12`.
- **Build Output**: Regenerated plugin artifacts and synchronized version headers across `src/` and `dist/`.

## [0.1.11] - 2026-02-12

### Added

- **New Plugins**: Split legacy Columns behavior into dedicated plugins:
  - `grid-cluster` for responsive grid clustering
  - `cards` for card item wrapping/styling
- **Compatibility**: Added legacy `window.CarrdPluginOptions.columns` fallback support in new `grid-cluster` and `cards` plugins for safer migration.

### Changed

- **Bundle Layout**: Updated the shared bundle composition at that time to include `grid-cluster` and `cards` directly.
- **Documentation**: Improved root/plugin docs for beginner clarity:
  - Unified root README version source behavior
  - Clarified Option 4 (embed) required HEAD dependencies
  - Added explicit bundle inclusion status in Included Plugins table
  - Expanded Shopping Cart and FAQ setup guidance with clearer Carrd-oriented structure
- **Columns**: Kept as legacy compatibility plugin with migration guidance.

### Fixed

- **Build System**: Fixed source header version replacement logic to prevent malformed versions like `0.1.10aaaa...`.
- **Build System**: Added strict `VERSION` format validation (`MAJOR.MINOR.PATCH`).
- **Tokens**: Added missing shared token `--theme-card-bg-default`.
- **Columns Cards Guard**: Improved duplicate-wrap protection to detect both legacy and current card wrappers.

---

### Fixed

- **Columns**: Added built-in `.container-component.justify` styles to plugin CSS and propagate `.justify` across all containers in the same grid cluster when the first container has `.justify`.

## [0.1.9] - 2026-02-06

### Changed

- **Public API**: Unified plugin globals to `window.Carrd<Plugin>` format for runtime consistency:
  - `window.CarrdShoppingCart`
  - `window.CarrdModal`
  - `window.CarrdTypography`
  - `window.CarrdSlider`
- **Shopping Cart**: Replaced inline template styles with CSS classes to keep styles centralized.
- **Typography**: Migrated default classes to plugin-scoped naming (`theme-typography-*`) for namespace safety.

### Fixed

- **Shopping Cart**: Removed hardcoded widget foreground color and switched to tokenized value `--theme-shopcart-widget-color`.

### Breaking

- **Public API**: Removed legacy global aliases:
  - `window.CartPlugin`
  - `window.CarrdCart`
  - `window.ModalPlugin`
  - `window.TypographyPlugin`
  - Use the new `window.Carrd<Plugin>` globals instead.
- **Typography CSS classes**: Replaced generic classes (`theme-h1`, `theme-ul`, `theme-hr`, etc.) with plugin-scoped classes (`theme-typography-h1`, `theme-typography-ul`, `theme-typography-hr`, etc.).

## [0.1.8a] - 2026-01-24

### Added

- **Cookie Banner**: Added animation for smoother appearance.
- **Cookie Banner**: Added configuration options `showDelay` (default: 1000ms) and `fadeInDuration` (default: 400ms).
- **QA**: Added automated workflows for code quality checks (`/css-consistency-check`, `/plugin-check`).

### Fixed

- **Slider**: Fixed bug where dot indicators would not update on mobile swipe (incorrect CSS selector).
- **Slider**: Refactored internally to use consistent `SELECTORS` constants for all class names.
- **Slider**: Updated CSS classes to use consistent `theme-` prefix (`.theme-slider-nav`, `.theme-slider-dot`).

## [0.1.7] - 2026-01-15

### Changed

- **Typography**: Simplified `README.md` documentation
  - Removed CSS variables section (tokens are no longer in final build)
  - Removed unused configuration options (`paragraphSelector`, `wrapperClass`)
  - Emphasized `.txt` class requirement for plugin activation

---

## [0.1.5] - 2026-01-14

### Changed

- **Build System**: Source file headers (`* Version:`) now auto-sync to `VERSION` on each build.

---

## [0.1.4] - 2026-01-14

### Changed

- **Build System**: Extracted minification logic into separate `scripts/minifier.py` module (342 lines)
  - `minify_plugins.py` reduced from 1120 → 825 lines
  - Added docstrings and improved code organization
  - No functional changes — output is byte-for-byte identical
- **Naming**: Renamed the shared bundle files at that time for consistency
  - All documentation was updated with the new bundle names

- **BREAKING (CSS only):** Renamed all `mini-` CSS variables to `theme-` prefix for consistency with file naming
  - CSS variables: `--mini-color-*` → `--theme-color-*`, `--mini-ui-*` → `--theme-ui-*`, etc. (~80 variables)
  - Utility classes: `.mini-text-body` → `.theme-text-body`, `.mini-icon-button` → `.theme-icon-button` (~15 classes)
  - Plugin classes: `.slider-dot` → `.theme-slider-dot`, `.faq-question` → `.theme-faq-question`, etc. (~30 classes)
  - **User-facing selectors unchanged:** `.FAQContainer`, `.slider`, `.cards`, `.grid-*` remain the same
- Updated all source files (13 files) to use new `theme-` prefix
- Rebuilt all distribution files with new naming convention

### Fixed

- Improved naming consistency across entire codebase (files, variables, and classes now all use `theme-` prefix)
- Eliminated confusion between "mini" (small) and "Mini theme" naming

---

## [0.1.3] - 2026-01-14

### Changed

- **Documentation**: Complete overhaul of main `README.md` (73 → 238 lines).
- **Documentation**: Added four installation methods (CDN Individual, CDN Bundle, Direct Embed, Single Embed File).
- **Documentation**: Added installation method comparison table to help users choose the right approach.
- **Documentation**: Added Configuration section with CSS variables and JavaScript options examples.
- **Documentation**: Added Quick Start guide for beginners.
- **Documentation**: Added Glossary section explaining Carrd-specific terminology.
- **Documentation**: Added comprehensive Troubleshooting section.
- **Documentation**: Enhanced Included Plugins table with bundle composition information.
- **Documentation**: Clarified that `theme-design-tokens.css` and `theme-ui.css` are required for all installation methods.

---

## [0.1.2] - 2026-01-13

### Changed

- **Breaking**: `theme-design-tokens.css` is now **required** for standalone plugin usage — it defines all CSS variables.
- **Shopping Cart**: Replaced `<h2>` with `<div>` for cart title (no SEO interference).
- **All Plugins**: Removed hardcoded color fallbacks — all colors now cascade from theme variables.
- **Documentation**: Updated plugin READMEs to include theme CSS requirement.

### Fixed

- Fixed CSS syntax error in `theme-design-tokens.css` (`var(#ffffff)` → `#ffffff`).
- Standardized font-family fallbacks to use `--mini-font-family`.

---

## [0.1.0] - 2026-01-12

### Changed

- **Slider**: `equalHeight` is now `true` by default — all slides stretch to the same height without extra configuration.

### Fixed

- Fixed JavaScript syntax error in example `carrd/index.html` (missing closing brace for `window.CarrdPluginOptions`).

---

## [0.0.0] - 2025-12-29

### Added

- Initial release of Carrd Plugins V2 (Mini Theme).
- **Shopping Cart** plugin with full cart functionality.
- **FAQ** plugin with accordion-style Q&A sections.
- **Columns** plugin for grid layouts and card styling.
- **No-loadwaiting** plugin to skip Carrd's loading animation.
- **Modal** plugin for popup/lightbox functionality.
- **Slider** plugin with touch/drag support, navigation dots, and arrows.
- Added unified shared JS and CSS bundles for the initial release packaging model.
- Theme customization via CSS variables (`--mini-*`).
- JS configuration via `window.CarrdPluginOptions`.
