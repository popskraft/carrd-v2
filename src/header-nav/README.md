# Header Nav

Adds a mobile hamburger for selected elements inside Carrd's header.

## Carrd Setup

1. Build the header inside the `#header` section.
2. Add class `header-mobile-hide` to every element that should hide behind the hamburger.
3. Leave always-visible elements, such as the logo, without that class.

No wrapper or sticky-header class is required.
Legacy class `header-mobile-el-collapsing` still works, but use `header-mobile-hide` for new markup.

### Hamburger cell (optional)

By default the hamburger is placed in the header's first cell. If your logo is
not in the first cell (for example: links, logo, buttons), give the logo
component the ID `header-primary-section` (in Carrd: select the element →
settings → ID). The hamburger then lands in the same cell as the logo. The
cells around it, if they contain only `header-mobile-hide` elements, collapse
away on mobile as usual.

```html
<div id="header-primary-section" class="image-component">
```

Carrd strips custom `data-*` attributes from components but keeps the ID, which
is why the marker is an ID. If no element has this ID, the first cell is used as
before.

## Configuration

Defaults use a `736px` mobile breakpoint. To change it, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  headerNav: {
    breakpoint: 736,
    closeOnLinkClick: true
  }
};
</script>
```

## Verify

1. Publish and resize below the breakpoint.
2. Confirm the hamburger appears and marked elements are hidden immediately.
3. Open the menu, click a link, and press `Escape` to check close behavior.
4. Resize above the breakpoint and confirm the full header returns.

If inactive, confirm `#header` contains at least one `.header-mobile-hide` element.

## Advanced: fixed / sticky header

Pin the header while scrolling by adding `data-header-position` to the header container (`#header > .container-component`), or to `#header` itself:

- `data-header-position="fixed"` — the whole header pins to the top of the viewport from first paint and stays there.
- `data-header-position="sticky"` — the header scrolls up until the container that carries the attribute reaches the top, then pins. Rows above it (for example a topnav) scroll away first.

The header stays in normal flow (it uses `position: sticky` internally), so it reserves its own space — content does not jump — and each container width mode keeps its width: `max` (no class), `full` (Edge to Edge), and `full screen` (Full bleed) all work. No spacer element is needed. In-page anchor links are offset automatically so targets are not hidden behind the bar.

Optional design tokens:

```html
<style>
:root {
  --theme-header-nav-fixed-offset: 0rem;   /* gap from the top edge; default 0 */
  --theme-header-nav-fixed-z-index: 9000;
  --theme-header-nav-fixed-shadow: 0 2px 10px rgba(0,0,0,0.15);
}
</style>
```

`--theme-header-nav-fixed-offset` pushes the pinned bar down from the top edge (any CSS length, default `0`) and is added to the anchor scroll offset automatically. It applies to both `fixed` and `sticky`.

For a per-header override, add `data-header-nav-fixed-offset` next to `data-header-position` (a bare number is read as rem; a value with a unit is used as-is):

```html
<div class="container-component" data-header-position="fixed" data-header-nav-fixed-offset="1">
```

Give the header container a solid or semi-opaque background in Carrd; a fully transparent pinned bar lets content show through.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-header-nav-toggle-position: fixed;
  --theme-header-nav-toggle-top: 1rem;
  --theme-header-nav-toggle-right: 1rem;
  --theme-header-nav-toggle-size: 46px;
  --theme-header-nav-toggle-radius: 0.5rem;
  --theme-header-nav-toggle-bg: rgba(255, 255, 255, 0.2);
  --theme-header-nav-toggle-backdrop: blur(10px);
  --theme-header-nav-toggle-z-index: 100000;
  --theme-header-nav-toggle-outline: 2px solid var(--theme-focus-ring-color);
  --theme-header-nav-toggle-outline-offset: 2px;
  --theme-header-nav-bar-gap: 5px;
  --theme-header-nav-bar-width: 22px;
  --theme-header-nav-bar-height: 2px;
  --theme-header-nav-bar-color: currentColor;
  --theme-header-nav-bar-radius: 999px;
  --theme-header-nav-duration: 300ms;
}
</style>
```

### Hamburger vertical position

The toggle's vertical position depends on whether the header is pinned:

- **Normal header** — the toggle is fixed to the top-right of the viewport at `--theme-header-nav-toggle-top` (default `1rem`). This stays correct when the header scrolls off-screen.
- **Fixed / sticky header** (`data-header-position="fixed"` or `"sticky"`) — the toggle is pinned together with the header, so it instead centers vertically on the primary (logo) row and stays roughly centered as the logo height changes.

Per-header tuning uses the same attribute, `data-header-nav-toggle-top`, on the header container (`#header > .container-component`) or on `#header` itself. A bare number is read as rem; a value with a unit is used as-is:

```html
<div class="container-component" data-header-nav-toggle-top="2">
```

Its meaning follows the mode: on a normal header it is the distance from the viewport top (default `1rem`); on a fixed/sticky header it is a `+`/`-` nudge from the center (default `0`, so positive moves down and negative moves up).

## Troubleshooting

Avoid background blur on the authored header container when using the default fixed hamburger. Blur can make the toggle scroll with the header instead of staying fixed to the viewport.
