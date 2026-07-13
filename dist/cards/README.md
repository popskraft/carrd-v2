# Cards

Turns each child of a marked Carrd container into a styled card.

Version: `2.0.0`

## Install

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `cards-embed.html`.
3. Add a new element: `+ Add an element` → `Embed`, placed at the end of the page.
4. Paste the full file into `Code → Hidden → Body End`.
5. Give the new Embed element a Title, then publish and refresh.

## Carrd Setup

1. Add a **Container** and place the card items inside it.
2. Add `data-cards=pricing` to the container.
3. Set the container padding, background, border, radius, and shadow in Carrd.

The plugin copies those styles to every card item. Each marked container works independently.

## Configuration

Defaults work without configuration. To change the container selector or disable the plugin, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  cards: {
    enabled: true,
    cardSelector: '[data-cards]'
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `enabled` | `true` | Set `false` to disable the plugin globally |
| `cardSelector` | `'[data-cards]'` | Attribute selector used to find card containers |

Optional container attributes:

| Attribute | Result |
|---|---|
| `data-cards-color=VALUE` | Sets every card background |
| `data-cards-color-1=VALUE` | Sets the first card background |
| `data-cards-border-color-1=VALUE` | Sets the first card border color |
| `data-cards-padding=VALUE` | Overrides card padding |
| `data-cards-padding-mobile=VALUE` | Overrides card padding on mobile |
| `data-padding=VALUE` | Legacy alias of `data-cards-padding` |
| `data-color=VALUE` | Legacy alias of `data-cards-color` |
| `data-color-1=VALUE` | Legacy alias of `data-cards-color-1` |
| `data-border-color-1=VALUE` | Legacy alias of `data-cards-border-color-1` |

Continue numbered attributes with `-2`, `-3`, and so on.

## Verify

1. Publish or refresh the page.
2. Confirm every child appears as a separate card.
3. Resize to mobile and confirm the cards stack correctly.

If nothing changes, confirm the parent container has `data-cards`.

## Design

Set the container background in Carrd, or override per-card colors with `data-cards-color*`.

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-card-border-radius: 0;
  --theme-card-padding: 2rem;
  --theme-card-padding-mobile: 1rem;
}
</style>
```
