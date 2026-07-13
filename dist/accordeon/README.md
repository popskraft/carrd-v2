# Accordeon

Shows or hides a group of Carrd containers from a normal button link.

Version: `2.0.0`

## Install

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `accordeon-embed.html`.
3. Add a new element: `+ Add an element` → `Embed`, placed at the end of the page.
4. Paste the full file into `Code → Hidden → Body End`.
5. Give the new Embed element a Title, then publish and refresh.

## Carrd Setup

1. Add a **Buttons** element.
2. Set its link to `#data-accordeon-group`.
3. Add `data-accordeon=group` to every container in the group.
4. Replace `group` with any short group name.

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
| `defaultOpen` | `false` | Opens every group on load |
| `scrollOnOpen` | `true` | Scrolls to a group when it opens |
| `scrollBehavior` | `'smooth'` | Scroll behavior passed to `scrollIntoView` (`'smooth'` or `'auto'`) |
| `scrollBlock` | `'start'` | Vertical alignment passed to `scrollIntoView` (`'start'`, `'center'`, `'end'`, `'nearest'`) |
| `enabled` | `true` | Set `false` to disable the plugin globally |

Per-container overrides win over the global config above. Add any of these to one container in a group:

| Attribute | Values | Result |
|---|---|---|
| `data-accordeon-default-open` | `on` \| `off` | Overrides `defaultOpen` for that group |
| `data-accordeon-scroll` | `on` \| `off` | Overrides `scrollOnOpen` for that group |
| `data-accordeon-scroll-behavior` | `smooth` \| `auto` | Overrides `scrollBehavior` for that group |
| `data-accordeon-scroll-block` | `start` \| `center` \| `end` \| `nearest` | Overrides `scrollBlock` for that group |

## Verify

1. Publish or refresh the page.
2. Confirm the marked containers start closed.
3. Click the button twice and confirm the group opens, then closes.

If nothing happens, compare `#data-accordeon-group` with `data-accordeon=group`.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-accordeon-toggle-duration: 0.25s;
  --theme-accordeon-animation-duration: 0.28s;
  --theme-accordeon-animation-distance: 0.5rem;
  --theme-accordeon-animation-easing: ease-out;
}
</style>
```

## API

```javascript
CarrdAccordeon.open('group');
CarrdAccordeon.close('group');
CarrdAccordeon.toggle('group');
CarrdAccordeon.refresh();
```
