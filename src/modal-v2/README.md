# Modal V2

Shows modal dialogs from Carrd container components.

## What You Do in Carrd

1. Create a Carrd container and add `data-modal-v2=contact`.
2. Add a link that points to it with `href="#data-modal-v2-contact"`.
3. For non-link triggers, use `data-modal-v2-open=contact`.
4. Set modal width with Carrd's container width controls.

## How It Works in Carrd

- Clicking the trigger opens the matching modal.
- Overlay click, Escape, and the close button can close it.
- The page can lock body scroll while the modal is open.
- The accessible label comes from the first heading inside the modal, then `data-modal-v2-label`, then `aria-label`.
- Legacy `.modal` containers with `id` hash triggers still work during migration.

## How To Check That It Works

1. Publish the page.
2. Click the trigger.
3. Confirm the modal opens and closes with overlay click or Escape.
4. If it does not open, check the modal name and trigger target.

## Configuration

Use this only if you want to change close behavior or body scroll locking.

```html
<script>
window.CarrdPluginOptionsV2 = {
    modal: {
        modalSelector: '.container-component.modal, .container-component[data-modal-v2]',
        targetAttribute: 'data-modal-v2',
        triggerAttribute: 'data-modal-v2-open',
        hashPrefix: '#data-modal-v2-',
        legacyHashTargets: true,
        closeOnOverlay: true,
        closeOnEscape: true,
        showCloseButton: true,
        lockBodyScroll: true,
        preventWhenCartOpen: false
    }
};
</script>
```

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `modalSelector` | `'.container-component.modal, .container-component[data-modal-v2]'` | Selector used to find modal containers |
| `targetAttribute` | `data-modal-v2` | Attribute used to identify v2 modal containers |
| `triggerAttribute` | `data-modal-v2-open` | Primary attribute used for v2 non-link triggers |
| `hashPrefix` | `#data-modal-v2-` | v2 link prefix that activates modals |
| `legacyHashTargets` | `true` | Keeps legacy `#modalId` + `.modal` support |
| `closeOnOverlay` | `true` | Closes the modal when clicking the overlay |
| `closeOnEscape` | `true` | Closes the modal when pressing Escape |
| `showCloseButton` | `true` | Auto-injects an SVG close button (×) inside the modal, positioned top-right |
| `lockBodyScroll` | `true` | Prevents background scrolling while open |
| `preventWhenCartOpen` | `false` | Blocks opening while the Shopping Cart panel is already open |

## Advanced: Trigger Elements

Use a namespaced hash link for normal Carrd buttons:

```html
<a href="#data-modal-v2-contact">Open Contact Modal</a>
<button data-modal-v2-open="contact">Open Modal</button>

Legacy fallback: `data-modal-v2-target="contact"` still works on older pages.
```

## Advanced: Accessible Label

The modal label is resolved in this order:

1. the first heading inside the modal
2. `data-modal-v2-label`
3. `aria-label`
4. the modal name or ID as a fallback

## Advanced: Instant Hide

To prevent the modal from flashing before CSS loads, add this to a hidden Head embed:

```html
<style>.container-component.modal, .container-component[data-modal-v2] { display: none !important; }</style>
```

## Advanced: JavaScript API

```javascript
CarrdModalV2.open('contact');
CarrdModalV2.close();
CarrdModalV2.toggle('contact');
CarrdModalV2.isOpen();
CarrdModalV2.isOpen('contact');
```

## Advanced: CSS Variables

Use a separate hidden `Head` `<style>` block after `theme-design-system.html` and place your overrides there.

```css
:root {
    --theme-modal-overlay-bg: var(--theme-overlay-bg);
    --theme-modal-max-height: 90vh;
    --theme-modal-padding: 1rem;
    --theme-modal-close-top: 1rem;
    --theme-modal-close-right: 1rem;
    --theme-modal-padding-mobile: 0.5rem;
    --theme-modal-max-height-mobile: 90vh;
    --theme-modal-border-radius-mobile: 1rem;
}
```
