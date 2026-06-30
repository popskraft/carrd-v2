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
<div data-slider="gallery">Slide 1</div>
<div data-slider="gallery">Slide 2</div>
```

- Consecutive elements with the same `data-slider` value form one slider.
- `window.CarrdPluginOptions.slider.instances.gallery` configures that slider.
- Legacy `.slider` and `data-slider-id` remain fallback during migration.

### Grid Cluster

```html
<div data-grid="features" data-grid-columns="3">A</div>
<div data-grid="features">B</div>
<div data-grid="features">C</div>
```

- Consecutive elements with the same `data-grid` value form one grid.
- `data-grid-columns`, `data-grid-sm`, `data-grid-md`, and `data-grid-lg` set column counts.
- `data-grid-gap` and `data-grid-gap-mobile` are the primary gap controls.
- `data-grid-width` sets an item width for desktop template helpers.
- Legacy `data-gap`, `data-gap-mobile`, `grid-N`, `grid-sm-N`, `grid-md-N`, `grid-lg-N`, `w-*`, and `justify` classes remain fallback during migration.

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
- Legacy class-index targets and `data-switcher-cluster` remain fallback during migration.

### Accordeon

```html
<a href="#data-accordeon-ppf">Toggle</a>
<div data-accordeon="ppf">Panel</div>
```

- `#data-accordeon-<name>` is the primary hash trigger.
- `data-accordeon="<name>"` identifies panels.
- Only `#data-accordeon-<name>` with matching `data-accordeon="<name>"` is supported in the clean runtime.

### Modal

```html
<a href="#data-modal-contact">Open modal</a>
<div data-modal="contact">Modal content</div>
```

- `#data-modal-<name>` is the primary hash trigger.
- `data-modal="<name>"` identifies modal containers.
- `data-modal-open="<name>"` is the primary non-link trigger attribute.
- Legacy `data-modal-target="<name>"` remains fallback during migration.
- Legacy `.modal` + `id` hash triggers remain fallback during migration.

### Cards

```html
<div data-cards="pricing">
  <div class="inner">...</div>
</div>
```

- `data-cards="<name>"` marks card containers.
- `data-cards-color`, `data-cards-color-<index>`, `data-cards-border-color-<index>`, `data-cards-padding`, and `data-cards-padding-mobile` are the primary per-container options.
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
<textarea data-shopping-cart-output="order-details"></textarea>
<div data-shopping-cart-target></div>
```

- `data-shopping-cart-output="order-details"` is the preferred explicit textarea marker.
- `data-shopping-cart-target` remains a supported checkout target marker.
- The checkout textarea is resolved only through `data-shopping-cart-output="order-details"` in the clean runtime.

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
| `shopping-cart` | `data-shopping-cart-output`, `data-shopping-cart-target` | same | none |
| `slider` | `data-slider="<name>"` | same | `.slider`, `data-slider-id` |
| `switcher` | `data-switcher`, `data-switcher-target`, `data-switcher-index` | same | class-index targets, `data-switcher-cluster` |

## Migration Rules

- New docs teach clean `data-*` first.
- Runtime keeps legacy fallback until v1 is frozen in a legacy branch or tag.
- Tests must cover native Carrd hash isolation for plugin hash triggers.
- Generated `dist/` must come from `src/` and templates only.
