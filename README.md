# Carrd Plugins

User guide for installing Carrd theme assets and plugins.

All install files are in `dist/`. Open the plugin folder you need and follow its local `README.md` for the required Carrd markup, attributes, or setup.

## Quick Start

Use the CDN Bundle for new sites.

1. Open `dist/theme-core-cdn.html`.
2. Paste the `Head` part into `Hidden → Head`.
3. Paste the `Body End` part into `Hidden → Body End`.
4. Publish and refresh.
5. Open each plugin folder you use and complete the Carrd-side setup from that plugin `README.md`.

Bundle plugins:

| Plugin | Included in `theme-core` bundle |
|---|---|
| Accordeon | Yes |
| Cards | Yes |
| FAQ | Yes |
| Floating CTA | Yes |
| Grid Cluster | Yes |
| Header Nav | Yes |
| Modal | Yes |
| Slider | Yes |
| Switcher | Yes |
| Typography | Yes |
| Cookie Banner | No, add separately |
| No-loadwaiting | No, add separately |
| Shopping Cart | No, add separately |

## Install Paths

### CDN Bundle

Recommended for most sites.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core.min.css">
<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core.min.js"></script>
```

Use `dist/theme-core-cdn.html` as the copy source.

### Bundle Add-ons

If your site already uses the bundle and you need a plugin that is not inside it, add that plugin separately with its own `*-cdn.html` or `*-embed.html`.

This applies to:
- `cookie-banner`
- `no-loadwaiting`
- `shopping-cart`

### CDN Individual

Use this when you want only selected plugins instead of the full bundle.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-design-tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-ui.css">
```

Then open each plugin `*-cdn.html` file and:
- Paste the `<!-- Head -->` part into `Hidden → Head`.
- Paste the `<!-- Body End -->` part into `Hidden → Body End` when present.

`no-loadwaiting` is a special case: its script belongs in `Head`.

### Inline Embed

Use this when you do not want CDN files.

1. Paste `dist/theme-design-system.html` into `Hidden → Head`.
2. Paste each plugin `*-embed.html` into `Hidden → Body End`.
3. For `shopping-cart` and `slider`, use `*-embed-part1.html` and `*-embed-part2.html` in that order.

## Custom Code

Do not edit jsDelivr files. Add custom code in separate Carrd embeds.

- Brand or theme changes: use a `Head` embed with `:root { --theme-* }`.
- Site-only CSS: use a separate `Head` embed with your selectors.
- Plugin behavior: use `window.CarrdPluginOptions` in a `Body End` embed above plugin scripts or embeds.
- Site-only JS: use a separate `Body End` script below plugin scripts.

Example token override:

```html
<style>
:root {
  --theme-color-primary: #0055FF;
}
</style>
```

Example plugin config:

```html
<script>
window.CarrdPluginOptions = {
  slider: { autoplay: true }
};
</script>
```

## Placement Rules

- `Hidden → Head`: theme files, CDN CSS, token overrides, site CSS, and any plugin snippet that explicitly says `Head`.
- `Hidden → Body End`: plugin scripts, plugin embeds, `window.CarrdPluginOptions`, and site custom JS.

## Troubleshooting

- Nothing happens: check the plugin `README.md` and confirm the required attrs, names, classes, or IDs match exactly.
- Styles look wrong: confirm the shared theme layer is installed in `Head`.
- Config does not apply: make sure `window.CarrdPluginOptions` is above the plugin script or embed.
- A plugin still does not work: reopen that plugin folder `README.md` and follow it step by step.
