# Accordeon

Shows or hides a group of Carrd containers from a normal button link.

Version: `2.0.0`

## Install

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `accordeon-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Add a **Buttons** element.
2. Set its link to `#data-accordeon-ppf`.
3. Add `data-accordeon=ppf` to every container in the group.
4. Replace `ppf` with any short group name.

The link suffix and every target value must match exactly.

## Configuration

Defaults work for normal use. To change the initial state or scrolling, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  accordeon: {
    defaultOpen: false,
    scrollOnOpen: true,
    scrollBehavior: 'smooth'
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `enabled` | `true` | Set `false` to disable the plugin globally |
| `defaultOpen` | `false` | Opens every group on load |
| `scrollOnOpen` | `true` | Scrolls to a group when it opens |
| `scrollBehavior` | `'smooth'` | Scroll behavior passed to `scrollIntoView` |
| `scrollBlock` | `'start'` | Vertical alignment passed to `scrollIntoView` |
| `hashPrefix` | `'#data-accordeon-'` | URL hash prefix that auto-opens a matching group on load |
| `linkPrefix` | `'#data-accordeon-'` | Href prefix used to find each group's trigger link |
| `linkSelector` | `null` | Overrides trigger-link discovery with a custom selector instead of `linkPrefix` |
| `targetAttributes` | `['data-accordeon']` | Attribute names checked on target containers |

## Verify

1. Publish or refresh the page.
2. Confirm the marked containers start closed.
3. Click the button twice and confirm the group opens, then closes.

If nothing happens, compare `#data-accordeon-ppf` with `data-accordeon=ppf`.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-accordeon-toggle-duration: 0.25s;
  --theme-accordeon-animation-duration: 0.28s;
  --theme-accordeon-animation-distance: 0.5rem;
}
</style>
```

## API

```javascript
CarrdAccordeon.open('ppf');
CarrdAccordeon.close('ppf');
CarrdAccordeon.toggle('ppf');
CarrdAccordeon.refresh();
```
