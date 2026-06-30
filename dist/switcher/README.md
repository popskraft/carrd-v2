# Switcher

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

1. Open `switcher-cdn.html` from this folder.
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

1. Open `switcher-embed.html` from this folder.
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

Turns a Carrd **Buttons** element into a tab switcher. Each button shows one set of content and hides the rest. Works with any Carrd element — text, images, containers, or whole sections.

No coding required for basic use. Connect buttons to targets by adding custom attributes to the Buttons element and matching targets.

---

## What You Do in Carrd

### Data Target Mode

**Option A — one target per button by order:**

1. Add a **Buttons** element to your page.
2. Open its attributes panel and add: `data-switcher=pricing`
3. Add the elements you want to switch.
4. Open each target element's attributes panel and add: `data-switcher-target=pricing`.
5. DOM order decides which button controls which element: first element → first button, second → second.

**Option B — one button shows several elements at once:**

1. Add a **Buttons** element and set attribute: `data-switcher=pricing`
2. Add the elements you want to switch.
3. Add `data-switcher-target=pricing` to every target element.
4. Add `data-switcher-index=1` to every element shown by the first button.
5. Add `data-switcher-index=2` to every element shown by the second button.
6. Continue with `3`, `4` for more buttons.

You can replace `pricing` with any simple name.

---

### Cluster Mode

Use cluster mode when you want to switch whole containers by order.

1. Add a **Buttons** element and set two attributes:
   - `data-switcher=cases`
   - `data-switcher-mode=cluster`
2. Add a target attribute to each section or container that should be switched:
   - `data-switcher-cluster=cases`
3. Order decides the mapping: first target → first button, second → second.

Place the Buttons element **outside** the containers you are switching. If the buttons end up inside a hidden container, they will disappear too.

---

### Multiple Switchers

Use a unique `data-switcher` name for each independent switcher on the page.

Use the **same** name when two or more button lists should control the same state from different places on the page — for example, a top tab bar and a bottom tab bar. Clicking either one updates all button lists with that name.

---

## How It Works in Carrd

- A controller is any **Buttons** element with `data-switcher="..."`.
- Targets are matched either by `data-switcher-target` / `data-switcher-index` or by cluster mode attributes.
- The first target is shown by default unless `defaultIndex` changes it.
- Multiple controllers with the same `data-switcher` name stay synchronized.

---

## How To Check That It Works

1. Publish or refresh the page.
2. The first target should be visible by default.
3. Click the second button — the first target hides and the second appears.
4. The active button should become dark with white text.

If nothing switches, check that the `data-switcher` value and the `data-switcher-target` or cluster attribute value match exactly.

---

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed if you want to change default behavior:

```html
<script>
window.CarrdPluginOptions = {
    switcher: {
        defaultIndex: 1,
        warnOnMismatch: true,
        targetAttribute: 'data-switcher-target',
        targetIndexAttribute: 'data-switcher-index',
        instances: {
            price: {
                defaultIndex: 2
            },
            cases: {
                defaultIndex: 1,
                clusterScopeSelector: '.site-main'
            }
        }
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptions` block and place it once above all plugin embeds.

`instances` is optional. Use it when two different switchers on the same page need different behavior. The key must match the `data-switcher` value:

- `instances.price` applies only to `data-switcher="price"`;
- `instances.cases` applies only to `data-switcher="cases"`;
- any missing option falls back to the global `switcher` option.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `enabled` | `true` | Turns the plugin on or off |
| `controllerSelector` | `[data-switcher]` | Selector used to find switcher controllers |
| `defaultIndex` | `1` | Button and target shown on page load |
| `warnOnMismatch` | `true` | Shows console warnings for missing targets |
| `scopeSelector` | `section` | Parent scope used to find class-mode targets |
| `targetAttribute` | `data-switcher-target` | Attribute used to find v2 data targets |
| `targetIndexAttribute` | `data-switcher-index` | Attribute used to map v2 targets to button indexes |
| `modeAttribute` | `data-switcher-mode` | Attribute used to select `class-index` or `cluster` |
| `clusterTargetAttribute` | `data-switcher-cluster` | Attribute used by cluster mode targets |
| `clusterScopeSelector` | `.site-main` | Parent scope used to find cluster targets. Change this if your Buttons element and cluster targets do not share `.site-main` as a common parent. |
| `instances` | `{}` | Per-`data-switcher` option overrides |

---

## Design

Add a **Code** embed with a `<style>` tag and override any of these variables:

```css
<style>
:root {
    --theme-switcher-active-bg: #000000;
    --theme-switcher-active-color: #ffffff;
    --theme-switcher-animation-duration: 0.3s;
    --theme-switcher-animation-distance: 0.5rem;
    --theme-switcher-animation-easing: ease-out;
}
</style>
```

To style different controllers differently, scope variables to the controller:

```css
<style>
[data-switcher="price"] {
    --theme-switcher-active-bg: #111111;
    --theme-switcher-active-color: #ffffff;
}

[data-switcher="cases"] {
    --theme-switcher-active-bg: #0057ff;
    --theme-switcher-active-color: #ffffff;
}
</style>
```

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-switcher-active-bg` | primary dark color | Active button background |
| `--theme-switcher-active-border` | active background | Active button border |
| `--theme-switcher-active-color` | button text color | Active button text color |
| `--theme-switcher-inactive-bg` | `inherit` | Inactive button background |
| `--theme-switcher-animation-duration` | `1s` | Show animation duration |
| `--theme-switcher-animation-distance` | `0.75rem` | Fade-down movement distance |
| `--theme-switcher-animation-easing` | `ease-out` | Animation easing |

---

## API

The plugin exposes a JavaScript API for use in **Code** embeds:

```javascript
window.CarrdSwitcher.show('switcher', 2);
window.CarrdSwitcher.next('switcher');
window.CarrdSwitcher.prev('switcher');
window.CarrdSwitcher.refresh();
```

Indexes are one-based: `1` activates the first button and its target, `2` the second, and so on.
