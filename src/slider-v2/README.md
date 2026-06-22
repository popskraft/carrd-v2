# Slider V2

Turns consecutive Carrd containers into a responsive touch slider. Supports arrows, dots, autoplay, and per-slider settings.

No coding required. Add one `data-slider-v2` name to each container that should become a slide.

---

## What You Do in Carrd

1. Add 2 or more **Container** elements that should become slides.
2. Place them one after another — no unrelated blocks between them.
3. Open each container's attributes panel and add `data-slider-v2=gallery`.

That is enough for the default slider to work.

Use a different name for each independent slider, for example `data-slider-v2=reviews` or `data-slider-v2=cases`.

---

## How It Works in Carrd

- Consecutive containers with the same `data-slider-v2` value become one slider instance.
- The instance name is also the key used for per-slider overrides in `window.CarrdPluginOptionsV2.slider.instances`.
- Drag, swipe, arrows, dots, autoplay, and breakpoints are all driven from that shared slider name.
- Legacy `.slider` detection remains in runtime only as a compatibility bridge.

---

## How To Check That It Works

1. Publish or refresh the page.
2. On mobile, swipe the slider left or right.
3. On desktop, drag the slider with the mouse.
4. If arrows and dots are enabled, check that they appear and can be clicked.

If nothing moves, the most common reason is that one of the intended slides is missing the matching `data-slider-v2` value or the containers are not consecutive.

---

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed if you want to change default behavior:

```html
<script>
window.CarrdPluginOptionsV2 = {
    slider: {
        autoplay: true,
        breakpoints: {
            737: { slidesPerView: 2 },
            1280: { slidesPerView: 3 }
        }
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptionsV2` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `showDots` | `true` | Shows dot navigation |
| `showArrows` | `true` | Shows previous/next arrows |
| `slideSelector` | `[data-slider-v2], .slider` | Selector used to collect consecutive slide containers |
| `sliderAttribute` | `data-slider-v2` | Attribute used to group v2 slider instances |
| `slidesPerView` | `1` | Base number of visible slides |
| `gap` | `16` | Space between slides in px |
| `peek` | `0.1` | Shows part of the next slide |
| `maxSlideWidth` | `400` | Maximum desktop width for one slide in px |
| `equalHeight` | `true` | Stretches slide wrappers to the same height |
| `loop` | `false` | Returns to the first slide after the last |
| `autoplay` | `false` | Auto-advances slides |
| `autoplayInterval` | `5000` | Delay between autoplay moves in ms |
| `snapThreshold` | `0.3` | Drag distance as a fraction of one slide before snapping forward/back |
| `hideOverflow` | `false` | Clips content outside the slider area |
| `freeScroll` | `false` | Keeps inertial free scrolling instead of snapping to the nearest slide |
| `wheelScroll` | `false` | Lets horizontal trackpad gestures move the slider |
| `breakpoints` | `{}` | Changes settings at larger screen widths |
| `instances` | `{}` | Per-slider overrides using `data-slider-v2` names |

---

## Advanced: Per-Slider Settings

If one slider needs different behavior, use the `data-slider-v2` name as the instance key:

`data-slider-v2=reviews`

Then configure it in `instances`:

```html
<script>
window.CarrdPluginOptionsV2 = {
    slider: {
        instances: {
            reviews: {
                showArrows: false,
                breakpoints: {
                    737: { slidesPerView: 2 },
                    1280: { slidesPerView: 3 }
                }
            }
        }
    }
};
</script>
```

### Breakpoints

Use a full config block when the same slider should show more slides on larger screens:

```html
<script>
window.CarrdPluginOptionsV2 = {
    slider: {
        breakpoints: {
            737: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4, peek: 0 }
        }
    }
};
</script>
```

Breakpoint keys are minimum screen widths in px. `peek: 0` gives a clean grid-like layout on larger screens.

---

## Design

Add a **Code** embed with a `<style>` tag to restyle arrows and dots:

```html
<style>
:root {
    --theme-slider-dot-size: 8px;
    --theme-slider-dot-bg: rgba(0,0,0,0.2);
    --theme-slider-dot-active-bg: currentColor;
    --theme-slider-dots-margin: 1rem;
    --theme-slider-arrow-size: 2.5rem;
    --theme-slider-arrow-bg: white;
    --theme-slider-arrow-color: currentColor;
    --theme-slider-arrow-radius: 50%;
    --theme-slider-arrow-offset: 0.5rem;
}
</style>
```

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-slider-dot-size` | UI token | Dot size |
| `--theme-slider-dot-bg` | UI token | Inactive dot color |
| `--theme-slider-dot-active-bg` | UI token | Active dot color |
| `--theme-slider-dots-margin` | `1rem` | Space between dots and slider |
| `--theme-slider-arrow-size` | UI token | Arrow button size |
| `--theme-slider-arrow-bg` | UI token | Arrow button background |
| `--theme-slider-arrow-color` | UI token | Arrow icon color |
| `--theme-slider-arrow-radius` | UI token | Arrow button corner radius |
| `--theme-slider-arrow-offset` | `0.5rem` | Arrow distance from slider edge |

---

## Troubleshooting

- Slider does not start: containers are not consecutive, or the `data-slider-v2` value is missing on one.
- Config does not apply: `window.CarrdPluginOptionsV2` was placed after the plugin embed.
- Instance settings do not work: `data-slider-v2` is missing or its value does not match `instances`.
- Slide content is cut off: try `hideOverflow: false`.
