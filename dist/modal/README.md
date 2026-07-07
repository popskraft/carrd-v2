# Modal

Opens marked Carrd containers as accessible modal dialogs.

Version: `2.0.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-core` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `modal-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `modal-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Add `data-modal=contact` to a Carrd container.
2. Add a link with `href=#data-modal-contact`.
3. For a non-link trigger, use `data-modal-open=contact`.
4. Set the modal width with Carrd's container controls.

## Configuration

Defaults close on overlay click and `Escape`, show a close button, and lock page scrolling. To change them, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  modal: {
    closeOnOverlay: true,
    closeOnEscape: true,
    showCloseButton: true,
    lockBodyScroll: true
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `closeOnOverlay` | `true` | Closes the modal when the overlay is clicked |
| `closeOnEscape` | `true` | Closes the modal on `Escape` |
| `showCloseButton` | `true` | Shows the built-in close button |
| `lockBodyScroll` | `true` | Locks page scrolling while a modal is open |
| `preventWhenCartOpen` | `false` | Set `true` to block opening a modal while the Shopping Cart panel is open |
| `modalSelector` | `'.container-component[data-modal]'` | Selector used to find modal containers |
| `targetAttribute` | `'data-modal'` | Attribute name that names each modal |
| `triggerAttribute` | `'data-modal-open'` | Attribute used for non-link triggers |
| `legacyTriggerAttribute` | `'data-modal-target'` | Legacy alias of `triggerAttribute` |
| `hashPrefix` | `'#data-modal-'` | URL hash prefix used to open a modal via a link |
| `legacyHashTargets` | `true` | Set `false` to stop matching legacy hash targets |

## Verify

1. Publish the page and open the trigger.
2. Confirm the modal opens.
3. Close it with the overlay, close button, and `Escape`.

If it does not open, compare `data-modal=contact` with `#data-modal-contact`.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-modal-overlay-bg: var(--theme-overlay-bg);
  --theme-modal-max-height: 90vh;
  --theme-modal-padding: 1rem;
  --theme-modal-padding-mobile: 0.5rem;
  --theme-modal-border-radius-mobile: 1rem;
}
</style>
```

## Advanced: Accessible Label

The label comes from the first heading, then `data-modal-label`, then `aria-label`, then the modal name.

To prevent a pre-load flash, add this in `Head`:

```html
<style>.container-component[data-modal] { display: none !important; }</style>
```

## API

```javascript
CarrdModal.open('contact');
CarrdModal.close();
CarrdModal.toggle('contact');
CarrdModal.isOpen('contact');
```
