# Plugin Data Contract

## Purpose

Define the public Carrd markup contract for plugins that bind repeated elements, groups, controls, and per-instance options.

## Core Rule

Public plugin binding uses `data-*` attributes. Classes are styling hooks or legacy fallback only.

```text
data-<plugin>="<name>"
```

`<name>` identifies one plugin instance or group and must match:

```text
^[a-zA-Z][a-zA-Z0-9_-]*$
```

Per-instance config keys must match the same `<name>`:

```js
window.CarrdPluginOptions = {
  slider: {
    instances: {
      gallery: {}
    }
  }
};
```

Secondary public attributes must stay plugin-prefixed:

```text
data-<plugin>-<role>
data-<plugin>-<option>
data-<plugin>-<option>-<index>
```

Avoid generic public attributes such as `data-gap`, `data-color`, or ambiguous roles such as `*-target` when the element is actually a trigger.

## Hash Trigger Rule

When Carrd's link UI is the simplest trigger surface, plugin-owned hashes use:

```text
#data-<plugin>-<name>
```

Examples:

```html
<a href="#data-accordeon-ppf">Toggle details</a>
<div data-accordeon="ppf">Details</div>

<a href="#data-modal-contact">Open modal</a>
<div data-modal="contact">Contact modal</div>
```

Plugins may intercept a hash click only when:

- `href` uses the exact plugin prefix;
- `<name>` is non-empty and safe;
- a matching plugin target exists under the plugin contract.

If the target is missing, leave the click untouched so native Carrd navigation can continue.

## Plugin Contracts

### Slider

```html
<div data-slider="gallery" data-slider-mode="center" data-slider-spv="1.2 3 4">Slide 1</div>
<div data-slider="gallery">Slide 2</div>
<div data-slider="gallery">Slide 3</div>
```

- Consecutive elements with the same `data-slider` value form one slider.
- Pure data-* contract, no `window.CarrdPluginOptions` for this plugin — all
  configuration goes on the first container of the cluster only:
  `data-slider-mode` (`free`/`center`), `data-slider-spv` and `data-slider-gap`
  (1–3 space-separated numbers mapped to mobile/≥737px/≥1280px breakpoints),
  `data-slider-autoplay` (ms), `data-slider-dots`, `data-slider-arrows`,
  `data-slider-arrows-mobile` (on/off). Invalid values fall back to the
  default and log one `console.warn('[slider] ...')` per instance. See
  `src/slider/README.md` for the full table.
- This is the native CSS scroll-snap engine (formerly developed in parallel
  as `slider-v2`); it was promoted to the sole `slider` plugin once its
  mechanics were accepted. The earlier hand-rolled drag/transform engine is
  archived at `docs/_archive/slider-v1-source/` and no longer shipped.

### Grid Cluster

```html
<div data-grid="features" data-grid-cols="3">A</div>
<div data-grid="features">B</div>
<div data-grid="features">C</div>
```

- Consecutive elements with the same `data-grid` value form one grid.
- `data-grid-cols`, `data-grid-cols-sm`, and `data-grid-cols-lg` set column counts.
- `data-grid-span`, `data-grid-span-sm`, and `data-grid-span-lg` let one item occupy more than one track.
- `data-grid-gap` and `data-grid-gap-mobile` are the primary gap controls.
- `data-grid-justify` stretches container content edge to edge inside the grid cell.

### Switcher

```html
<ul data-switcher="pricing">
  <li><a href="#" role="button">Monthly</a></li>
  <li><a href="#" role="button">Yearly</a></li>
</ul>

<div data-switcher-target="pricing" data-switcher-index="1">Monthly</div>
<div data-switcher-target="pricing" data-switcher-index="2">Yearly</div>
```

- `data-switcher` identifies the controller state group.
- `data-switcher-target` identifies targets for that controller.
- `data-switcher-index` is optional; without it, DOM order maps targets to buttons.
- Legacy class-index targets remain fallback only. Whole containers use the same `data-switcher-target` + `data-switcher-index` contract.
- `data-switcher-default-index` on the controller (`[data-switcher]`) sets which 1-based index is active on load, overriding `window.CarrdPluginOptions.switcher.defaultIndex` and any `instances.<name>.defaultIndex`. Invalid values fall back to the JS-configured default and log a `console.warn`.

### Accordeon

