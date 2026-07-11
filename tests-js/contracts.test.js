const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDom, loadScript, triggerDomReady } = require('./helpers');

test('plugin source files read shared CarrdPluginOptions namespaces', () => {
  // src/slider intentionally excluded: promoted from slider-v2, a pure
  // data-* contract with no window.CarrdPluginOptions (see
  // docs/specs/plugin-data-contract.md "Slider" section).
  const expectedRefs = [
    ['src/accordeon/accordeon.js', 'accordeon'],
    ['src/shopping-cart/shopping-cart.js', 'shoppingCart'],
    ['src/faq/faq.js', 'faq'],
    ['src/cards/cards.js', 'cards'],
    ['src/grid-cluster/grid-cluster.js', 'gridCluster'],
    ['src/no-loadwaiting/no-loadwaiting.js', 'noLoadwaiting'],
    ['src/modal/modal.js', 'modal'],
    ['src/typography/typography.js', 'typography'],
    ['src/header-nav/header-nav.js', 'headerNav'],
    ['src/floating-cta/floating-cta.js', 'floatingCta'],
    ['src/switcher/switcher.js', 'switcher']
  ];

  expectedRefs.forEach(([file, key]) => {
    const content = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf-8');
    assert.match(content, new RegExp(`window\\.CarrdPluginOptions\\.${key}\\b`));
  });
});

test('promoted slider has no active JS options contract', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/theme-config.js'), 'utf-8');
  const readme = fs.readFileSync(path.resolve(__dirname, '..', 'README.md'), 'utf-8');
  const automation = fs.readFileSync(path.resolve(__dirname, '..', 'cardbuilder/projects/faktura/automation/sync-runtime-embeds.mjs'), 'utf-8');

  assert.doesNotMatch(source, /CarrdPluginOptions\.slider\b/);
  assert.doesNotMatch(readme, /slider:\s*\{\s*autoplay/);
  assert.doesNotMatch(automation, /CarrdPluginOptions\.slider\b/);
  assert.match(automation, /data-slider-spv/);
  assert.match(automation, /data-slider-gap/);
});

test('public APIs are exposed with unified Carrd names', () => {
  const dom = createDom(
      '<div data-slider>A</div>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"></div></div></div>' +
      '<div class="txt"><span class="p"># T</span></div>' +
      '<section><ul data-switcher="switcher"><li><a href="#" role="button">One</a></li></ul><p class="switcher-1">One</p></section>' +
      '<a href="#data-accordeon-ppf" role="button">Toggle</a><div data-accordeon="ppf">Panel</div>'
  );
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  loadScript(dom, 'src/slider/slider.js');
  loadScript(dom, 'src/modal/modal.js');
  loadScript(dom, 'src/typography/typography.js');
  loadScript(dom, 'src/switcher/switcher.js');
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  assert.ok(dom.window.CarrdAccordeon);
  assert.ok(dom.window.CarrdShoppingCart);
  assert.ok(dom.window.CarrdSlider);
  assert.ok(dom.window.CarrdModal);
  assert.ok(dom.window.CarrdTypography);
  assert.ok(dom.window.CarrdSwitcher);
  assert.equal(dom.window['Cart' + 'Plugin'], undefined);
  assert.equal(dom.window['Carrd' + 'Cart'], undefined);
  assert.equal(dom.window['Modal' + 'Plugin'], undefined);
  assert.equal(dom.window['Typography' + 'Plugin'], undefined);
  assert.equal(dom.window['Switcher' + 'Plugin'], undefined);
});
