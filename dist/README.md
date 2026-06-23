## Version

- Version: `2.0.0`
- Build date (UTC): `2026-06-23`
- [View Changelog](CHANGELOG.md)

---

# Carrd Plugins V2

Ready-to-use plugins for Carrd pages. `src/` is the source of truth; `dist/` is generated delivery.

## Ключевые Идеи

- `KI-001 [active]` `theme-design-system.html` is the required base layer for every Carrd install path.
- `KI-002 [active]` The CDN Bundle is the default install path for new sites; CDN Individual and Inline Embed are fallback paths.
- `KI-003 [active]` `src/` is the source of truth for plugin behavior, while `dist/` is generated delivery.
- `KI-004 [active]` Plugin guidance is written for Carrd end users; shared build rules live in `scripts/templates/` and `docs/`.
- `KI-005 [active]` New grouped plugin contracts use `data-*` bindings first; classes and plain hashes are legacy fallbacks.
- `KI-006 [active]` V2 delivery uses `popskraft/carrd-v2` paths only; legacy `popskraft/carrd-plugins` remains a historical runtime surface.

## What This Repo Is

- Carrd plugins with matching source and distributive assets.
- A v2 runtime repo with `*-v2` plugin slugs, bundle files, globals, and jsDelivr snippets.
- A shared theme layer for consistent styling and defaults.
- A build pipeline that keeps public docs, embeds, and assets aligned.

## Repository Structure

| Path | What lives here |
|---|---|
| `src/` | Editable plugin source, source READMEs, shared theme files |
| `dist/` | Generated plugin assets, embed snippets, and public READMEs |
| `scripts/` | Build, verification, purge, and README generation scripts |
| `docs/` | Durable internal docs, specs, templates, and research |

## Install Paths

Three install paths:

| | CDN Bundle | CDN Individual | Inline Embed |
|---|---|---|---|
| **What it is** | Two jsDelivr links | jsDelivr files per plugin | Local HTML embeds pasted into Carrd |
| **When to use** | Default for new sites | Selected plugins with CDN updates | No CDN or full local control |
| **Embeds in Carrd** | 2 | Shared theme links + 1-2 embeds per plugin | Theme header + 1 embed per plugin |
| **Update path** | Rebuild + purge cache | Rebuild + purge changed files | Re-paste updated embeds |

## CDN Bundle (Recommended)

Fastest path: use `dist/theme-core-v2-cdn.html` as the copy source.

### Step 1 — Head embed

In Carrd: `Add Element → Embed → Code → Hidden → Head`

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.css">
```

### Step 2 — Body End embed

In Carrd: `Add Element → Embed → Code → Hidden → Body End`

```html
<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.js"></script>
```

`theme-core-v2.min.css` contains design tokens, shared UI styles, and bundle plugin CSS. `theme-core-v2.min.js` contains plugin defaults and bundle plugin JS.

## CDN Individual (Per-Plugin)

Use this when you want selected plugins through jsDelivr instead of the full `theme-core-v2` bundle.

### Step 1 — Shared Head embed

In Carrd: `Add Element → Embed → Code → Hidden → Head`

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-design-tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-ui.css">
```

### Step 2 — Plugin CDN file

For each selected plugin, open `*-cdn.html` and:
- Paste the `<!-- Head -->` part into `Hidden → Head`.
- Paste the `<!-- Body End -->` part into `Hidden → Body End` when present.

Example (`dist/faq-v2/faq-v2-cdn.html`):

```html
<!-- Head -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/faq-v2/faq-v2.min.css">

<!-- Body End -->
<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/faq-v2/faq-v2.min.js"></script>
```

`no-loadwaiting` has only a `Head` script block because it must run before Carrd loader completion.

### Local overrides

To change colors, spacing, or plugin behavior on one site, add a separate embed instead of editing CDN files:

```html
<style>
:root {
  --theme-color-primary: #0055FF;
}
</style>
```

```html
<script>
window.CarrdPluginOptionsV2 = {
  slider: { autoplay: true }
};
</script>
```

## Inline Embed (Per-Plugin)

Use when you need selected plugins without CDN.

### Step 1 — Install theme header

In Carrd: `Add Element → Embed → Code → Hidden → Head`

1. Open `dist/theme-design-system.html`.
2. Copy the full file contents into the Head embed.

### Step 2 — Install each plugin

In Carrd: `Add Element → Embed → Code → Hidden → Body End`

1. Open the plugin folder (e.g. `dist/faq-v2/`).
2. Read that plugin `README.md`.
3. Open `<plugin>-embed.html`, copy all contents.
4. Paste into a Body End embed.
5. Follow the plugin setup steps.

`shopping-cart` and `slider` require two Body End embeds: `*-embed-part1.html` first, then `*-embed-part2.html`.

## How To Change Styles

Plugin README files include `:root { ... }` examples for optional overrides.
- CDN path: add a separate `Head` embed with your `:root` block below the CDN link.
- Inline path: add a separate `Head` embed with your `:root` block below `theme-design-system.html`.

## Included Plugins

| Plugin | Path |
|--------|------|
| **Accordeon V2** | `dist/accordeon-v2/` |
| **Cards V2** | `dist/cards-v2/` |
| **Cookie Banner V2** | `dist/cookie-banner-v2/` |
| **Faq V2** | `dist/faq-v2/` |
| **Floating Cta V2** | `dist/floating-cta-v2/` |
| **Grid Cluster V2** | `dist/grid-cluster-v2/` |
| **Header Nav V2** | `dist/header-nav-v2/` |
| **Modal V2** | `dist/modal-v2/` |
| **No Loadwaiting V2** | `dist/no-loadwaiting-v2/` |
| **Shopping Cart V2** | `dist/shopping-cart-v2/` |
| **Slider V2** | `dist/slider-v2/` |
| **Switcher V2** | `dist/switcher-v2/` |
| **Typography V2** | `dist/typography-v2/` |


## Validation

For documentation and distributive checks:

```bash
npm run build:docs
npm run verify:dist
npm run test
npm run lint
```

## Key Documents

- [`AGENTS.md`](./AGENTS.md)
- [`DEFINITION-OF-DONE.md`](./DEFINITION-OF-DONE.md)
- [`ROADMAP.md`](./ROADMAP.md)
- [`docs/INDEX.md`](./docs/INDEX.md)

## Troubleshooting

| Problem | What to check |
|---|---|
| Nothing happens | Check the plugin README and confirm the required attrs, names, classes, or IDs match exactly |
| Styles look wrong | Confirm the shared theme layer is installed in `Head` |
| Controls look plain or missing | Reinstall the shared theme layer in `Head` |
| Config does not apply | Make sure `window.CarrdPluginOptionsV2` appears above the plugin embed |
| A plugin still does not work | Re-open that plugin folder README and follow its `What You Do in Carrd` section step by step |

