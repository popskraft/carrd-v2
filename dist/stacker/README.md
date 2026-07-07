# Stacker

Turns a group of Carrd containers into scroll-stacking cards: each container pins near the top of the screen and the next one slides over it, then the whole stack scrolls away after the last card.

Version: `2.0.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-core` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `stacker-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `stacker-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

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
