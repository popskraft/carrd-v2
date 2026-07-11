# Design Palette

Renders a compact color-token palette on the page so the active Carrd theme colors can be inspected visually.

## Carrd Setup

Use this as a temporary visual helper while designing a page.

1. Add a visible **Embed** element where the palette should appear.
2. Paste the inline embed code into that element. It already includes the `<div data-design-palette></div>` target, so the palette renders in that exact spot.
3. Publish and refresh.

## Configuration

Defaults show the global color tokens from `theme-design-tokens.css`. To change the title or token list, add this above the plugin:

```html
<script>
window.CarrdPluginOptions = {
  designPalette: {
    title: 'Project palette',
    tokens: [
      '--theme-color-primary',
      '--theme-color-heading',
      '--theme-color-surface'
    ]
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `enabled` | `true` | Set `false` to turn the palette off |
| `title` | `'Design palette'` | Heading shown above the swatches |
| `tokens` | built-in color-token list | Custom token list or grouped token list |
| `targetSelector` | `'[data-design-palette]'` | Selector for visible target elements |
| `showEmpty` | `false` | Show unresolved tokens instead of skipping them |

## Verify

1. Publish and open the page.
2. Confirm the palette appears where the embed was placed.
3. Check that each swatch shows the token name and resolved color value.

If the palette is empty, confirm the theme token embed is installed before this plugin.

## API

`window.CarrdDesignPalette.refresh()` re-renders the palette. `window.CarrdDesignPalette.getTokens()` returns the active token groups.
