# Switcher

Turns a Carrd Buttons element into synchronized tabs for elements or whole containers.

Version: `2.0.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-core` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `switcher-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `switcher-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

### Data Targets

1. Add `data-switcher=pricing` to a **Buttons** element.
2. Add `data-switcher-target=pricing` to each target.
3. Keep targets in button order, or add `data-switcher-index=1`, `2`, and so on.

Use the same index on several targets when one button should show them together, including full containers.

Controllers with the same `data-switcher` name stay synchronized.

## Configuration

Defaults show the first target. Add this in `Body End` above the bundle or plugin script to change it:

```html
<script>
window.CarrdPluginOptions = {
  switcher: {
    defaultIndex: 1,
    warnOnMismatch: true,
    instances: {
      pricing: { defaultIndex: 2 }
    }
  }
};
</script>
```

The `instances` key must match the `data-switcher` value.

| Option | Default | Result |
|---|---|---|
| `defaultIndex` | `1` | Default panel shown before any click |
| `warnOnMismatch` | `true` | Logs console warnings for invalid indexes or missing targets |
| `enabled` | `true` | Set `false` to disable the plugin globally |
| `controllerSelector` | `'[data-switcher]'` | Attribute selector used to find controllers |
| `scopeSelector` | `'section'` | Ancestor selector searched for matching targets |
| `targetAttribute` | `'data-switcher-target'` | Attribute name that names each target |
| `targetIndexAttribute` | `'data-switcher-index'` | Attribute name that sets an explicit target index |

## Verify

1. Publish or refresh the page.
2. Confirm the configured default target is visible.
3. Click each button and confirm only its target group is shown.
4. If two controllers share a name, confirm they stay synchronized.

If nothing switches, compare controller, target, and index values exactly.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-switcher-active-bg: #000000;
  --theme-switcher-active-color: #ffffff;
  --theme-switcher-animation-duration: 0.3s;
  --theme-switcher-animation-distance: 0.5rem;
}
</style>
```

Scope variables to `[data-switcher="pricing"]` when one controller needs different colors.

## API

```javascript
CarrdSwitcher.show('pricing', 2);
CarrdSwitcher.next('pricing');
CarrdSwitcher.prev('pricing');
CarrdSwitcher.refresh();
```

Indexes start at `1`.
