# Shopping Cart

Adds a floating cart and writes the order summary into a Carrd checkout form.

Version: `2.0.0`

## Install

Choose one method.

### Bundle Add-on (recommended when the bundle is installed)

`theme-core` does not include this plugin.

1. Install `theme-core` from the [root guide](../README.md).
2. Open `shopping-cart-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `shopping-cart-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `shopping-cart-embed-part1.html` and `shopping-cart-embed-part2.html`.
3. Add two `Code → Hidden → Body End` embeds.
4. Paste part 1 into the first embed and part 2 into the second.
5. Keep that order, publish, and refresh.

## Carrd Setup

1. Add a **Section Break** named `shopping-cart`.
2. Add a **Form** with ID `form-shopping-cart` inside that section.
3. Add an **Order Details** textarea inside the form.
   Set its field ID to `order-details`. If you can add custom attributes, also set `data-shopping-cart-output=order-details`.
4. Add this action to each product button: `CarrdShoppingCart.add('Product Name', 29.99)`.

## Configuration

Defaults use dollars and place the widget at the top right. To change them, add this in `Body End` above the plugin:

```html
<script>
window.CarrdPluginOptions = {
  shoppingCart: {
    currency: '$',
    currencyPosition: 'before',
    position: 'top-right'
  }
};
</script>
```

Positions: `top-right`, `top-left`, `bottom-right`, `bottom-left`, or `bottom-center`.

## Verify

1. Publish and add a product.
2. Confirm the floating cart appears with the correct item and total.
3. Click Checkout and confirm the order summary reaches the textarea.

If checkout stays empty, confirm the section name is `shopping-cart`, the form ID is `form-shopping-cart`, and the textarea renders as `name="order-details"` inside that form.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-shopcart-bg: var(--theme-color-bg);
  --theme-shopcart-text: var(--theme-color-text);
  --theme-shopcart-accent: var(--theme-color-primary);
  --theme-shopcart-btn-bg: var(--theme-color-success);
  --theme-shopcart-overlay-bg: var(--theme-overlay-bg);
}
</style>
```

## Advanced: Localization

Override labels under `shoppingCart.texts` in the same configuration block:

```javascript
texts: {
  title: 'Cart',
  empty: 'Your cart is empty.',
  checkout: 'Checkout',
  total: 'Total'
}
```

## API

```javascript
CarrdShoppingCart.add('Product', 29.99);
CarrdShoppingCart.remove('Product');
CarrdShoppingCart.clear();
CarrdShoppingCart.getCart();
CarrdShoppingCart.getTotal();
CarrdShoppingCart.open();
CarrdShoppingCart.close();
CarrdShoppingCart.checkout();
```
