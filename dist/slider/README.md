# Slider

Turns consecutive Carrd containers into a responsive touch slider.

Version: `2.0.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-runtime` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `slider-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `slider-embed-part1.html` and `slider-embed-part2.html`.
3. Add two `Code → Hidden → Body End` embeds.
4. Paste part 1 into the first embed and part 2 into the second.
5. Keep that order, publish, and refresh.

## Carrd Setup

1. Add at least two **Container** elements with no unrelated block between them.
2. Add the same name to each container, for example `data-slider=gallery`.
3. Use a different name for each independent slider.

## Configuration

Defaults enable arrows and dots with one visible slide. Add this in `Body End` above the bundle or plugin script to change behavior:

```html
<script>
window.CarrdPluginOptions = {
  slider: {
    autoplay: true,
    autoplayInterval: 5000,
    gap: 16,
    breakpoints: {
      737: { slidesPerView: 2 },
      1280: { slidesPerView: 3, peek: 0 }
    }
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `showDots` | `true` | Shows pagination dots |
| `showArrows` | `true` | Shows prev/next arrows |
| `slidesPerView` | `1` | Number of slides visible at once |
| `gap` | `16` | Space between slides in px |
| `peek` | `0.1` | Fraction of the next slide visible at the edge |
| `loop` | `false` | Wraps navigation from the last slide back to the first |
| `autoplay` | `false` | Advances slides automatically |
| `autoplayInterval` | `5000` | Delay between autoplay advances, in milliseconds |
| `hideOverflow` | `false` | Clips slides outside the visible track |
| `freeScroll` | `false` | Keeps inertia after release instead of snapping to a slide |
| `wheelScroll` | `false` | Enables horizontal wheel/shift-wheel scrolling |
| `snapThreshold` | `0.3` | Fraction of slide width a drag must cross before it snaps to the next slide |
| `maxSlideWidth` | `400` | Maximum slide width in px |
| `equalHeight` | `true` | Equalizes slide heights to the tallest slide |
| `slideSelector` | `'[data-slider]'` | Selector used to find slide containers |
| `sliderAttribute` | `'data-slider'` | Attribute name used to group slides into one slider |
| `breakpoints` | `{ 737: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } }` | Viewport-width keyed overrides, merged with the defaults |

For one slider only, use its `data-slider` name under `instances`:

```javascript
instances: {
  reviews: { showArrows: false, slidesPerView: 2 }
}
```

## Verify

1. Publish or refresh the page.
2. Swipe on mobile and drag on desktop.
3. Confirm arrows, dots, autoplay, and breakpoints match your configuration.

If it does not move, confirm all slides are consecutive and use the same `data-slider` value.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-slider-dot-size: 8px;
  --theme-slider-dot-active-bg: currentColor;
  --theme-slider-arrow-size: 2.5rem;
  --theme-slider-arrow-bg: white;
  --theme-slider-arrow-color: currentColor;
}
</style>
```

## Troubleshooting

Place `window.CarrdPluginOptions` above the plugin script. The `instances` key must exactly match the `data-slider` value.
