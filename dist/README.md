## Version

- Version: `2.0.0`
- Build date (UTC): `2026-07-11`
- [View Changelog](CHANGELOG.md)

---

# Carrd Plugins

User guide for installing Carrd theme assets and plugins.

All install files are in `dist/`. Open the plugin folder you need and follow its local `README.md` for the required Carrd markup, attributes, or setup.

## Quick Start

All install files are inline Carrd embeds. There is no CDN/jsDelivr delivery — everything is pasted directly into Carrd.

1. Paste `dist/theme-design-system.html` into `Hidden → Head` once per site. This carries the shared design tokens and base UI styles.
2. Open each plugin folder you use and paste its `*-embed.html` into `Hidden → Body End` (see that plugin's `README.md` for the exact placement — some plugins, like `no-loadwaiting`, belong in `Head`).
3. For `shopping-cart` and `slider`, paste `*-embed-part1.html` and `*-embed-part2.html`, in that order, as two separate `Body End` embeds.
4. Publish and refresh.

Included plugins:

| Plugin | Notes |
|---|---|
| Accordeon | |
| Cards | |
| Cookie Banner | |
| Design Palette | Visible embed, paste where the palette should appear |
| FAQ | |
| Floating CTA | |
| Grid Cluster | |
| Header Nav | |
| Modal | |
| No-loadwaiting | Paste into `Head`, not `Body End` |
| Shopping Cart | Split embed: part1 + part2 |
| Slider | Split embed: part1 + part2 |
| Switcher | |
| Typography | |

## Install Paths

### Inline Embed (only path)

1. Paste `dist/theme-design-system.html` into `Hidden → Head` once. This combines `theme-design-tokens.css` and `theme-ui.css`.
   - To edit token values only, you can instead paste `dist/theme-design-tokens-embed.html` (tokens) and `dist/theme-ui-embed.html` (base UI styles) as two separate `Head` embeds.
   - Use `dist/theme-design-tokens.css` and `dist/theme-ui.css` as the plain-CSS reference contract when you need to inspect the full rule set.
2. Paste each plugin `*-embed.html` into `Hidden → Body End`.
3. For `shopping-cart` and `slider`, use `*-embed-part1.html` and `*-embed-part2.html` in that order.

## Custom Code

Do not edit generated `dist/` files directly — they are overwritten on every build. Add custom code in separate Carrd embeds.

- Brand or theme changes: use a `Head` embed with `:root { --theme-* }`.
- Plugin defaults ship with each plugin CSS; override its `--theme-<plugin>-*` tokens in the same `Head` embed when needed.
- Site-only CSS: use a separate `Head` embed with your selectors.
- Plugin behavior: use the plugin's documented `data-*` attributes when the behavior belongs to one instance; use `window.CarrdPluginOptions` only for plugins that explicitly document global/site-owned options.
- Site-only JS: use a separate `Body End` script below plugin scripts.

Short override example. Use this only on top of the full `theme-design-tokens-embed.html` layer:

```html
<style>
:root {
  --theme-color-primary: #0055FF;
  --theme-color-primary-hover: #003FCC;
  --theme-color-primary-focus: #003FCC;
  --theme-color-heading: #1F2937;
}
</style>
```

Example per-instance plugin configuration:

```html
<div data-slider="gallery" data-slider-autoplay="5000" data-slider-spv="1 2 3">
  …
</div>
```

## Placement Rules

- `Hidden → Head`: theme embeds, token overrides, site CSS, and any plugin snippet that explicitly says `Head`.
- `Hidden → Body End`: plugin scripts, plugin embeds, documented `window.CarrdPluginOptions`, and site custom JS.

## Troubleshooting

- Nothing happens: check the plugin `README.md` and confirm the required attrs, names, classes, or IDs match exactly.
- Styles look wrong: confirm the shared theme layer is installed in `Head`.
- Config does not apply: confirm that the plugin's documented `data-*` attributes are on the correct element; for global options, place `window.CarrdPluginOptions` above the plugin script or embed.
- A plugin still does not work: reopen that plugin folder `README.md` and follow it step by step.

## Included Plugins

| Plugin | Path |
|--------|------|
| **Accordeon** | `dist/accordeon/` |
| **Cards** | `dist/cards/` |
| **Cookie Banner** | `dist/cookie-banner/` |
| **Design Palette** | `dist/design-palette/` |
| **Faq** | `dist/faq/` |
| **Floating Cta** | `dist/floating-cta/` |
| **Grid Cluster** | `dist/grid-cluster/` |
| **Header Nav** | `dist/header-nav/` |
| **Modal** | `dist/modal/` |
| **No Loadwaiting** | `dist/no-loadwaiting/` |
| **Shopping Cart** | `dist/shopping-cart/` |
| **Slider** | `dist/slider/` |
| **Stacker** | `dist/stacker/` |
| **Switcher** | `dist/switcher/` |
| **Typography** | `dist/typography/` |
