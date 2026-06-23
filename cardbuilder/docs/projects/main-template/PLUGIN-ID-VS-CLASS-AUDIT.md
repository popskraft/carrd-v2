# Plugin ID vs Class Audit

## Purpose

Evaluate whether plugin behavior in the current Carrd system is tied to unique element IDs or to reusable classes/selectors, and identify which plugins should stay ID-bound versus which should move toward class-first contracts.

This started as an audit.

Update:

- `header-nav` has now been refactored in repo to a class-first contract with legacy ID fallbacks retained
- `cookie-banner` has now been refactored in repo to prefer class selectors with legacy ID fallback retained
- `shopping-cart` has now been refactored in repo to prefer selector/class-first lookup for order field and checkout target with legacy ID fallbacks retained
- `modal` remains intentionally mixed, with unique modal target IDs preserved

Execution details are recorded in:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/CLASS-FIRST-REFACTOR-EXECUTION.md](/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/CLASS-FIRST-REFACTOR-EXECUTION.md)

## Summary

The current plugin bundle is already mostly class-first.

### Already class-first

- `cards`
- `grid-cluster`
- `faq`
- `slider`
- `typography`

### Mixed, but mostly acceptable

- `shopping-cart`
- `modal`
- `no-loadwaiting`

### Most likely refactor target

- `header-nav`

### Secondary possible refactor target

- `cookie-banner`

## Audit Principle

Use classes for:

- repeatable behavior
- repeatable visual treatment
- grouping multiple same-role containers
- per-pattern activation

Use IDs only for:

- unique anchors
- unique modal targets
- unique external integration points
- one-off Carrd runtime elements that are globally singular

## Plugin-by-Plugin Assessment

### Cards

Primary contract:

- class-based

Evidence:

- `cardSelector: '.cards'` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- `document.querySelectorAll(CONFIG.cardSelector)` in [/Users/popskraft/Projects/carrd-v2/src/cards/cards.js](/Users/popskraft/Projects/carrd-v2/src/cards/cards.js)

Assessment:

- already in the desired state
- no ID dependency for behavior

Decision tendency:

- keep class-first

### Grid Cluster

Primary contract:

- class-based

Evidence:

- `gridClasses: ['grid-2' ... 'grid-6']` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- cluster detection by class membership in [/Users/popskraft/Projects/carrd-v2/src/grid-cluster/grid-cluster.js](/Users/popskraft/Projects/carrd-v2/src/grid-cluster/grid-cluster.js)

Assessment:

- already in the desired state
- built exactly for repeatable pattern grouping by class

Decision tendency:

- keep class-first

### FAQ

Primary contract:

- class-based container selector

Evidence:

- `containerSelector: '.FAQContainer'` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- selection via `document.querySelectorAll(CONFIG.containerSelector)` in [/Users/popskraft/Projects/carrd-v2/src/faq/faq.js](/Users/popskraft/Projects/carrd-v2/src/faq/faq.js)

Important nuance:

- internal generated answer IDs exist only for accessibility wiring such as `aria-controls`
- these generated IDs are not the authoring contract for locating the FAQ container

Assessment:

- already in the desired state

Decision tendency:

- keep class-first

### Slider

Primary contract:

- class-based cluster selector

Evidence:

- `slideSelector: '.slider'` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- selection via `document.querySelectorAll(S.sel)` in [/Users/popskraft/Projects/carrd-v2/src/slider/slider.js](/Users/popskraft/Projects/carrd-v2/src/slider/slider.js)

Important nuance:

- `data-slider-id` is supported for per-instance overrides
- this is not an element `id`; it is an acceptable scoped instance key

Assessment:

- already class-first
- `data-slider-id` is a good compromise for optional per-instance targeting

Decision tendency:

- keep class-first

### Typography

Primary contract:

- class-based

Evidence:

- `containerSelector: '.txt'` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- `document.querySelectorAll(CONFIG.containerSelector)` in [/Users/popskraft/Projects/carrd-v2/src/typography/typography.js](/Users/popskraft/Projects/carrd-v2/src/typography/typography.js)

Assessment:

- already in desired state

Decision tendency:

- keep class-first

### Modal

Primary contract:

- mixed

Evidence:

