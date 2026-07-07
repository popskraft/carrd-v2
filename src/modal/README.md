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
