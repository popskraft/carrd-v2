# Switcher Contract

## Purpose

Technical owner doc for the `switcher` plugin.

This file defines what is specific to `switcher`. Shared naming rules belong to [docs/specs/plugin-data-contract.md](/Users/popskraft/Projects/carrd-v2/docs/specs/plugin-data-contract.md).

## Scope

`switcher` is a vanilla JS/CSS Carrd plugin that changes visible page elements through an existing Carrd buttons list.

Supported use cases:

- text variants;
- cards or image/text blocks;
- multiple independent switchers on one page;
- synchronized controllers with the same `data-switcher` name;
- whole-container switching through explicit target indexes.

Source lives in `src/switcher/`. Delivery lives in `dist/switcher/`.

## Public Carrd Contract

### Controller

```html
<ul data-switcher="pricing">
  <li><a href="#" role="button">Monthly</a></li>
  <li><a href="#" role="button">Yearly</a></li>
</ul>
```

Rules:

- `data-switcher` is required.
- The value must be a safe name such as `pricing`, `cases`, or `faq-mode`.
- Button order defines indexes: first button is `1`, second is `2`.
- Carrd button classes such as `n01` and `n02` are ignored by plugin logic.

### Primary data targets

```html
<div data-switcher-target="pricing" data-switcher-index="1">Monthly</div>
<div data-switcher-target="pricing" data-switcher-index="2">Yearly</div>
```

Rules:

- `data-switcher-target` is the primary target contract.
- `data-switcher-index` is optional.
- If indexes are present, all targets with the same index are shown together.
- If indexes are omitted, DOM order maps targets to buttons.

### Legacy class-index targets

```html
<p class="pricing-1">Monthly</p>
<p class="pricing-2">Yearly</p>
```

Rules:

- Class-index targets remain fallback only.
- Multiple elements may share one target class.
- When both an outer Carrd container and nested child nodes match, the outermost target wins.

### Whole-container targets

```html
<ul data-switcher="cases">
  <li><a role="button">Case 1</a></li>
  <li><a role="button">Case 2</a></li>
</ul>

<section data-switcher-target="cases" data-switcher-index="1">...</section>
<section data-switcher-target="cases" data-switcher-index="2">...</section>
```

Rules:

- Use `data-switcher-target` on the outer container itself.
- Use explicit `data-switcher-index` when button-to-container mapping must stay stable.
- The controller must sit outside the targets it can hide.

## Runtime Contract

Internal runtime classes:

```text
theme-switcher-controller
theme-switcher-button
theme-switcher-panel
is-active
is-inactive
```

Runtime attributes:

- active button: `aria-pressed="true"`
- inactive button: `aria-pressed="false"`
- active target: `hidden = false`, `aria-hidden="false"`
- inactive target: `hidden = true`, `aria-hidden="true"`

Behavior rules:

- Controllers with the same `data-switcher` name form one synchronized state group.
- Each controller still resolves its own targets inside its own scope.
- Public IDs are not required on targets.
- Switcher button clicks must cancel default anchor behavior and delegated hash handlers.
- Buttons without `href` must still receive pointer cursor styling.

## Lookup Algorithm

For each controller:

1. Read `data-switcher`.
2. Reject empty or unsafe names.
3. Resolve base scope: `closest('section') || closest('.site-main') || document`.
4. Collect buttons with `querySelectorAll('a[role="button"], a')`.
5. Prefer clean targets with `data-switcher-target="<name>"` inside the base scope.
6. If the base scope has no clean targets and `closest('.site-main')` is wider, retry clean targets there.
7. If no clean targets exist, fall back to legacy class-index targets in the base scope.
8. Initialize to configured active index, default `1`.
9. On click, prevent default and show the chosen index across all controllers with the same name.

## CSS Contract

Carrd's generated button hover CSS uses `!important`, so switcher active styles must also use `!important`.

Required behavior:

```css
[data-switcher] .theme-switcher-button {
  cursor: pointer;
}

[data-switcher] .theme-switcher-button.is-active,
[data-switcher] .theme-switcher-button.is-active:hover {
  background-color: var(--theme-switcher-active-bg, var(--theme-color-primary-dark, #041838)) !important;
  border-color: var(--theme-switcher-active-bg, var(--theme-color-primary-dark, #041838)) !important;
  color: var(--theme-switcher-active-color, var(--theme-btn-text, #ffffff)) !important;
}

.theme-switcher-panel[hidden] {
  display: none !important;
}
```

Recommended variables:

| Variable | Default |
|---|---|
| `--theme-switcher-active-bg` | `var(--theme-color-primary-dark, #041838)` |
| `--theme-switcher-active-color` | `var(--theme-btn-text, #ffffff)` |
| `--theme-switcher-active-border` | active background |
| `--theme-switcher-animation-duration` | `1s` |
| `--theme-switcher-animation-distance` | `0.75rem` |
| `--theme-switcher-animation-easing` | `ease-out` |

## Configuration

Namespace:

```js
window.CarrdPluginOptions = {
  switcher: {
    enabled: true,
    controllerSelector: '[data-switcher]',
    defaultIndex: 1,
    warnOnMismatch: true,
    scopeSelector: 'section',
    targetAttribute: 'data-switcher-target',
    targetIndexAttribute: 'data-switcher-index',
    instances: {
      price: { defaultIndex: 2 }
    }
  }
};
```

Core options:

| Option | Default | Purpose |
|---|---:|---|
| `enabled` | `true` | Turns the plugin on or off |
| `controllerSelector` | `[data-switcher]` | Finds switcher controllers |
| `defaultIndex` | `1` | Button and target shown on page load |
| `warnOnMismatch` | `true` | Shows console warnings for missing targets |
| `scopeSelector` | `section` | Parent scope for class-mode targets |
| `targetAttribute` | `data-switcher-target` | Canonical target attribute |
| `targetIndexAttribute` | `data-switcher-index` | Optional explicit button index |
| `instances` | `{}` | Per-switcher overrides |

## Confirmed Template Evidence

Reference source: `/Users/popskraft/Projects/carrd-v2/carrd-source/index.html`.

Observed structure:

- `ul#buttons01.buttons-component` uses `data-switcher="switcher"`.
- It has two buttons: `Switcher Var 1` and `Switcher Var 2`.
- `p#text37` uses `.switcher-1`.
- `p#text29` uses `.switcher-2`.
- Both targets sit inside `div#container13`.
- Controller and target container share `section#home-section` as the nearest stable scope.

Local `jsdom` verification confirmed:

- initial state shows `text37` and hides `text29`;
- clicking the second button hides `text37` and shows `text29`;
- `aria-pressed` and `aria-hidden` can be set correctly on this structure.

## Related Docs

- `docs/specs/carrd-markup-contract.md`
- `docs/specs/carrd-contract.md`
- `docs/specs/carrd-source-reference.md`