```html
<a href="#data-accordeon-ppf">Toggle</a>
<div data-accordeon="ppf" data-accordeon-default-open="on" data-accordeon-scroll="off">Panel</div>
```

- `#data-accordeon-<name>` is the primary hash trigger.
- `data-accordeon="<name>"` identifies panels.
- Only `#data-accordeon-<name>` with matching `data-accordeon="<name>"` is supported in the clean runtime.
- `data-accordeon-default-open="on"|"off"` on the first panel of a group opens it on page load, overriding the group's `window.CarrdPluginOptions.accordeon.defaultOpen`.
- `data-accordeon-scroll="on"|"off"` on the first panel toggles scroll-into-view on open for that group, overriding `scrollOnOpen`.
- `data-accordeon-scroll-behavior="smooth"|"auto"` overrides `scrollBehavior` for that group.
- `data-accordeon-scroll-block="start"|"center"|"end"|"nearest"` overrides `scrollBlock` for that group.
- Read only from the group's first panel; invalid values fall back to the JS-configured default and log a `console.warn`.

### Modal

```html
<a href="#data-modal-contact">Open modal</a>
<div data-modal="contact" data-modal-close-on-overlay="off" data-modal-lock-scroll="on">Modal content</div>
```

- `#data-modal-<name>` is the primary hash trigger.
- `data-modal="<name>"` identifies modal containers.
- `data-modal-open="<name>"` is the primary non-link trigger attribute.
- Legacy `data-modal-target="<name>"` remains fallback during migration.
- Legacy `.modal` + `id` hash triggers remain fallback during migration.
- `data-modal-close-on-overlay="on"|"off"` on the modal container overrides `window.CarrdPluginOptions.modal.closeOnOverlay` for that modal only (the overlay is a shared singleton; the setting is resolved per active modal, not fixed at overlay creation).
- `data-modal-close-on-escape="on"|"off"` overrides `closeOnEscape` for that modal.
- `data-modal-show-close="on"|"off"` overrides `showCloseButton` for that modal.
- `data-modal-lock-scroll="on"|"off"` overrides `lockBodyScroll` for that modal.
- Invalid values fall back to the JS-configured default and log a `console.warn`.

### Cards

```html
<div data-cards="pricing">
  <div class="inner">...</div>
</div>
```

- `data-cards="<name>"` marks card containers.
- `data-cards-color`, `data-cards-color-<index>`, `data-cards-border-color-<index>`, `data-cards-padding`, and `data-cards-padding-mobile` are the primary per-container options.
- Card backgrounds come from `data-cards-color*` when set; otherwise the plugin mirrors the container's visible background.
- Legacy `data-color*`, `data-border-color*`, and `data-padding*` remain fallback during migration.
- Legacy `.cards` remains fallback during migration.

### FAQ

```html
<div data-faq="main">
  <hr class="divider-component">
  <h2>Question</h2>
  <p>Answer</p>
</div>
```

- `data-faq="<name>"` marks each FAQ container.
- `data-faq-allow-multiple="true"` lets more than one answer stay open in that container.
- `data-faq-default-open="true"` opens the first question on page load.
- Each question block starts with a Carrd divider, then a heading, then answer content.
- Headings `H1`, `H2`, and `H3` are used as question titles; otherwise the first paragraph in the block is used.
- Legacy `.FAQContainer` remains fallback during migration.

### Floating CTA

```html
<a data-floating="contact" data-floating-position="bottom-right" href="#contact">Contact</a>
<a data-floating="pricing" data-floating-position-mobile="bottom-center" href="#pricing">Pricing</a>
```

- `data-floating="<name>"` marks every source element cloned by the floating CTA plugin.
- `data-floating-position` accepts `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.
- `data-floating-position-mobile` overrides the position on mobile only.
- Missing or invalid positions fall back to `bottom-right`.
- `data-floating-hide="mobile"` or `data-floating-hide="desktop"` controls viewport visibility for the runtime clone.
- Source elements stay in their original Carrd position; only runtime clones become fixed.
- Legacy source-ID cloning is retired for new installs.

### Cookie Banner

```html
<div data-cookie="consent" data-cookie-indent="1" data-cookie-delay="1000" data-cookie-position="bottom-right">
  <a href="#" role="button">Accept</a>
