# Slider

Turns consecutive Carrd containers into a responsive touch slider.

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

Never install this plugin and `slider-v2` on the same page. They intentionally share the same public surface — `data-slider` clustering, the `window.CarrdSlider` global, and the `.theme-slider-*` classes — because `slider-v2` is meant to replace this plugin outright, not run alongside it. Loading both scripts means the second one to run silently overwrites `window.CarrdSlider`, and their CSS rules for the same class names actively conflict.
