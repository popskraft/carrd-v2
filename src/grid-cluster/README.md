# Grid Cluster

Groups consecutive Carrd containers into one responsive CSS grid.

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

`data-gap` and `data-gap-mobile` are accepted as legacy aliases of `data-grid-gap` and `data-grid-gap-mobile`.

Use `data-grid-width=50%` on an individual item when it needs a custom desktop width.

To change the grouping attribute or the built-in width shorthands, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  gridCluster: {
    enabled: true,
    gridAttribute: 'data-grid',
    widthClasses: {
      'w-33': '33%'
    }
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `enabled` | `true` | Set `false` to disable the plugin globally |
| `gridAttribute` | `'data-grid'` | Attribute name used to group containers into a cluster |
| `gridClasses` | `['grid-2', 'grid-3', 'grid-4', 'grid-5', 'grid-6']` | Class names recognized as a column-count shorthand |
| `widthClasses` | `{ 'w-20': '20%', ..., 'w-80': '80%' }` | Map of width shorthand classes to percentage values; merged with, not replacing, the defaults |

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
