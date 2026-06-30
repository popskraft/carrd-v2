const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  triggerDomReady,
  setPluginOptions
} = require('./helpers');

test('slider ignores legacy CarrdPluginOptionsV2 namespace', () => {
  const dom = createDom('<div class="legacy-slide">A</div><div class="legacy-slide">B</div>');
  dom.window.CarrdPluginOptionsV2 = {
    slider: {
      slideSelector: '.legacy-slide'
    }
  };

  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-slider-wrapper').length, 0);
});

test('cookie banner ignores data-cookie-v2 markers', () => {
  const dom = createDom('<div data-cookie-v2="consent"><a role="button" href="#">Accept</a></div>');

  setPluginOptions(dom, {
    cookieBanner: {
      showDelay: 0,
      fadeInDuration: 0,
      fadeOutDuration: 0
    }
  });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelector('[data-cookie-v2]').dataset.cookieBannerInitialized, undefined);
});

test('accordeon ignores legacy hash names without the clean data prefix', () => {
  const dom = createDom(
    '<a id="legacy" href="#accordeon-ppf" role="button">Legacy</a>' +
    '<div data-accordeon="ppf">Panel</div>'
  );

  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const legacyLink = dom.window.document.getElementById('legacy');
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });

  assert.equal(legacyLink.dispatchEvent(event), true);
  assert.equal(event.defaultPrevented, false);
});

test('shopping cart writes checkout output only into the clean textarea marker', () => {
  const dom = createDom(
    '<form id="form-shopping-cart">' +
      '<textarea id="legacy-order-details"></textarea>' +
      '<textarea data-shopping-cart-output="order-details"></textarea>' +
    '</form>'
  );

  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  triggerDomReady(dom);
  dom.window.CarrdShoppingCart.add('Curtain', 29.99);

  const cleanField = dom.window.document.querySelector('[data-shopping-cart-output="order-details"]');
  const legacyField = dom.window.document.getElementById('legacy-order-details');

  assert.match(cleanField.value, /Curtain/);
  assert.equal(legacyField.value, '');
});