- modal containers are discovered by class: `modalSelector: '.container-component.modal'` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- discovered with `document.querySelectorAll(CONFIG.modalSelector)` in [/Users/popskraft/Projects/carrd-v2/src/modal/modal.js](/Users/popskraft/Projects/carrd-v2/src/modal/modal.js)
- opening a specific modal still uses `document.getElementById(modalId)` in [/Users/popskraft/Projects/carrd-v2/src/modal/modal.js](/Users/popskraft/Projects/carrd-v2/src/modal/modal.js)
- README explicitly expects unique modal IDs and triggers like `href="#modalContact"` or `data-modal="modalContact"` in [/Users/popskraft/Projects/carrd-v2/src/modal/README.md](/Users/popskraft/Projects/carrd-v2/src/modal/README.md)

Assessment:

- this is a justified mixed model
- container discovery is class-first
- target resolution is ID-based because each modal is conceptually unique

Decision tendency:

- keep the unique modal target contract
- no strong reason to remove ID usage here

### Shopping Cart

Primary contract:

- mixed

Evidence:

- form field lookup uses `orderInputSelector: '[name=\"order-details\"], #order-details'` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- fallback to class and generic textarea search in [/Users/popskraft/Projects/carrd-v2/src/shopping-cart/shopping-cart.js](/Users/popskraft/Projects/carrd-v2/src/shopping-cart/shopping-cart.js)
- cart widget shell itself uses one generated unique container id internally: `theme-shopcart-container`

Assessment:

- authoring-side behavior is mostly not tightly bound to a single element ID
- the remaining `#order-details` fallback is reasonable for compatibility, but not ideal as the preferred contract
- class or `name` should remain the preferred author-facing path

Decision tendency:

- keep compatibility fallback for ID
- prefer class/name-first guidance in docs and config

### No Load Waiting

Primary contract:

- global unique runtime hook

Evidence:

- hides Carrd loader using `document.getElementById('loader')` in [/Users/popskraft/Projects/carrd-v2/src/no-loadwaiting/no-loadwaiting.js](/Users/popskraft/Projects/carrd-v2/src/no-loadwaiting/no-loadwaiting.js)

Assessment:

- this is acceptable
- the plugin is not targeting repeatable content blocks; it is targeting Carrd's singular page loader

Decision tendency:

- keep as unique ID/global hook

### Cookie Banner

Primary contract:

- ID-based authoring

Evidence:

- `bannerId: 'cookie-baner'` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- `document.getElementById(CONFIG.bannerId)` in [/Users/popskraft/Projects/carrd-v2/src/cookie-banner/cookie-banner.js](/Users/popskraft/Projects/carrd-v2/src/cookie-banner/cookie-banner.js)

Assessment:

- this is workable but more rigid than necessary
- if the banner is treated as a reusable pattern, a class-first selector would be better
- if it is always a single global banner, ID is defensible, but still less flexible than needed

Decision tendency:

- optional refactor candidate
- lower priority than `header-nav`

### Header Nav

Primary contract:

- strongly ID-bound

Evidence:

- config uses `headerId`, `navId`, `ctaId`, `mobileStickyAnchorId` in `/Users/popskraft/Projects/carrd-v2/src/theme-config.js`
- runtime fetches multiple elements with `document.getElementById(...)` in [/Users/popskraft/Projects/carrd-v2/src/header-nav/header-nav.js](/Users/popskraft/Projects/carrd-v2/src/header-nav/header-nav.js)
- plugin still has selector fallback for nav and cta, but the root header contract is ID-first

Assessment:

- this is the clearest mismatch with the desired architecture
- for reusable behavior, the plugin should be able to locate its header root and subparts by classes/selectors first
- IDs should become optional compatibility overrides, not the primary contract

Decision tendency:

- highest-priority refactor target

## Recommended Direction

### Keep As-Is

- `cards`
- `grid-cluster`
- `faq`
- `slider`
- `typography`
- `modal` unique target IDs
- `no-loadwaiting` loader hook

### Improve, But Not Urgent

- `shopping-cart`
  - prefer class/name authoring guidance over ID-based field targeting
- `cookie-banner`
  - consider class-first selector with ID retained as fallback

### Refactor Next

- `header-nav`
  - move from ID-first to class-first
  - retain IDs only as compatibility overrides

## Proposed Decision Frame

If we want a class-first system without over-correcting, the likely decision set is:

1. Keep modal target IDs because modals are uniquely addressable entities.
2. Keep global one-off runtime IDs where the page truly has one unique target.
3. Refactor `header-nav` to class-first.
4. Optionally soften `cookie-banner` and `shopping-cart` toward class/name-first while preserving backward compatibility.

## Suggested Next Step

Make one concrete decision first:

- approve `header-nav` as the next refactor target to move from ID-first to class-first

After that, do a smaller follow-up decision:

- whether `cookie-banner` should also move to class-first
- whether `shopping-cart` docs/config should be normalized to class/name-first while keeping ID fallback
