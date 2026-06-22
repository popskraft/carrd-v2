# Plugin V2 Data Contract

## Purpose

Define the v2 public Carrd markup contract for plugins that bind repeated elements, groups, controls, and per-instance options.

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
window.CarrdPluginOptionsV2 = {
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
<a href="#data-accordeon-v2-ppf">Toggle details</a>
<div data-accordeon-v2="ppf">Details</div>

<a href="#data-modal-v2-contact">Open modal</a>
<div data-modal-v2="contact">Contact modal</div>
```

Plugins may intercept a hash click only when:

- `href` uses the exact plugin prefix;
- `<name>` is non-empty and safe;
- a matching plugin target exists under the plugin contract.

If the target is missing, leave the click untouched so native Carrd navigation can continue.

## Plugin Contracts

### Slider

```html
<div data-slider-v2="gallery">Slide 1</div>
<div data-slider-v2="gallery">Slide 2</div>
```

- Consecutive elements with the same `data-slider-v2` value form one slider.
- `window.CarrdPluginOptionsV2.slider.instances.gallery` configures that slider.
- Legacy `.slider` and `data-slider-v2-id` remain fallback during migration.

### Grid Cluster

```html
<div data-grid-v2="features" data-grid-v2-columns="3">A</div>
<div data-grid-v2="features">B</div>
<div data-grid-v2="features">C</div>
```

- Consecutive elements with the same `data-grid-v2` value form one grid.
- `data-grid-v2-columns`, `data-grid-v2-sm`, `data-grid-v2-md`, and `data-grid-v2-lg` set column counts.
- `data-grid-v2-gap` and `data-grid-v2-gap-mobile` are the primary gap controls.
- `data-grid-v2-width` sets an item width for desktop template helpers.
- Legacy `data-gap`, `data-gap-mobile`, `grid-N`, `grid-sm-N`, `grid-md-N`, `grid-lg-N`, `w-*`, and `justify` classes remain fallback during migration.

### Switcher

```html
<ul data-switcher-v2="pricing">
  <li><a href="#" role="button">Monthly</a></li>
  <li><a href="#" role="button">Yearly</a></li>
</ul>

<div data-switcher-v2-target="pricing" data-switcher-v2-index="1">Monthly</div>
<div data-switcher-v2-target="pricing" data-switcher-v2-index="2">Yearly</div>
```

- `data-switcher-v2` identifies the controller state group.
- `data-switcher-v2-target` identifies targets for that controller.
- `data-switcher-v2-index` is optional; without it, DOM order maps targets to buttons.
- Legacy class-index targets and `data-switcher-v2-cluster` remain fallback during migration.

### Accordeon

```html
<a href="#data-accordeon-v2-ppf">Toggle</a>
<div data-accordeon-v2="ppf">Panel</div>
```

- `#data-accordeon-v2-<name>` is the v2 hash trigger.
- `data-accordeon-v2="<name>"` identifies panels.
- Legacy `#accordeon-<name>` and `data-accorderon-v2` remain fallback during migration.

### Modal

```html
<a href="#data-modal-v2-contact">Open modal</a>
<div data-modal-v2="contact">Modal content</div>
```

- `#data-modal-v2-<name>` is the v2 hash trigger.
- `data-modal-v2="<name>"` identifies modal containers.
- `data-modal-v2-open="<name>"` is the primary non-link trigger attribute.
- Legacy `data-modal-v2-target="<name>"` remains fallback during migration.
- Legacy `.modal` + `id` hash triggers remain fallback during migration.

### Cards

```html
<div data-cards-v2="pricing">
  <div class="inner">...</div>
</div>
```

- `data-cards-v2="<name>"` marks card containers.
- `data-cards-v2-color`, `data-cards-v2-color-<index>`, `data-cards-v2-border-color-<index>`, `data-cards-v2-padding`, and `data-cards-v2-padding-mobile` are the primary per-container options.
- Legacy `data-color*`, `data-border-color*`, and `data-padding*` remain fallback during migration.
- Legacy `.cards` remains fallback during migration.

### FAQ

```html
<div data-faq-v2="main">
  <hr class="divider-component">
  <h2>Question</h2>
  <p>Answer</p>
</div>
```

- `data-faq-v2="<name>"` marks each FAQ container.
- `data-faq-v2-allow-multiple="true"` lets more than one answer stay open in that container.
- `data-faq-v2-default-open="true"` opens the first question on page load.
- Each question block starts with a Carrd divider, then a heading, then answer content.
- Headings `H1`, `H2`, and `H3` are used as question titles; otherwise the first paragraph in the block is used.
- Legacy `.FAQContainer` remains fallback during migration.

### Floating CTA

```html
<a data-floating-v2="contact" data-floating-v2-position="bottom-right" href="#contact">Contact</a>
<a data-floating-v2="pricing" data-floating-v2-position-mobile="bottom-center" href="#pricing">Pricing</a>
```

- `data-floating-v2="<name>"` marks every source element cloned by the floating CTA plugin.
- `data-floating-v2-position` accepts `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.
- `data-floating-v2-position-mobile` overrides the position on mobile only.
- Missing or invalid positions fall back to `bottom-right`.
- `data-floating-v2-hide="mobile"` or `data-floating-v2-hide="desktop"` controls viewport visibility for the runtime clone.
- Source elements stay in their original Carrd position; only runtime clones become fixed.
- Legacy source-ID cloning is retired for new installs.

### Cookie Banner

```html
<div data-cookie-v2="consent" data-cookie-v2-indent="1" data-cookie-v2-delay="1000" data-cookie-v2-position="bottom-right">
  <a href="#" role="button">Accept</a>
</div>
```

- `data-cookie-v2="<name>"` marks each consent banner container.
- Multiple banners can exist on the same page and share the same consent cookie.
- `data-cookie-v2-indent` uses `block-inline` rem values such as `1`, `0-1`, or `1-0`.
- `data-cookie-v2-indent-mobile` overrides offsets on mobile only.
- `data-cookie-v2-delay`, `data-cookie-v2-days`, and `data-cookie-v2-position` control per-banner behavior.
- Global runtime options still own fade timing and cookie name.
- Legacy `data-cookie-v2="banner"`, `.cookie-banner`, and `#cookie-baner` remain fallback during migration.

### Shopping Cart

```html
<textarea data-shopping-cart-v2-output="order-details"></textarea>
<div data-shopping-cart-v2-target></div>
```

- `data-shopping-cart-v2-output="order-details"` is the preferred explicit textarea marker.
- `data-shopping-cart-v2-target` remains a supported checkout target marker.
- Legacy `data-cart-v2-output="order-details"`, `.cart-output`, `#order-details`, and name-based fallbacks remain supported.

## Naming Matrix

| Plugin | Current | Recommended | Legacy fallback |
|---|---|---|---|
| `accordeon` | `data-accordeon-v2`, `#data-accordeon-v2-*` | same | `#accordeon-*`, `data-accorderon-v2` |
| `cards` | `data-cards-v2`, `data-color*`, `data-border-color*`, `data-padding*` | `data-cards-v2="<name>"`, `data-cards-v2-color*`, `data-cards-v2-border-color*`, `data-cards-v2-padding*` | `.cards`, old generic `data-*` attrs |
| `cookie-banner` | `data-cookie-v2="banner"` | `data-cookie-v2="<name>"` | literal `banner`, `.cookie-banner`, `#cookie-baner` |
| `faq` | `data-faq-v2="<name>"` | same | `.FAQContainer` |
| `floating-cta` | `data-floating-v2="cta"` | `data-floating-v2="<name>"` | literal `cta` values already keep working |
| `grid-cluster` | `data-grid-v2`, `data-gap*` | `data-grid-v2`, `data-grid-v2-gap*` | `data-gap*`, `grid-*`, `w-*`, `justify` |
| `modal` | `data-modal-v2`, `data-modal-v2-target`, `#data-modal-v2-*` | `data-modal-v2`, `data-modal-v2-open`, `#data-modal-v2-*` | `.modal` + `id`, `data-modal-v2-target` |
| `shopping-cart` | `data-cart-v2-output`, `data-shopping-cart-v2-target` | `data-shopping-cart-v2-output`, `data-shopping-cart-v2-target` | `.cart-output`, `#order-details`, name field |
| `slider` | `data-slider-v2="<name>"` | same | `.slider`, `data-slider-v2-id` |
| `switcher` | `data-switcher-v2`, `data-switcher-v2-target`, `data-switcher-v2-index` | same | class-index targets, `data-switcher-v2-cluster` |

## Migration Rules

- New docs teach v2 `data-*` first.
- Runtime keeps legacy fallback until v1 is frozen in a legacy branch or tag.
- Tests must cover native Carrd hash isolation for plugin hash triggers.
- Generated `dist/` must come from `src/` and templates only.
