const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady, click, keydown, setPluginOptions, useFakeTimers } = require('./helpers');

function stubHashAnchorClicks(dom) {
  const originalClick = dom.window.HTMLAnchorElement.prototype.click;
  let lastHref = '';

  dom.window.HTMLAnchorElement.prototype.click = function() {
    lastHref = this.getAttribute('href') || '';
    if (lastHref.startsWith('#')) {
      dom.window.location.hash = lastHref;
    }
  };

  return {
    getLastHref: () => lastHref,
    restore: () => {
      dom.window.HTMLAnchorElement.prototype.click = originalClick;
    }
  };
}

test('shopping cart injects widget and exposes API', () => {
  const dom = createDom('<div id="root"></div>');
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const container = doc.getElementById('theme-shopcart-container');
  const widget = doc.querySelector('.theme-shopcart-widget');
  const panel = doc.querySelector('.theme-shopcart-panel');
  assert.ok(container);
  assert.ok(widget);
  assert.ok(panel);
  assert.equal(widget.getAttribute('aria-controls'), 'theme-shopcart-panel');
  assert.equal(panel.getAttribute('role'), 'dialog');
  assert.ok(dom.window.CarrdShoppingCart);
  assert.equal(typeof dom.window.CarrdShoppingCart.add, 'function');
});

test('shopping cart escapes configured widget text labels', () => {
  const dom = createDom('<textarea class="cart-output" data-shopping-cart-output="order-details"></textarea>');
  setPluginOptions(dom, {
    shoppingCart: {
      texts: {
        title: '<img src=x onerror="window.__titleXss=1">',
        total: '<img src=x onerror="window.__totalXss=1">',
        checkout: '<img src=x onerror="window.__checkoutXss=1">'
      }
    }
  });

  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-shopcart-title img').length, 0);
  assert.equal(dom.window.document.querySelectorAll('.theme-shopcart-total-row img').length, 0);
  assert.equal(dom.window.document.querySelectorAll('.theme-shopcart-btn-checkout img').length, 0);
  assert.match(
    dom.window.document.querySelector('.theme-shopcart-btn-checkout').textContent,
    /<img src=x/
  );
});

test('shopping cart api updates items and totals', () => {
  const dom = createDom('<textarea class="cart-output" data-shopping-cart-output="order-details"></textarea>');
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  api.add('Product', 10);
  api.add('Product', 10);
  api.add('Second', 5);
  assert.equal(api.getCart().length, 2);
  assert.equal(api.getTotal(), 25);

  api.updateQty('Second', -1);
  assert.equal(api.getCart().length, 1);
  assert.equal(api.getTotal(), 20);

  api.clear();
  assert.equal(api.getCart().length, 0);
  assert.equal(api.getTotal(), 0);
  assert.equal(dom.window.document.querySelector('.cart-output').value, '');
});

test('shopping cart checkout uses the Carrd section hash route even when shopping-cart-target exists', () => {
  const dom = createDom('<div class="shopping-cart-target"></div><textarea class="cart-output" data-shopping-cart-output="order-details"></textarea>');
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  const anchorStub = stubHashAnchorClicks(dom);
  const target = dom.window.document.querySelector('.shopping-cart-target');
  let scrollCalls = 0;
  target.scrollIntoView = () => {
    scrollCalls += 1;
  };
  api.add('Product', 9.99);
  api.checkout();

  const field = dom.window.document.querySelector('textarea.cart-output');
  assert.match(field.value, /ORDER DETAILS/);
  assert.match(field.value, /TOTAL:\s+\$9\.99/);
  assert.equal(anchorStub.getLastHref(), '#shopping-cart');
  assert.equal(scrollCalls, 0);
  assert.equal(dom.window.location.hash, '#shopping-cart');
  anchorStub.restore();
});

test('shopping cart prefers #shopping-cart and #form-shopping-cart for the standard Carrd checkout flow', () => {
  const dom = createDom(`
    <section id="shopping-cart">
      <form id="form-shopping-cart">
        <textarea class="cart-output" data-shopping-cart-output="order-details"></textarea>
      </form>
    </section>
    <div class="shopping-cart-target"></div>
  `);
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  const anchorStub = stubHashAnchorClicks(dom);
  api.add('Product', 19.99);
  api.checkout();

  const field = dom.window.document.querySelector('#form-shopping-cart .cart-output');
  assert.match(field.value, /PRODUCT/i);
  assert.match(field.value, /TOTAL:\s+\$19\.99/);
  assert.equal(anchorStub.getLastHref(), '#shopping-cart');
  assert.equal(dom.window.location.hash, '#shopping-cart');
  anchorStub.restore();
});

test('shopping cart keeps checkout as a button control', () => {
  const dom = createDom('<section id="shopping-cart"><form id="form-shopping-cart"><textarea class="cart-output" data-shopping-cart-output="order-details"></textarea></form></section>');
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  api.add('Product', 19.99);

  const checkoutButton = dom.window.document.querySelector('.theme-shopcart-btn-checkout');
  assert.ok(checkoutButton);
  assert.equal(checkoutButton.tagName, 'BUTTON');
  assert.equal(checkoutButton.disabled, false);
});

