# Stacker

Turns a group of Carrd containers into scroll-stacking cards: each container pins near the top of the screen and the next one slides over it, then the whole stack scrolls away after the last card.

## Carrd Setup

1. Create two or more containers, one after another, in the same section.
2. Add `data-stacker=stack` to every container in the group.
3. Use another name (for example `data-stacker=projects`) for each independent stack on the page.

Containers in one group must follow each other directly. If the sequence is interrupted by other content, each contiguous run stacks on its own.

Optional attributes:

| Attribute | Result |
|---|---|
| `data-stacker-offset=80` | Pins cards 80px below the top of the screen (set on the first container of the group) |

The legacy attribute `data-stacked` is also accepted.

## Configuration

Defaults work without configuration: cards pin at the very top of the screen. To change behavior, add this in `Body End` above the plugin script:

```html
<script>
window.CarrdPluginOptions = {
  stacker: {
    offset: 80,
    minWidth: 737,
    instances: {
      stack: { offset: 96 }
    }
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `offset` | unset (`0px`) | Distance from the top of the screen where cards pin (px or CSS length) |
| `minWidth` | `0` | Below this viewport width the stack falls back to normal scrolling |
| `enabled` | `true` | Set `false` to turn the plugin off |
| `zIndexBase` | `2` | Starting `z-index` for the first stacked item |
| `warnOnMismatch` | `true` | Logs console warnings for invalid offsets or group names |
| `overflowFixSelector` | `'.site-wrapper'` | Ancestor selector patched to allow the stack to overflow it |
| `attribute` | `'data-stacker'` | Attribute name used to group containers into a stack |
| `legacyAttribute` | `'data-stacked'` | Legacy alias of `attribute` |
| `offsetAttribute` | `'data-stacker-offset'` | Attribute name read for the per-group pin offset |

## Verify

1. Publish the page.
2. Scroll through the group: the first card stops at the top and the next card covers it.
3. After the last card, the whole group scrolls up normally.

If cards do not pin, check that every container has the same `data-stacker` name and that the containers directly follow each other.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-stacker-offset: 0px;
}
</style>
```

## API

`window.CarrdStacker.refresh()` re-scans the page for new groups. `window.CarrdStacker.getGroups()` returns the active group wrappers.
