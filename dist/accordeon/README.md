# Accordeon

## Version

- Version: `2.0.0`
- Build date (UTC): `2026-06-30`

## Installation

### CDN Bundle (recommended)

If your site already has the CDN embeds installed (`theme-core.min.css` in Head and `theme-core.min.js` in Body End), this plugin is already active — no extra steps needed.

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

1. Open `accordeon-cdn.html` from this folder.
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

1. Open `accordeon-embed.html` from this folder.
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

Toggles whole Carrd containers from normal button links.

Use it when one button should show or hide every container marked with the same accordion name.

---

## What You Do in Carrd

1. Add a Carrd **Buttons** element.
2. Set the button link to `#data-accordeon-ppf`.
3. Add `data-accordeon=ppf` to each container that should open and close together.
4. Publish the page and refresh.

Replace `ppf` with any short name you want to use for that group.

The plugin only handles links that match `#data-accordeon-...` and have matching targets on the page. Other hash links keep their normal Carrd behavior.

## How It Works in Carrd

On load, matching containers are closed by default.

Clicking a matching button:

- opens all containers with the same `data-accordeon` value;
- closes them again on the next click;
- syncs any other buttons with the same `#data-accordeon-...` link.
- scrolls smoothly to the first opened container.

## How To Check That It Works

1. Publish or refresh the page.
2. The marked containers should be hidden.
3. Click the button — the containers should appear.
4. Click again — the containers should hide.

If nothing happens, check that the link and target value match exactly:

```html
<a href="#data-accordeon-ppf" role="button">Open details</a>
<div data-accordeon="ppf">Details</div>
```

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed if you want to change default behavior:

```html
<script>
window.CarrdPluginOptions = {
    accordeon: {
        defaultOpen: false,
        scrollOnOpen: true,
        scrollBehavior: 'smooth',
        scrollBlock: 'start'
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptions` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `enabled` | `true` | Turns the plugin on or off |
| `hashPrefix` | `#data-accordeon-` | Primary link prefix that activates toggles |
| `linkSelector` | auto | Selector used to find toggle links |
| `targetAttributes` | `['data-accordeon']` | Target attributes checked for matching containers |
| `defaultOpen` | `false` | Opens matching groups on page load |
| `scrollOnOpen` | `true` | Scrolls to the first target after opening |
| `scrollBehavior` | `smooth` | Scroll behavior passed to `scrollIntoView` |
| `scrollBlock` | `start` | Vertical alignment passed to `scrollIntoView` |

## Design

Add a **Code** embed with a `<style>` tag and override any of these variables:

```html
<style>
:root {
    --theme-accordeon-toggle-duration: 0.25s;
    --theme-accordeon-animation-duration: 0.28s;
    --theme-accordeon-animation-distance: 0.5rem;
}
</style>
```

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-accordeon-toggle-duration` | `0.25s` | Icon rotation speed |
| `--theme-accordeon-animation-duration` | `0.28s` | Open animation speed |
| `--theme-accordeon-animation-distance` | `0.5rem` | Open animation movement |
| `--theme-accordeon-animation-easing` | `ease-out` | Open animation easing |

## API

The plugin exposes a JavaScript API for use in **Code** embeds:

```javascript
window.CarrdAccordeon.open('ppf');
window.CarrdAccordeon.close('ppf');
window.CarrdAccordeon.toggle('ppf');
window.CarrdAccordeon.refresh();
```
