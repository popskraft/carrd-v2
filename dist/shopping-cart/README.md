# Shopping Cart

Adds a floating cart and writes the order summary into a Carrd checkout form.

Version: `2.0.0`

## Install

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `shopping-cart-embed-part1.html` and `shopping-cart-embed-part2.html`.
3. Add two new elements: `+ Add an element` → `Embed`, both placed at the end of the page.
4. Set `Code → Hidden → Body End` on both embeds.
5. Paste part 1 into the first embed and part 2 into the second.
6. Give each Embed element a Title, keep that order, publish, and refresh.

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

| Option | Default | Result |
|---|---|---|
| `currency` | `'$'` | Currency symbol shown with each price |
| `currencyPosition` | `'before'` | `'before'` shows `$10`, `'after'` shows `10$` |
| `position` | `'top-right'` | Floating widget position |
| `storageKey` | `'carrd_cart_v1'` | `localStorage` key used to persist the cart |
| `orderInputSelector` | `'[data-shopping-cart-output="order-details"]'` | Selector for the checkout field the order summary is written into |
| `checkoutTargetId` | `'shopping-cart'` | Section id scrolled to on checkout |

Add `data-shopping-cart-checkout-target` to any element to override `checkoutTargetId` without touching the config block; its value is used as the scroll-target id instead.

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
  --theme-shopcart-bg: var(--theme-color-surface);
  --theme-shopcart-text: var(--theme-color-text);
  --theme-shopcart-accent: var(--theme-color-primary);
  --theme-shopcart-btn-bg: var(--theme-color-brand-green);
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
  total: 'Total',
  remove: 'Remove',
  required: 'Required',
  addedToCart: 'Added "${name}" to cart',
  errorName: 'Invalid product name',
  errorPrice: 'Invalid price for ${name}',
  errorForm: 'Error: Could not find the order form. Please contact support.',
  consoleErrorForm: 'Carrd Cart: Could not find the checkout textarea. Ensure [data-shopping-cart-output="order-details"] exists or use the native Carrd order-details textarea inside #form-shopping-cart.'
}
```

`addedToCart` and `errorPrice` support a `${name}` placeholder. `consoleErrorForm` is logged to the browser console only, not shown to visitors.

## API

```javascript
CarrdShoppingCart.add('Product', 29.99);
CarrdShoppingCart.add('Product', 29.99, {
  id: 'sku-123',        // explicit line-item key instead of the name+price+source hash
  sourceLabel: 'Combo',  // groups/labels the item when the same name is added from different sources
  displayName: 'Product (Combo)' // overrides the name shown in the cart UI
});
CarrdShoppingCart.remove('Product');
CarrdShoppingCart.clear();
CarrdShoppingCart.getCart();
CarrdShoppingCart.getTotal();
CarrdShoppingCart.open();
CarrdShoppingCart.close();
CarrdShoppingCart.checkout();
```
