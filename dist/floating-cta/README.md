# Floating Cta

Clones marked Carrd elements into fixed CTAs that appear after scrolling.

Version: `2.0.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-runtime` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `floating-cta-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `floating-cta-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Create the CTA element in Carrd.
2. Add `data-floating=contact`.
3. Add `data-floating-position=bottom-right`.
4. Repeat with another name for each independent CTA.

Supported positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, and `bottom-right`.

Optional attributes:

| Attribute | Result |
|---|---|
| `data-floating-position-mobile=bottom-center` | Changes the mobile position |
| `data-floating-hide=mobile` | Hides the floating copy on mobile |
| `data-floating-hide=desktop` | Hides the floating copy on desktop |

## Configuration

Defaults show each floating copy after `800px`. To change that, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  floatingCta: {
    scrollY: 800,
    defaultPosition: 'bottom-right'
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `scrollY` | `800` | Scroll distance in px before a copy appears |
| `defaultPosition` | `'bottom-right'` | Global default position |
| `selector` | `'[data-floating]'` | Attribute selector used to find source elements |
| `breakpoint` | `736` | Viewport width, in px, used to tell mobile from desktop |
| `showOnMobile` | `true` | Set `false` to hide every floating copy on mobile |
| `showOnDesktop` | `true` | Set `false` to hide every floating copy on desktop |

## Verify

1. Publish the page.
2. Scroll past the configured threshold.
3. Confirm the original element stays in place and its fixed copy appears.

If no copy appears, check `data-floating`, the scroll distance, and any `data-floating-hide` value.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-floating-cta-edge: 1.25rem;
  --theme-floating-cta-mobile-edge: 1rem;
  --theme-floating-cta-z-index: 99999;
  --theme-floating-cta-offset: 24px;
  --theme-floating-cta-fade-duration: 0.3s;
  --theme-floating-cta-move-duration: 0.45s;
}
</style>
```
