const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDom, loadScript, triggerDomReady } = require('./helpers');

test('plugin source files read shared CarrdPluginOptionsV2 namespaces', () => {
  const expectedRefs = [
    ['src/accordeon-v2/accordeon-v2.js', 'accordeon'],
    ['src/shopping-cart-v2/shopping-cart-v2.js', 'shoppingCart'],
    ['src/faq-v2/faq-v2.js', 'faq'],
    ['src/cards-v2/cards-v2.js', 'cards'],
    ['src/grid-cluster-v2/grid-cluster-v2.js', 'gridCluster'],
    ['src/no-loadwaiting-v2/no-loadwaiting-v2.js', 'noLoadwaiting'],
    ['src/slider-v2/slider-v2.js', 'slider'],
    ['src/modal-v2/modal-v2.js', 'modal'],
    ['src/typography-v2/typography-v2.js', 'typography'],
    ['src/header-nav-v2/header-nav-v2.js', 'headerNav'],
    ['src/floating-cta-v2/floating-cta-v2.js', 'floatingCta'],
    ['src/switcher-v2/switcher-v2.js', 'switcher']
  ];

  expectedRefs.forEach(([file, key]) => {
    const content = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf-8');
    assert.match(content, new RegExp(`window\\.CarrdPluginOptionsV2\\.${key}\\b`));
  });
});

test('public APIs are exposed with unified Carrd names', () => {
  const dom = createDom(
      '<div class="slider">A</div>' +
      '<div id="modalContact" class="container-component modal"><div class="wrapper"><div class="inner"></div></div></div>' +
      '<div class="txt"><span class="p"># T</span></div>' +
      '<section><ul data-switcher-v2="switcher"><li><a href="#" role="button">One</a></li></ul><p class="switcher-1">One</p></section>' +
      '<a href="#accordeon-ppf" role="button">Toggle</a><div data-accordeon-v2="ppf">Panel</div>'
  );
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  loadScript(dom, 'src/shopping-cart-v2/shopping-cart-v2.js');
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  loadScript(dom, 'src/typography-v2/typography-v2.js');
  loadScript(dom, 'src/switcher-v2/switcher-v2.js');
  loadScript(dom, 'src/accordeon-v2/accordeon-v2.js');
  triggerDomReady(dom);

  assert.ok(dom.window.CarrdAccordeonV2);
  assert.ok(dom.window.CarrdShoppingCartV2);
  assert.ok(dom.window.CarrdSliderV2);
  assert.ok(dom.window.CarrdModalV2);
  assert.ok(dom.window.CarrdTypographyV2);
  assert.ok(dom.window.CarrdSwitcherV2);
  assert.equal(dom.window['Cart' + 'Plugin'], undefined);
  assert.equal(dom.window['Carrd' + 'Cart'], undefined);
  assert.equal(dom.window['Modal' + 'Plugin'], undefined);
  assert.equal(dom.window['Typography' + 'Plugin'], undefined);
  assert.equal(dom.window['Switcher' + 'Plugin'], undefined);
});