test('shopping cart keeps same generic products separate when they come from different quick-order buttons', () => {
  const dom = createDom(`
    <textarea class="cart-output" data-shopping-cart-output="order-details"></textarea>
    <button id="product-one" onclick="CarrdShoppingCart.add('Product Name', 29.99)">Quick order product 1</button>
    <button id="product-two" onclick="CarrdShoppingCart.add('Product Name', 29.99)">Quick order product 2</button>
  `);
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  click(dom, dom.window.document.getElementById('product-one'));
  click(dom, dom.window.document.getElementById('product-two'));

  const cart = dom.window.CarrdShoppingCart.getCart();
  assert.equal(cart.length, 2);
  assert.deepEqual(
    Array.from(cart, item => item.name),
    ['Quick order product 1', 'Quick order product 2']
  );

  const orderDetails = dom.window.document.querySelector('.cart-output').value;
  assert.match(orderDetails, /1 x Quick order product 1: \$29\.99/);
  assert.match(orderDetails, /1 x Quick order product 2: \$29\.99/);
  assert.match(orderDetails, /TOTAL:\s+\$59\.98/);
});

test('shopping cart loads only valid items from localStorage', () => {
  const dom = createDom('<textarea class="cart-output" data-shopping-cart-output="order-details"></textarea>');
  dom.window.localStorage.setItem(
    'carrd_cart_v1',
    JSON.stringify([
      { name: 'Good', price: 10, qty: 2 },
      { name: '', price: 1, qty: 1 },
      { name: 'BadQty', price: 2, qty: 0 }
    ])
  );

  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const items = dom.window.CarrdShoppingCart.getCart();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, 'Good');
});

test('shopping cart no longer writes to legacy id fallback for the order field', () => {
  const dom = createDom('<textarea id="order-details"></textarea>');
  dom.window.alert = () => {};
  const originalError = dom.window.console.error;
  dom.window.console.error = () => {};
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  const anchorStub = stubHashAnchorClicks(dom);
  api.add('Legacy', 5);
  api.checkout();

  const field = dom.window.document.getElementById('order-details');
  assert.equal(field.value, '');
  assert.equal(anchorStub.getLastHref(), '');
  assert.equal(dom.window.location.hash, '');
  anchorStub.restore();
  dom.window.console.error = originalError;
});

test('shopping cart supports the primary data-shopping-cart-output marker', () => {
  const dom = createDom('<textarea data-shopping-cart-output="order-details"></textarea>');
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  const anchorStub = stubHashAnchorClicks(dom);
  api.add('Marked', 5);
  api.checkout();

  const field = dom.window.document.querySelector('[data-shopping-cart-output="order-details"]');
  assert.match(field.value, /MARKED/i);
  assert.equal(anchorStub.getLastHref(), '#shopping-cart');
  anchorStub.restore();
});

test('shopping cart checkout scrolls the actual checkout form into view after opening the Carrd section', () => {
  const dom = createDom(`
    <section id="shopping-cart"></section>
    <form id="form-shopping-cart">
      <textarea class="cart-output" data-shopping-cart-output="order-details"></textarea>
    </form>
  `);
  const timers = useFakeTimers(dom);
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  const anchorStub = stubHashAnchorClicks(dom);
  const form = dom.window.document.getElementById('form-shopping-cart');
  let formScrollCalls = 0;
  form.scrollIntoView = () => {
    formScrollCalls += 1;
  };

  api.add('Product', 19.99);
  api.checkout();
  timers.flush();

  assert.equal(anchorStub.getLastHref(), '#shopping-cart');
  assert.equal(formScrollCalls, 1);

  anchorStub.restore();
  timers.restore();
});

test('shopping cart does not use fuzzy textarea fallback anymore', () => {
  const dom = createDom('<textarea id="customer-notes"></textarea>');
  dom.window.alert = () => {};
  const originalError = dom.window.console.error;
  dom.window.console.error = () => {};
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  api.add('Product', 9.99);
  api.checkout();

  assert.equal(dom.window.document.getElementById('customer-notes').value, '');
  dom.window.console.error = originalError;
});

test('shopping cart clears stale order details when the cart becomes empty', () => {
  const dom = createDom('<section id="shopping-cart"><form id="form-shopping-cart"><textarea class="cart-output" data-shopping-cart-output="order-details"></textarea></form></section>');
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdShoppingCart;
  api.add('Product', 29.99);
  api.checkout();
  assert.match(dom.window.document.querySelector('.cart-output').value, /TOTAL:\s+\$29\.99/);

  api.clear();
  assert.equal(dom.window.document.querySelector('.cart-output').value, '');
  assert.equal(api.checkout(), false);
  assert.equal(dom.window.document.querySelector('.cart-output').value, '');
});

test('shopping cart traps focus and closes on Escape', () => {
  const dom = createDom('<textarea class="cart-output"></textarea><button id="before">Before</button>');
  const timers = useFakeTimers(dom);
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const api = dom.window.CarrdShoppingCart;
  const before = doc.getElementById('before');
  before.focus();

  api.add('Product', 10);
  api.open();
  timers.flush();

  const widget = doc.querySelector('.theme-shopcart-widget');
  const panel = doc.querySelector('.theme-shopcart-panel');
  const closeButton = doc.querySelector('.theme-shopcart-close');
  const checkoutButton = doc.querySelector('.theme-shopcart-btn-checkout');

  assert.equal(widget.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.getAttribute('aria-hidden'), 'false');
  assert.equal(doc.body.classList.contains('theme-shopcart-open'), true);
  assert.equal(doc.activeElement, closeButton);

  checkoutButton.focus();
  keydown(dom, doc, 'Tab');
  assert.equal(doc.activeElement, closeButton);

  keydown(dom, doc, 'Escape');
  timers.flush();
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  assert.equal(widget.getAttribute('aria-expanded'), 'false');
  assert.equal(doc.body.classList.contains('theme-shopcart-open'), false);
  assert.equal(doc.activeElement, before);

  timers.restore();
});
