# Floating Cta V2

## Version

- Version: `0.1.22`
- Build date (UTC): `2026-06-22`

## Installation

### CDN Bundle (recommended)

If your site already has the CDN embeds installed (`theme-core-v2.min.css` in Head and `theme-core-v2.min.js` in Body End), this plugin is already active — no extra steps needed.

To install CDN embeds: see the root `README.md` → **CDN Bundle** section.

### CDN Individual (single plugin)

Use this when you want jsDelivr links for selected plugins instead of the full bundle.

**Step 1 — Install shared theme header (once per site)**

In Carrd add `Embed → Code → Hidden → Head` and paste:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-design-tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-ui.css">
```

**Step 2 — Install this plugin through CDN**

1. Open `floating-cta-v2-cdn.html` from this folder.
2. Paste the `<!-- Head -->` part into `Hidden → Head`.
3. Paste the `<!-- Body End -->` part into `Hidden → Body End` when present.
4. Publish the page and refresh.

### Inline Embed (single plugin)

Use this when installing only selected plugins without the CDN bundle.

**Step 1 — Install theme header (once per site)**

1. Open `theme-design-system.html` from the `dist/` folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Head` and paste.

**Step 2 — Install this plugin**

1. Open `floating-cta-v2-embed.html` from this folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Body End` and paste.
4. Publish the page and refresh.

## How To Change Styles

If this README contains a `:root { ... }` block later, do not paste it into the plugin code block itself.

Create a separate hidden `Head` style block below `theme-design-system.html` and place the overrides there.

Example of a separate settings block:

```html
<style>
:root {
  /* Put your overrides here */
}
</style>
```

Place that style block below `theme-design-system.html`.

---

Clones one or more Carrd elements into scroll-revealed fixed CTA overlays.

Use this plugin for CTA buttons, contact links, small menus, or promo blocks that should stay available after the visitor scrolls past a threshold.

---

## What You Do in Carrd

1. Create each CTA element in Carrd.
2. Add `data-floating-v2="contact"` or another simple name to every source element that should get a floating copy.
3. Add `data-floating-v2-position="..."` to choose the default position of that copy.
4. Optionally add `data-floating-v2-position-mobile="..."`.
5. Optionally add `data-floating-v2-hide="mobile"` or `data-floating-v2-hide="desktop"`.

```html
<a data-floating-v2="contact" data-floating-v2-position="bottom-right" href="#contact">Contact us</a>
<a data-floating-v2="pricing" data-floating-v2-position="bottom-left" data-floating-v2-position-mobile="bottom-center" href="#pricing">Pricing</a>
```

Supported positions:

| Value | Position |
|-------|----------|
| `top-left` | Top left |
| `top-center` | Top center |
| `top-right` | Top right |
| `bottom-left` | Bottom left |
| `bottom-center` | Bottom center |
| `bottom-right` | Bottom right |

If `data-floating-v2-position` is missing or invalid, the plugin uses `bottom-right`.

Viewport overrides:

| Attribute | What it does |
|-------|--------------|
| `data-floating-v2-position-mobile="..."` | Position used on mobile |

Each override accepts the same six values:
`top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.

Fallback order:
- mobile: `data-floating-v2-position-mobile` -> `data-floating-v2-position` -> `bottom-right`
- desktop and tablet: `data-floating-v2-position` -> `bottom-right`

Visibility options:

| Value | What it does |
|-------|--------------|
| `data-floating-v2-hide="mobile"` | Hides this floating copy on mobile |
| `data-floating-v2-hide="desktop"` | Hides this floating copy on desktop |

The source element stays in its original Carrd position. The plugin only hides and shows the runtime clone.

---

## How It Works in Carrd

- Every element with `data-floating-v2="..."` becomes one floating CTA source.
- The plugin clones that element at runtime and shows the clone only after the page passes the configured scroll threshold.
- Position rules come from `data-floating-v2-position` and viewport-specific overrides.
- Clone-only attributes and runtime classes stay internal and are not part of the public setup contract.

---

## How To Check That It Works

1. Publish the page.
2. Scroll past the configured threshold.
3. Every element with `data-floating-v2="..."` should keep its original place, and its floating copy should appear in the configured fixed position for the current viewport.

If nothing appears:
- check that the element has `data-floating-v2="..."`
- check that the embed is placed in **Body End**
- check that the page has been scrolled past the threshold
- check `data-floating-v2-position-mobile` if the position differs on mobile
- check `data-floating-v2-hide` if the copy is hidden only on one viewport

---

## Configuration

Most pages can use the default setup with no global config.

Add a **Code** embed and paste this block **above** the plugin embed to change the scroll threshold:

```html
<script>
window.CarrdPluginOptionsV2 = {
    floatingCta: {
        scrollY: 800,
        defaultPosition: 'bottom-right'
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptionsV2` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `selector` | `[data-floating-v2]` | Source elements cloned by the plugin |
| `defaultPosition` | `bottom-right` | Position used when an element has no valid `data-floating-v2-position` |
| `scrollY` | `800` | Scroll position in px where floating CTAs appear |

### Common setups

Different positions by viewport:

```html
<a
  data-floating-v2="contact"
  data-floating-v2-position="bottom-right"
  data-floating-v2-position-mobile="bottom-center"
  href="#contact"
>Contact</a>
```

Only on mobile:

```html
<a data-floating-v2="contact" data-floating-v2-position="bottom-right" data-floating-v2-hide="desktop" href="#contact">Contact</a>
```

Only on desktop:

```html
<a data-floating-v2="contact" data-floating-v2-position="bottom-right" data-floating-v2-hide="mobile" href="#contact">Contact</a>
```

---

## Design

Add a **Code** embed with a `<style>` tag and override any of these variables:

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

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-floating-cta-edge` | `1.25rem` | Distance from the chosen viewport edges |
| `--theme-floating-cta-mobile-edge` | `1rem` | Left/right edge distance on mobile |
| `--theme-floating-cta-z-index` | `99999` | Stack order |
| `--theme-floating-cta-offset` | `24px` | Slide distance before the CTA becomes visible |
| `--theme-floating-cta-fade-duration` | `0.3s` | Fade animation duration |
| `--theme-floating-cta-move-duration` | `0.45s` | Slide animation duration |
