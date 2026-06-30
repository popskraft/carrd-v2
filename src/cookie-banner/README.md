# Cookie Banner

Shows a fixed cookie consent banner and remembers the visitor's choice. The banner hides automatically once accepted.

No coding required. Add one data attribute to a container and style it like any other Carrd block.

---

## What You Do in Carrd

1. Add a **Container** element for the banner.
2. Open its attributes panel and add `data-cookie="consent"` or another simple name.
3. Add your cookie policy text inside the container.
4. Add an accept link or button inside the container.
5. To make the accept button reliable, open the link's settings and add a custom attribute `role=button` — or use a Carrd **Buttons** element.
6. Style the container like any other Carrd block.

### Optional data attributes

Use these on the same container when you need custom viewport offsets:

```html
data-cookie-indent="1"
data-cookie-indent="0-1"
data-cookie-indent="1-0"
```

- `1` → `1rem` from all sides
- `0-1` → `0rem` top/bottom, `1rem` left/right
- `1-0` → `1rem` top/bottom, `0rem` left/right

Mobile-only override:

```html
data-cookie-indent-mobile="1"
data-cookie-indent-mobile="0-1"
data-cookie-indent-mobile="1-0"
```

Optional behavior overrides on the same banner:

```html
data-cookie-delay="1000"
data-cookie-days="10"
data-cookie-position="bottom-left"
data-cookie-position="bottom-right"
```

- `data-cookie-delay` controls show delay in milliseconds for that banner
- `data-cookie-days` controls consent lifetime in days; when multiple banners exist, the clicked banner defines the stored cookie lifetime
- `data-cookie-position` overrides the banner position for that element; default is `bottom-left`

---

## How It Works in Carrd

- Every container with `data-cookie="..."` becomes one banner instance.
- The same consent cookie is shared across all banner instances on the page.
- Clicking the accept control hides every matching banner until the cookie expires.
- New setups should use a named marker such as `data-cookie="consent"` instead of the literal legacy value `banner`.

The plugin can initialize multiple `data-cookie="..."` elements on one page. They share the same consent cookie and all hide once the visitor accepts.

---

## How To Check That It Works

1. Publish the page.
2. Open it in a private or incognito window.
3. Confirm the banner appears in the configured corner.
4. Click Accept.
5. Refresh the page — the banner should stay hidden.

---

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed only if you want to change shared runtime behavior:

```html
<script>
window.CarrdPluginOptions = {
    cookieBanner: {
        cookieName: "cookies_accepted",
        fadeInDuration: 400,
        fadeOutDuration: 300
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptions` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `fadeInDuration` | `400` | Fade-in animation time in ms |
| `fadeOutDuration` | `300` | Fade-out animation time in ms |
| `cookieName` | `cookies_accepted` | Cookie name used to store consent |

`data-cookie-delay`, `data-cookie-days`, and `data-cookie-position` are the preferred per-banner controls.

Legacy `data-cookie="banner"`, `.cookie-banner`, and `#cookie-baner` targeting still work as fallback for older pages, but new setups should use a named `data-cookie="..."` marker.
