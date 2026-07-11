# Header Nav

Adds a mobile hamburger for selected elements inside Carrd's header.

Version: `2.0.0`

## Install

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `header-nav-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Build the header inside the `#header` section.
2. Add class `header-mobile-hide` to every element that should hide behind the hamburger.
3. Leave always-visible elements, such as the logo, without that class.

No wrapper or sticky-header class is required.
Legacy class `header-mobile-el-collapsing` still works, but use `header-mobile-hide` for new markup.

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

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-header-nav-toggle-top: 1rem;
  --theme-header-nav-toggle-right: 1rem;
  --theme-header-nav-toggle-size: 46px;
  --theme-header-nav-toggle-bg: rgba(255, 255, 255, 0.2);
  --theme-header-nav-bar-color: currentColor;
  --theme-header-nav-duration: 300ms;
}
</style>
```

## Troubleshooting

Avoid background blur on the authored header container when using the default fixed hamburger. Blur can make the toggle scroll with the header instead of staying fixed to the viewport.
