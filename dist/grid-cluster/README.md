# Grid Cluster

Groups consecutive Carrd containers into one responsive CSS grid.

Version: `2.0.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-core` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `grid-cluster-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `grid-cluster-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Place the containers next to each other with no unrelated element between them.
2. Add the same group name to each container, for example `data-grid=features`.
3. Add `data-grid-columns=3` to the first container.

The first container controls the whole cluster.

## Configuration

Add responsive and spacing controls to the first container:

| Attribute | Result |
|---|---|
| `data-grid-sm=2` | Sets mobile columns |
| `data-grid-md=3` | Sets tablet columns |
| `data-grid-lg=5` | Sets large desktop columns |
| `data-grid-gap=1.5` | Sets the cluster gap in rem |
| `data-grid-gap-mobile=0.75` | Overrides the mobile gap |
| `data-grid-justify=true` | Stretches the cluster edge to edge |

Use `data-grid-width=50%` on an individual item when it needs a custom desktop width.

## Verify

1. Publish or refresh the page.
2. Confirm the containers form the requested number of columns.
3. Resize through mobile and desktop widths.

If the grid stays single-column, confirm the containers are consecutive and share the same `data-grid` value.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-grid-column-gap: 1rem;
  --theme-grid-column-gap-sm: 0.5rem;
  --theme-grid-column-gap-desktop: 1.5rem;
  --theme-grid-column-gap-desktop-large: 2rem;
  --theme-grid-row-gap: 1rem;
  --theme-grid-row-gap-desktop: 2rem;
}
</style>
```
