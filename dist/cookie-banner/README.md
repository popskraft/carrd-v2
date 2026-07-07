# Cookie Banner

Shows a fixed consent banner and remembers the visitor's choice.

Version: `2.0.0`

## Install

Choose one method.

### Bundle Add-on (recommended when the bundle is installed)

`theme-core` does not include this plugin.

1. Install `theme-core` from the [root guide](../README.md).
2. Open `cookie-banner-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `cookie-banner-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `cookie-banner-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Add a **Container** for the banner.
2. Add `data-cookie=consent` to the container.
3. Add the policy text and an accept button inside it.
4. Use a Carrd **Buttons** element or add `role=button` to the accept link.
5. Style the container in Carrd.

## Configuration

Use these optional attributes on the banner container:

| Attribute | Example | Result |
|---|---|---|
| `data-cookie-position` | `bottom-right` | Sets `bottom-left` or `bottom-right` |
| `data-cookie-delay` | `1000` | Delays display in milliseconds |
| `data-cookie-days` | `10` | Sets consent lifetime in days |
| `data-cookie-indent` | `0-1` | Sets desktop viewport offsets in rem |
| `data-cookie-indent-mobile` | `1` | Sets mobile viewport offsets in rem |

To change shared runtime values, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  cookieBanner: {
    cookieName: 'cookies_accepted',
    fadeInDuration: 400,
    fadeOutDuration: 300
  }
};
</script>
```

## Verify

1. Publish and open the page in a private window.
2. Confirm the banner appears.
3. Accept, refresh, and confirm it stays hidden.

If the button does not work, use a **Buttons** element or add `role=button`.
