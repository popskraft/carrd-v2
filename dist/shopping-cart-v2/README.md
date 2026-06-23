# Shopping Cart V2

## Version

- Version: `2.0.0`
- Build date (UTC): `2026-06-23`

## Installation

### CDN Bundle (recommended)

If your site already has the CDN embeds installed (`theme-core-v2.min.css` in Head and `theme-core-v2.min.js` in Body End), this plugin is already active — no extra steps needed.

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

1. Open `shopping-cart-v2-cdn.html` from this folder.
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

1. Open `shopping-cart-v2-embed-part1.html` and `shopping-cart-v2-embed-part2.html` from this folder.
2. In Carrd, add two **Code → Hidden → Body End** embeds.
3. Paste part 1 into the first embed and part 2 into the second embed.
4. Keep the embeds in that order, publish the page, and refresh.

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

Adds a floating cart widget that collects product selections and writes the order summary into a Carrd form for checkout.

---

## What You Do in Carrd

1. Add a **Section Break** named `shopping-cart` — this creates the Carrd anchor `#shopping-cart` for the checkout flow.
2. Inside that section, add a **Form** element with ID `form-shopping-cart`.
3. Inside the form, add a **Textarea** field. Keep its name as `order-details`.
4. When you want an explicit plugin marker, also add `data-shopping-cart-v2-output="order-details"` to that textarea.
5. On each product button, add a click action: `CarrdShoppingCartV2.add('Product Name', 29.99)`.

---

## How It Works in Carrd

- Product buttons add items into the floating runtime cart.
- Checkout writes the order summary into the textarea used by the Carrd form.
- The preferred explicit output marker is `data-shopping-cart-v2-output="order-details"`.
- Legacy `data-cart-v2-output`, `.cart-output`, and `#order-details` detection still works only for migration.

---

## How To Check That It Works

1. Publish the page.
2. Click a product button.
3. Confirm the cart widget appears and shows the product.
4. Open the cart and click Checkout.
5. Confirm the order summary appears in the form textarea.

If nothing appears in the form, check that the textarea name is `order-details`, the optional `data-shopping-cart-v2-output="order-details"` marker is correct, and the form ID is `form-shopping-cart`.

---

## Configuration

No configuration is needed for most setups.

Add a **Code** embed and paste this block **above** the plugin embed to change currency, position, or labels:

```html
<script>
window.CarrdPluginOptionsV2 = {
    shoppingCart: {
        currency: '$',
        currencyPosition: 'before',
        position: 'top-right'
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptionsV2` block and place it once above all plugin embeds.

### Options

For most pages, you only need `currency`, `currencyPosition`, and `position`.

| Option | Default | What it changes |
|--------|---------|-----------------|
| `currency` | `$` | Currency symbol |
| `currencyPosition` | `before` | Shows the symbol before or after the amount |
| `position` | `top-right` | Widget position: `top-right`, `top-left`, `bottom-right`, `bottom-left`, `bottom-center` |
| `storageKey` | `carrd_cart_v1` | LocalStorage key |
| `checkoutTargetId` | `shopping-cart` | Carrd section anchor used during checkout |
| `texts.*` | English | All UI text labels |

---

## Advanced: Localization

```html
<script>
window.CarrdPluginOptionsV2 = {
    shoppingCart: {
        currency: '€',
        currencyPosition: 'after',
        texts: {
            title: 'Warenkorb',
            empty: 'Ihr Warenkorb ist leer.',
            checkout: 'Zur Kasse',
            total: 'Gesamt'
        }
    }
};
</script>
```

---

## API

The plugin exposes a JavaScript API for use in **Code** embeds:

```javascript
CarrdShoppingCartV2.add('Product', 29.99);
CarrdShoppingCartV2.remove('Product');
CarrdShoppingCartV2.updateQty('Product', 1);
CarrdShoppingCartV2.clear();
CarrdShoppingCartV2.getCart();
CarrdShoppingCartV2.getTotal();
CarrdShoppingCartV2.open();
CarrdShoppingCartV2.close();
CarrdShoppingCartV2.checkout();
```

---

## Design

Add a **Code** embed with a `<style>` tag and override any of these variables:

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

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-shopcart-bg` | page background | Cart panel background |
| `--theme-shopcart-text` | page text color | Cart text color |
| `--theme-shopcart-accent` | primary color | Accent color |
| `--theme-shopcart-btn-bg` | success color | Checkout button background |
| `--theme-shopcart-overlay-bg` | overlay token | Background overlay behind the cart |
