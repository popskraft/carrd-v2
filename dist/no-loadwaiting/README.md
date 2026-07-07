# No Loadwaiting

Removes Carrd's loading delay so page content appears immediately.

Version: `2.1.0`

## Install

Choose one method.

### Bundle Add-on (recommended when the bundle is installed)

`theme-runtime` does not include this plugin.

1. Install `theme-runtime` from the [root guide](../README.md).
2. Open `no-loadwaiting-cdn.html`.
3. Paste the marked block into `Hidden → Head`.
4. Publish and refresh.

### CDN Individual

1. Open `no-loadwaiting-cdn.html`.
2. Paste the marked block into `Hidden → Head`.
3. Publish and refresh.

### Inline Embed

1. Open `no-loadwaiting-embed.html`.
2. Paste the full file into `Code → Hidden → Head`.
3. Publish and refresh.

## Carrd Setup

No page elements or attributes are required. Install this plugin in `Head` before other plugin scripts.

## Configuration

Defaults preserve entry animations and send resize pulses for layout-sensitive plugins. To change timing, add this in `Head` above the plugin:

```html
<script>
window.CarrdPluginOptions = {
  noLoadwaiting: {
    animationDuration: 750,
    observerTimeout: 5000,
    scrollPulseInterval: 120,
    scrollPulseCount: 2,
    rafPulseCount: 2
  }
};
</script>
```

All timing values are milliseconds except the pulse counts.

## Verify

1. Publish and open the page.
2. Confirm content appears without the usual Carrd wait.
3. Confirm entry animations and layout-dependent plugins still start.

If the loader remains, confirm the plugin is installed in `Head`.
