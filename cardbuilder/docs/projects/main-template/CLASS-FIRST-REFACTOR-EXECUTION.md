# Class-First Refactor Execution

## Status

Published and verified.

## Execution Time

- Date: `2026-04-07`
- Builder target:
  - `https://carrd.co/dashboard/4155176224428477/build`

## Scope

Apply the owner-approved move toward class-first contracts for:

- `header-nav`
- `cookie-banner`
- `shopping-cart`

Keep `modal` on its mixed model with unique modal target IDs.

## Repo Changes

### Header Nav

Refactored to a class-first contract with legacy fallback IDs retained for compatibility.

Primary selectors now prefer:

- header root:
  - `.container-component.site-header-sticky, .container-component.theme-header-nav`
- collapsible nav:
  - `.header-mobile-el-collapsing, .theme-header-nav-collapse, .links-component`
- keep-visible CTA row:
  - `.header-mobile-el-sticky, .theme-header-nav-keep, .buttons-component`
- optional mobile sticky anchor:
  - `.theme-header-nav-topnav, .site-header-topnav`

Legacy fallbacks retained:

- `site-header`
- `site-header-nav`
- `site-header-cta`
- `site-header-topnav`

### Cookie Banner

Refactored to prefer:

- `.theme-cookie-banner, .cookie-banner`

Legacy fallback retained:

- `#cookie-baner`

### Shopping Cart

Refactored to prefer:

- order field:
  - `[name="order-details"], .cart-output, [data-cart-output="order-details"]`
- checkout target:
  - `.shopping-cart-target, [data-shopping-cart-target]`

Legacy fallbacks retained:

- `#order-details`
- `#shopping-cart`

## Live Carrd Draft Changes

### Updated Embeds

The active Builder draft was updated with current `0.1.16` distributive assets for the live shopping-cart plugin layer:

1. `embed03`
   - title: `Shopping Cart JS`
   - replaced with:
     - JS from [/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.js](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.js)

2. `embed04`
   - title: `Shopping Cart CSS`
   - replaced with:
     - CSS from [/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.css](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.css)

### Updated Element Classes

The active Builder draft was updated with class-first hooks:

1. `container02`
   - semantic role:
     - site header container
   - added class:
     - `site-header-sticky`

2. `links02`
   - semantic role:
     - header navigation block
   - added class:
     - `header-mobile-el-collapsing`

3. `container10`
   - semantic role:
     - shopping-cart order form container
   - added class:
     - `shopping-cart-target`

## Explicit Non-Changes

### Cookie Banner

No live Carrd element was changed for `cookie-banner`.

Reason:

- the current active template does not contain a detected cookie-banner block
- therefore there was no safe or necessary live target for class/ID remapping in this pass

### Header Nav Embed

No new live `header-nav` embed was inserted into the template during this pass.

Reason:

- the requested work required refactoring the plugin contract and preparing Carrd element hooks
- it did not require enabling a previously absent live plugin block without separate owner approval

## Deterministic Verification

### Before-State Evidence

Saved before-state artifacts:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed03-before-0.1.16.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed03-before-0.1.16.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed04-before-0.1.16.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed04-before-0.1.16.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/class-first-live-before-0.1.16.json](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/class-first-live-before-0.1.16.json)

### Readback Verification

The updated Builder model was read back after mutation.

Results:

- `embed03` hash matches wrapped local `shopping-cart.min.js`
- `embed04` hash matches wrapped local `shopping-cart.min.css`
- `container02.settings.element.classes` includes `site-header-sticky`
- `links02.settings.element.classes` includes `header-mobile-el-collapsing`
- `container10.settings.element.classes` includes `shopping-cart-target`
- Builder `Publish` is in `alert` state, confirming a dirty draft

Verified hashes:

- `embed03`
  - sha256: `12f6fae8ed0bcff81c7064a7efb1e816106f1b1fe659756b33dfb265051a76d9`
- `embed04`
  - sha256: `66fa76a1720030b4f4e477b26644716de3da672f540794a7a19b228e14629032`

## Local Validation

Validation result after repo refactor/build:

- `python3 scripts/minify_plugins.py`
  - passed
- `npm run lint --silent`
  - passed
- targeted JS tests:
  - `header-nav`
  - `cookie-banner`
  - `shopping-cart`
  - passed
- full `npm run test --silent`
  - still fails only on pre-existing `slider` cases

## Evidence

- Builder screenshot:
  - [/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/screens/class-first-builder-draft-2026-04-07.png](/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/screens/class-first-builder-draft-2026-04-07.png)

## Published Verification

Published site verification confirmed:

- published URL:
  - `https://mini.crd.co/`
- `Shopping Cart v0.1.16` is present in the published HTML
- `.site-header-sticky` is present in the published HTML
- `.header-mobile-el-collapsing` is present in the published HTML
- `.shopping-cart-target` is present in the published HTML
- no active cookie banner hook is present in the published HTML

This matches the intended scope of the operation:

- `header-nav` prepared for class-first activation
- `shopping-cart` updated and published
- `cookie-banner` refactored in repo, but not enabled in the current live template

## Next Step

Run a fresh post-publish scan package refresh if we want the canonical template-instance artifacts to explicitly reflect this class-first publish as a separate baseline transition.