</div>
```

- `data-cookie="<name>"` marks each consent banner container.
- Multiple banners can exist on the same page and share the same consent cookie.
- `data-cookie-indent` uses `block-inline` rem values such as `1`, `0-1`, or `1-0`.
- `data-cookie-indent-mobile` overrides offsets on mobile only.
- `data-cookie-delay`, `data-cookie-days`, and `data-cookie-position` control per-banner behavior.
- Global runtime options still own fade timing and cookie name.
- Legacy `data-cookie="banner"`, `.cookie-banner`, and `#cookie-baner` remain fallback during migration.

### Shopping Cart

```html
<section id="shopping-cart">
  <form id="form-shopping-cart">
    <textarea data-shopping-cart-output="order-details"></textarea>
  </form>
</section>
```

- `data-shopping-cart-output="order-details"` is the preferred explicit textarea marker.
- The checkout textarea is resolved only through `data-shopping-cart-output="order-details"` in the clean runtime.
- Checkout opens the Carrd Section Break `#shopping-cart`; `data-shopping-cart-checkout-target="<section-id>"` on any element (typically the cart section itself) overrides that target section id, taking priority over `window.CarrdPluginOptions.shoppingCart.checkoutTargetId`. An invalid (non-safe-name) value falls back to the JS-configured default and logs a `console.warn`.

## Naming Matrix

| Plugin | Primary | Recommended setup | Legacy fallback |
|---|---|---|---|
| `accordeon` | `data-accordeon`, `#data-accordeon-*` | same | none |
| `cards` | `data-cards`, `data-color*`, `data-border-color*`, `data-padding*` | `data-cards="<name>"`, `data-cards-color*`, `data-cards-border-color*`, `data-cards-padding*` | `.cards`, old generic `data-*` attrs |
| `cookie-banner` | `data-cookie="<name>"` | named markers such as `data-cookie="consent"` | literal `banner`, `.cookie-banner`, `#cookie-baner` |
| `faq` | `data-faq="<name>"` | same | `.FAQContainer` |
| `floating-cta` | `data-floating="<name>"` | named markers such as `data-floating="contact"` | literal `cta` values already keep working |
| `grid-cluster` | `data-grid`, `data-gap*` | `data-grid`, `data-grid-gap*` | `data-gap*`, `grid-*`, `w-*`, `justify` |
| `modal` | `data-modal`, `data-modal-target`, `#data-modal-*` | `data-modal`, `data-modal-open`, `#data-modal-*` | `.modal` + `id`, `data-modal-target` |
| `shopping-cart` | `#shopping-cart`, `#form-shopping-cart`, `data-shopping-cart-output` | same | none |
| `slider` | `data-slider="<name>"` | same | `.slider`, `data-slider-id` |
| `switcher` | `data-switcher`, `data-switcher-target`, `data-switcher-index` | same | class-index targets |

## Per-Instance Behavior Overrides

Some plugins also expose element-level `data-*` overrides for behavior that used to be JS-only (`window.CarrdPluginOptions.<plugin>`), so a non-technical site owner can adjust one instance without touching custom JS:

- `accordeon`: `data-accordeon-default-open`, `data-accordeon-scroll`, `data-accordeon-scroll-behavior`, `data-accordeon-scroll-block` (read from the group's first panel).
- `modal`: `data-modal-close-on-overlay`, `data-modal-close-on-escape`, `data-modal-show-close`, `data-modal-lock-scroll` (read per modal container).
- `switcher`: `data-switcher-default-index` (read from the controller).
- `shopping-cart`: `data-shopping-cart-checkout-target` (read from any element carrying it, typically the cart section).

Priority order for these is always: element `data-*` attribute > `window.CarrdPluginOptions.<plugin>` (including per-instance `instances.<name>`, where that mechanism exists) > hardcoded plugin default. Invalid attribute values never break the plugin — they fall back to the next level down and log one `console.warn` per instance.

`window.CarrdPluginOptions` is **not legacy debt to retire** — per `AGENTS.md`, it is the permanent site-owned custom layer (set directly in a site's Carrd embeds, never shipped from `dist/`), sitting alongside the repo-owned defaults pre-set in `src/theme-config.js`. Adding a `data-*` override does not remove or deprecate the JS option; both remain valid, with `data-*` taking precedence when both are present.

## Migration Rules

- New docs teach clean `data-*` first.
- Runtime keeps legacy fallback until v1 is frozen in a legacy branch or tag.
- Tests must cover native Carrd hash isolation for plugin hash triggers.
- Generated `dist/` must come from `src/` and templates only.
