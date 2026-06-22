# Cards V2

## Version

- Version: `0.1.22`
- Build date (UTC): `2026-06-22`

## Installation

### CDN Bundle (recommended)

If your site already has the CDN embeds installed (`theme-core-v2.min.css` in Head and `theme-core-v2.min.js` in Body End), this plugin is already active — no extra steps needed.

To install CDN embeds: see the root `README.md` → **CDN Bundle** section.

### CDN Individual (single plugin)

Use this when you want jsDelivr links for selected plugins instead of the full bundle.

**Step 1 — Install shared theme header (once per site)**

In Carrd add `Embed → Code → Hidden → Head` and paste:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-design-tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-ui.css">
```

**Step 2 — Install this plugin through CDN**

1. Open `cards-v2-cdn.html` from this folder.
2. Paste the `<!-- Head -->` part into `Hidden → Head`.
3. Paste the `<!-- Body End -->` part into `Hidden → Body End` when present.
4. Publish the page and refresh.

### Inline Embed (single plugin)

Use this when installing only selected plugins without the CDN bundle.

**Step 1 — Install theme header (once per site)**

1. Open `theme-design-system.html` from the `dist/` folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Head` and paste.

**Step 2 — Install this plugin**

1. Open `cards-v2-embed.html` from this folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Body End` and paste.
4. Publish the page and refresh.

## How To Change Styles

If this README contains a `:root { ... }` block later, do not paste it into the plugin code block itself.

Create a separate hidden `Head` style block below `theme-design-system.html` and place the overrides there.

Example of a separate settings block:

```html
<style>
:root {
  /* Put your overrides here */
}
</style>
```

Place that style block below `theme-design-system.html`.

---

Turns a Carrd container into styled card items. Each child of the container becomes a separate card with its own background, border, and padding.

No coding required. Add `data-cards-v2="..."` and style the container — the plugin copies styles to each card automatically.

---

## What You Do in Carrd

1. Add a **Container** element and place your card content inside it.
2. Open its attributes panel and add `data-cards-v2="pricing"` or another simple name.
3. In **Appearance**, set **Padding** — this becomes the inner spacing of every card.
4. Set background color, border, border-radius, and shadow on the container — the plugin copies these to each card automatically.

Different containers are independent — each reads their own name, padding, and card styles.

---

## How It Works in Carrd

- Each consecutive child of the marked container becomes one card item.
- Container background, border, border radius, shadow, and padding become the default card styling.
- New setups should use plugin-prefixed overrides such as `data-cards-v2-color-1` and `data-cards-v2-padding`.
- Legacy `.cards`, `data-color*`, `data-border-color*`, and `data-padding*` still work only as a migration bridge.

---

## How To Check That It Works

1. Publish or refresh the page.
2. The items inside the `data-cards-v2` container should appear as separate cards.
3. Resize to mobile and confirm cards stack vertically.

If nothing changes, check that the `data-cards-v2` attribute is present.

---

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed if you want to change default behavior:

```html
<script>
window.CarrdPluginOptionsV2 = {
    cards: {
        enabled: true,
        cardSelector: '[data-cards-v2], .cards'
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptionsV2` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `enabled` | `true` | Turns cards processing on or off |
| `cardSelector` | `[data-cards-v2], .cards` | Selector for card containers |
| `defaultCardBg` | CSS variable | Fallback background when container has no background |

---

## Advanced: Per-Card Color

Add these attributes to the container in Carrd's attributes panel:

| Attribute | What it does |
|-----------|--------------|
| `data-cards-v2-color=VALUE` | Background color for all cards in the container |
| `data-cards-v2-color-1=VALUE`, `data-cards-v2-color-2=VALUE`... | Per-card background color override |
| `data-cards-v2-border-color-1=VALUE`, `data-cards-v2-border-color-2=VALUE`... | Per-card border color override |

Legacy fallback: `data-color*`, `data-border-color*`, and `data-padding*` still work on older pages.

---

## Design

Add a **Code** embed with a `<style>` tag and override any of these variables:

```html
<style>
:root {
    --theme-card-bg-default: var(--theme-color-primary-light);
    --theme-card-border-radius: 0;
    --theme-card-padding: 2rem;
    --theme-card-padding-mobile: 1rem;
}
</style>
```

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-card-bg-default` | primary light color | Fallback card background |
| `--theme-card-border-radius` | from container | Card corner radius |
| `--theme-card-padding` | from container | Card inner padding |
| `--theme-card-padding-mobile` | not set | Mobile padding (only when different from desktop) |

`--theme-card-padding` is set automatically from the container padding. Only override it manually if you need a fixed value regardless of what Carrd sets.
