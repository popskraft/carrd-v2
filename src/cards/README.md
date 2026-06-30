# Cards

Turns a Carrd container into styled card items. Each child of the container becomes a separate card with its own background, border, and padding.

No coding required. Add `data-cards="..."` and style the container — the plugin copies styles to each card automatically.

---

## What You Do in Carrd

1. Add a **Container** element and place your card content inside it.
2. Open its attributes panel and add `data-cards="pricing"` or another simple name.
3. In **Appearance**, set **Padding** — this becomes the inner spacing of every card.
4. Set background color, border, border-radius, and shadow on the container — the plugin copies these to each card automatically.

Different containers are independent — each reads their own name, padding, and card styles.

---

## How It Works in Carrd

- Each consecutive child of the marked container becomes one card item.
- Container background, border, border radius, shadow, and padding become the default card styling.
- New setups should use plugin-prefixed overrides such as `data-cards-color-1` and `data-cards-padding`.
- Legacy `.cards`, `data-color*`, `data-border-color*`, and `data-padding*` still work only as a migration bridge.

---

## How To Check That It Works

1. Publish or refresh the page.
2. The items inside the `data-cards` container should appear as separate cards.
3. Resize to mobile and confirm cards stack vertically.

If nothing changes, check that the `data-cards` attribute is present.

---

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed if you want to change default behavior:

```html
<script>
window.CarrdPluginOptions = {
    cards: {
        enabled: true,
        cardSelector: '[data-cards], .cards'
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptions` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `enabled` | `true` | Turns cards processing on or off |
| `cardSelector` | `[data-cards], .cards` | Selector for card containers |
| `defaultCardBg` | CSS variable | Fallback background when container has no background |

---

## Advanced: Per-Card Color

Add these attributes to the container in Carrd's attributes panel:

| Attribute | What it does |
|-----------|--------------|
| `data-cards-color=VALUE` | Background color for all cards in the container |
| `data-cards-color-1=VALUE`, `data-cards-color-2=VALUE`... | Per-card background color override |
| `data-cards-border-color-1=VALUE`, `data-cards-border-color-2=VALUE`... | Per-card border color override |

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
