# Floating Cta

Clones marked Carrd elements into fixed CTAs that appear after scrolling.

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
