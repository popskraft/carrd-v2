# Slider

Native CSS scroll-snap slider — turns consecutive Carrd containers into a
touch/trackpad/mouse carousel using the browser's own scroll physics instead
of a hand-rolled drag/transform loop. Evaluate via `demo.html` first if you
like; see `docs/specs/slider-v2-plan.md` for the full spec, design history,
and open-question log (kept under its original filename for continuity).

Version: `2.0.0`

## Install

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
4. All configuration goes on the **first** container of the cluster only —
   attributes on later slides are ignored. There is no JS options object
   (no `window.CarrdPluginOptions`).

## Configuration

| Attribute | Values | Default | Result |
|---|---|---|---|
| `data-slider-mode` | `free` \| `center` | `free` | `free` scrolls with native momentum and no snapping; `center` snaps every slide to the middle of the frame. |
| `data-slider-spv` | 1–3 numbers, decimals allowed: `"1.2 3 4"` | `"1.2 3 4"` | Slides per view for mobile / ≥737px / ≥1280px. |
| `data-slider-gap` | 1–3 numbers in px: `"12 16 24"` | `"16"` | Gap between slides at the same breakpoints. |
| `data-slider-autoplay` | milliseconds, e.g. `"5000"` | off | Advances slides automatically. Disabled entirely under `prefers-reduced-motion: reduce`. |
| `data-slider-dots` | `on` \| `off` | `on` | Pagination dots in both modes. |
| `data-slider-arrows` | `on` \| `off` | `on` | Prev/next arrows (hidden below 737px by default). |
| `data-slider-arrows-mobile` | `on` \| `off` | `off` | Set to `on` to keep prev/next arrows visible below 737px too, instead of the default mobile hide. Has no effect if `data-slider-arrows="off"`. |

Triplet parsing for `spv`/`gap`: one value applies to all three breakpoints,
two values map to mobile + (≥737px and ≥1280px), three values give each
breakpoint its own number. `737` and `1280` are fixed module constants, not
configurable. An invalid value falls back to the default and logs a single
`console.warn('[slider] ...')` per instance — it never throws.

```html
<div data-slider="gallery" data-slider-spv="1 2.5 3" data-slider-gap="12 16 24">…</div>
<div data-slider="gallery">…</div>
<div data-slider="gallery">…</div>
```

### Center-mode edge behavior

There is no inline padding on the scroller. The first slide sits flush
against the left edge and the last slide flush against the right edge;
only the slides in between get centered. This is intentional (native
`scroll-snap-align: center` clamps at the scroll boundaries).

## Verify

1. Open `demo.html` directly in a browser (no build step needed).
2. Touch/trackpad: native inertia, slides fix to center, you can't flick past
   more than one slide per gesture.
3. Mouse: drag works, cursor shows grab/grabbing, a link click is suppressed
   right after a drag but fires normally on a plain click.
4. First/last slide sit flush at the edges; slides in between show a gap on
   both sides.
5. `free` mode: inertia is smooth, no jump on release, and it stops without
   snapping back.
6. Arrows disable at the first/last slide; dots are clickable; ArrowLeft/
   ArrowRight move the slider when it has focus.
7. Resize across the 737/1280 breakpoints and confirm widths recompute
   without a position jump.
8. Safari (no native `scrollend`): dots still sync, via the debounced
   `scroll` fallback.

## Design

Uses the `--theme-slider-*` custom properties, so dots/arrows are themeable
out of the box. Override them in a `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-slider-dot-active-bg: currentColor;
  --theme-slider-arrow-bg: white;
}
</style>
```

## Troubleshooting

If nothing moves, confirm all slides are consecutive and share the same
`data-slider` value. If a numeric attribute (`spv`, `gap`, `autoplay`) is
ignored, check the browser console for a `[slider]` warning — invalid
values fall back to the default rather than breaking the slider.

This engine replaced the earlier hand-rolled drag/transform implementation
(archived at `docs/_archive/slider-v1-source/`) once the owner accepted its
mechanics and it was promoted to the sole `slider` plugin. See
`docs/specs/slider-v2-plan.md` for that decision history and
`OPEN-QUESTIONS.md`'s "Решённые" section (Q012/Q013/Q014) for the closing notes.
