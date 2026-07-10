# Grid Cluster 2

Experimental replacement for Grid Cluster. It groups consecutive Carrd containers into one responsive CSS Grid with a dynamic `1–6` track count and an independent span for every item; it remains separate from `grid-cluster`, outside `theme-runtime`, and inline-only while the new contract is tested.

## Carrd Setup

1. Place the containers next to each other with no unrelated element between them.
2. Add the same group name to every container, for example `data-grid-2=features`.
3. On the first container, set the row capacity with `data-grid-2-cols=3`.
4. On every container, set the occupied tracks with `data-grid-2-span=1`.

Equal three-column example:

```text
data-grid-2=features
data-grid-2-cols=3
data-grid-2-span=1

data-grid-2=features
data-grid-2-span=1

data-grid-2=features
data-grid-2-span=1
```

The first container owns group-level controls. Every container owns its own span.

### Responsive Layout

| Attribute | Owner | Result |
|---|---|---|
| `data-grid-2-cols=2` | First container | Track count from 737px; defaults to `1` |
| `data-grid-2-cols-sm=2` | First container | Track count through 736px; defaults to `1` |
| `data-grid-2-cols-lg=6` | First container | Track count from 1280px; defaults to `data-grid-2-cols` |
| `data-grid-2-span=1` | Every container | Occupied default tracks; defaults to `1` |
| `data-grid-2-span-sm=1` | Every container | Occupied mobile tracks; defaults to `1` |
| `data-grid-2-span-lg=4` | Every container | Occupied large tracks; defaults to `data-grid-2-span` |

Values must be whole numbers from `1` through `6`. A span larger than the active track count is limited to the full row.

Example: two equal columns on mobile/default, then one long and two short items on large screens.

```text
data-grid-2=features
data-grid-2-cols=2
data-grid-2-cols-sm=2
data-grid-2-cols-lg=6
data-grid-2-span=1
data-grid-2-span-sm=1
data-grid-2-span-lg=4

data-grid-2=features
data-grid-2-span=1
data-grid-2-span-sm=1
data-grid-2-span-lg=1

data-grid-2=features
data-grid-2-span=1
data-grid-2-span-sm=1
data-grid-2-span-lg=1
```

### Spacing And Alignment

Add these only to the first container:

| Attribute | Result |
|---|---|
| `data-grid-2-gap=1.5` | Sets row and column gap in rem |
| `data-grid-2-gap-mobile=0.75` | Overrides both gaps through 736px |
| `data-grid-2-justify=true` | Stretches Carrd container contents edge to edge |

## Configuration

To disable the experimental plugin, add this in `Body End` above its script:

```html
<script>
window.CarrdPluginOptions = {
  gridCluster2: {
    enabled: false
  }
};
</script>
```

## Verify

1. Install Grid Cluster 2 separately; the existing Grid Cluster may remain installed.
2. Use only `data-grid-2*` attributes on the experimental fixture.
3. Check widths below 737px, from 737px, and from 1280px.
4. Confirm items wrap when their spans exceed the remaining row capacity.

If the grid does not initialize, confirm every container has the same non-empty `data-grid-2` name and directly follows the previous container.

## Design

Override Grid Cluster 2 tokens in a separate `Head` style embed:

```html
<style>
:root {
  --theme-grid-2-column-gap: 1rem;
  --theme-grid-2-column-gap-sm: 0.5rem;
  --theme-grid-2-column-gap-desktop: 1.5rem;
  --theme-grid-2-column-gap-desktop-large: 2rem;
  --theme-grid-2-row-gap: 1rem;
  --theme-grid-2-row-gap-desktop: 2rem;
}
</style>
```
