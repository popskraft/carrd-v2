# Header Nav V2

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

1. Open `header-nav-v2-cdn.html` from this folder.
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

1. Open `header-nav-v2-embed.html` from this folder.
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

Collapses selected Carrd header elements behind a mobile hamburger without a load-time layout jump.

## What You Do in Carrd

1. Build the header inside Carrd's `#header` section.
2. Add class `header-mobile-el-collapsing` to every header element that should hide behind the hamburger on mobile.
3. Leave elements without that class visible on mobile, for example the logo.
4. Publish the page and refresh.

No `site-header`, `header-collapsing`, or `header-fixed` class is required for this version.

## How It Works in Carrd

- The plugin activates only when `#header` contains at least one `.header-mobile-el-collapsing` element.
- On mobile (`<= 736px` by default), marked elements are hidden while `#header` does not have `is-nav-open`.
- The hamburger button is injected into the first row inside `#header`.
- Opening the menu toggles `is-nav-open` on `#header`; marked elements return to their original Carrd layout.
- The menu expands in page flow. There is no overlay, sticky shell, spacer, or desktop sticky behavior.
- If the header is above the viewport when the mobile menu opens, the plugin scrolls `#header` into view.

## How To Check That It Works

1. Resize the page below 736px.
2. Confirm the hamburger appears and the marked elements are hidden from the first paint.
3. Tap the hamburger and confirm the marked elements expand without losing their Carrd styling.
4. Tap a link in the opened menu and confirm the menu closes.
5. Press `Escape` and confirm the menu closes and focus returns to the hamburger.
6. Resize above 736px and confirm the menu is closed and the marked elements are no longer forced hidden by the plugin CSS.

If the plugin seems inactive:

- confirm the page has a `#header` section;
- confirm at least one element inside `#header` has class `header-mobile-el-collapsing`;
- confirm the plugin embed or CDN script is installed in `Body End`.

## Configuration

Most sites can use the defaults.

Add a **Code** embed above the plugin embed if you need to change behavior:

```html
<script>
window.CarrdPluginOptionsV2 = {
  headerNav: {
    breakpoint: 736,
    closeOnLinkClick: true
  }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptionsV2` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|---|---:|---|
| `breakpoint` | `736` | Mobile cutoff for hamburger behavior |
| `closeOnLinkClick` | `true` | Closes the mobile menu after tapping a link |

Legacy sticky options such as `sticky`, `stickyTop`, and `navMaxHeight` no longer affect this plugin.

## Design

Add a separate **Head** style embed below `theme-design-system.html` and override variables as needed:

```html
<style>
:root {
  --theme-header-nav-toggle-position: fixed;
  --theme-header-nav-toggle-top: 1rem;
  --theme-header-nav-toggle-right: 1rem;
  --theme-header-nav-toggle-size: 46px;
  --theme-header-nav-toggle-z-index: 100000;
  --theme-header-nav-toggle-bg: rgba(255, 255, 255, 0.2);
  --theme-header-nav-toggle-backdrop: blur(10px);
  --theme-header-nav-bar-color: currentColor;
  --theme-header-nav-bar-width: 22px;
  --theme-header-nav-bar-height: 2px;
  --theme-header-nav-bar-gap: 5px;
  --theme-header-nav-duration: 300ms;
}
</style>
```

| Variable | Default | What it changes |
|---|---|---|
| `--theme-header-nav-toggle-position` | `fixed` | Hamburger positioning mode |
| `--theme-header-nav-toggle-top` | `1rem` | Hamburger top offset |
| `--theme-header-nav-toggle-right` | `1rem` | Hamburger right offset |
| `--theme-header-nav-toggle-size` | `46px` | Hamburger button size |
| `--theme-header-nav-toggle-z-index` | `100000` | Hamburger stack order; kept above Floating CTA by default |
| `--theme-header-nav-toggle-bg` | `rgba(255, 255, 255, 0.2)` | Hamburger button background |
| `--theme-header-nav-toggle-backdrop` | `blur(10px)` | Hamburger backdrop filter |
| `--theme-header-nav-bar-color` | `currentColor` | Hamburger bar color |
| `--theme-header-nav-bar-width` | `22px` | Hamburger bar width |
| `--theme-header-nav-bar-height` | `2px` | Hamburger bar thickness |
| `--theme-header-nav-bar-gap` | `5px` | Space between hamburger bars |
| `--theme-header-nav-duration` | `300ms` | Hamburger animation speed |
