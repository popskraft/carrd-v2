# Grid Cluster

Groups consecutive Carrd containers into one responsive CSS Grid with a dynamic `1–6` track count and an independent span for every item.

Version: `2.0.0`

## Install

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `grid-cluster-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Place the containers next to each other with no unrelated element between them.
2. Add the same group name to every container, for example `data-grid=features`.
3. On the first container, set the row capacity with `data-grid-cols=3`.
4. Add `data-grid-span*` only when a specific container must occupy more than one track.

Equal three-column example:

```text
data-grid=features
data-grid-cols=3

data-grid=features

data-grid=features
```

For an equal grid, this is enough: the first container defines `data-grid-cols*`, and every next container may use only `data-grid=<name>`. Each item defaults to `span = 1`, so equal cards do not need `data-grid-span*`.

The first container owns group-level controls. Every container owns its own span only when an item needs a custom width.

### Responsive Layout

| Attribute | Owner | Result |
|---|---|---|
| `data-grid-cols=2` | First container | Track count from 737px; defaults to `1` |
| `data-grid-cols-sm=2` | First container | Track count through 736px; defaults to `1` |
| `data-grid-cols-lg=6` | First container | Track count from 1280px; defaults to `data-grid-cols` |
| `data-grid-span=1` | Every container | Occupied default tracks; defaults to `1` |
| `data-grid-span-sm=1` | Every container | Occupied mobile tracks; defaults to `1` |
| `data-grid-span-lg=4` | Every container | Occupied large tracks; defaults to `data-grid-span` |

Values must be whole numbers from `1` through `6`. A span larger than the active track count is limited to the full row.

Example: two equal columns on mobile/default, then one long and two short items on large screens.

```text
data-grid=features
data-grid-cols=2
data-grid-cols-sm=2
data-grid-cols-lg=6
data-grid-span=1
data-grid-span-sm=1
data-grid-span-lg=4

data-grid=features

data-grid=features
```

### When You Need Extra Attributes

Use only `data-grid-cols*` when every item has the same width inside the row.

Example: equal 2 / 2 / 4 grid. Only the first container needs column settings.

```text
1st container
data-grid=features
data-grid-cols=2
data-grid-cols-sm=2
data-grid-cols-lg=4

2nd container
data-grid=features

3rd container
data-grid=features

4th container
data-grid=features
```

Add `data-grid-span*` when one item must be wider or narrower than the others.

Example: on large screens one long card plus two short cards.

```text
1st container
data-grid=features
data-grid-cols=2
data-grid-cols-sm=2
data-grid-cols-lg=6
data-grid-span-lg=4

2nd container
data-grid=features

3rd container
data-grid=features
```

Add `data-grid-gap*` when the spacing between items must differ from the defaults.

```text
1st container
data-grid=features
data-grid-cols=3
data-grid-gap=1.5
data-grid-gap-mobile=0.75
```

Add `data-grid-justify=true` when Carrd container content must stretch edge to edge inside each grid cell.

```text
1st container
data-grid=features
data-grid-cols=2
data-grid-justify=true
```

### Spacing And Alignment

Add these only to the first container:

| Attribute | Result |
|---|---|
| `data-grid-gap=1.5` | Sets row and column gap in rem |
| `data-grid-gap-mobile=0.75` | Overrides both gaps through 736px |
| `data-grid-justify=true` | Stretches Carrd container contents edge to edge |

## Configuration

To disable the plugin, add this in `Body End` above its script:

```html
<script>
window.CarrdPluginOptions = {
  gridCluster: {
    enabled: false
  }
};
</script>
```

## Verify

1. Publish or refresh the page.
2. Confirm the containers form the requested number of columns.
3. Check widths below 737px, from 737px, and from 1280px.
4. Confirm items wrap when their spans exceed the remaining row capacity.

If the grid does not initialize, confirm every container has the same non-empty `data-grid` name and directly follows the previous container.

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
