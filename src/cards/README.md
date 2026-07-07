# Cards

Turns each child of a marked Carrd container into a styled card.

## Carrd Setup

1. Add a **Container** and place the card items inside it.
2. Add `data-cards=pricing` to the container.
3. Set the container padding, background, border, radius, and shadow in Carrd.

The plugin copies those styles to every card item. Each marked container works independently.

## Configuration

No JavaScript configuration is required.

Optional container attributes:

| Attribute | Result |
|---|---|
| `data-cards-color=VALUE` | Sets every card background |
| `data-cards-color-1=VALUE` | Sets the first card background |
| `data-cards-border-color-1=VALUE` | Sets the first card border color |
| `data-cards-padding=VALUE` | Overrides card padding |

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
