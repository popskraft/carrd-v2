# Modal

Opens marked Carrd containers as accessible modal dialogs.

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

Per-modal overrides win over the global config above. Add any of these directly to a `data-modal` container:

| Attribute | Values | Result |
|---|---|---|
| `data-modal-close-on-overlay` | `on` \| `off` | Overrides `closeOnOverlay` for that modal |
| `data-modal-close-on-escape` | `on` \| `off` | Overrides `closeOnEscape` for that modal |
| `data-modal-show-close` | `on` \| `off` | Overrides `showCloseButton` for that modal |
| `data-modal-lock-scroll` | `on` \| `off` | Overrides `lockBodyScroll` for that modal |

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
