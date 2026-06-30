const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady, mockViewport } = require('./helpers');

/*
 * Integration tests: verify plugins don't conflict with each other
 * or with Carrd's main.js globals.
 */

// DOM that exercises multiple plugins at once
function createRichDom() {
  return createDom(
      '<div id="root">' +
      // grid-cluster blocks
      '<div class="grid-2 w-20">A</div>' +
      '<div class="grid-2 w-80">B</div>' +
      // cards container
      '<div data-cards="cards"><div class="wrapper"><div class="inner">' +
        '<div>Card 1</div><div>Card 2</div>' +
      '</div></div></div>' +
      // faq
      '<div data-faq="main">' +
        '<hr class="divider-component"><h2>Q1</h2><p>A1</p><hr class="divider-component"><h2>Q2</h2><p>A2</p><hr class="divider-component">' +
      '</div>' +
      // accordeon
      '<a href="#data-accordeon-ppf" role="button">Toggle details</a>' +
      '<div data-accordeon="ppf">Details</div>' +
      // slider
      '<div data-slider>Slide 1</div>' +
      // modal
      '<div data-modal="test" class="container-component">' +
        '<div class="wrapper"><div class="inner">Modal</div></div>' +
      '</div>' +
      // typography
      '<div class="txt"><span class="p"># Title</span></div>' +
      // floating cta
      '<div><ul data-floating="contact" data-floating-position="bottom-right" class="buttons-component"><li><a href="#contact">Order</a></li></ul></div>' +
      '<div id="contact"></div>' +
    '</div>'
  );
}

// ===== Main.js contract compatibility =====

test('plugins do not overwrite main.js globals', () => {
  const dom = createDom('<div></div>');
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  // Simulate main.js global
  dom.window._scrollToTop = function() {};

  // Load all core plugins
  loadScript(dom, 'src/grid-cluster/grid-cluster.js');
  loadScript(dom, 'src/cards/cards.js');
  loadScript(dom, 'src/faq/faq.js');
  loadScript(dom, 'src/slider/slider.js');
  loadScript(dom, 'src/modal/modal.js');
  loadScript(dom, 'src/typography/typography.js');
  loadScript(dom, 'src/shopping-cart/shopping-cart.js');
  loadScript(dom, 'src/floating-cta/floating-cta.js');
  triggerDomReady(dom);

  // main.js global must survive
  assert.equal(typeof dom.window._scrollToTop, 'function',
    '_scrollToTop should not be overwritten by plugins');
});

test('plugins do not conflict with main.js body class lifecycle', () => {
  const dom = createDom('<div id="loader"></div>');
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  // Simulate main.js loader state
  dom.window.document.body.classList.add('is-loading');
  dom.window.document.body.classList.add('with-loader');

  // no-loadwaiting operates on same classes -- load it
  loadScript(dom, 'src/no-loadwaiting/no-loadwaiting.js');
  triggerDomReady(dom);

  // After init, no-loadwaiting should have taken control
  const body = dom.window.document.body;
  assert.ok(
    body.classList.contains('is-ready') || !body.classList.contains('is-loading'),
    'no-loadwaiting should remove is-loading or add is-ready'
  );
});

// ===== Pairwise: Cards + Grid Cluster on same DOM =====

test('cards and grid-cluster coexist on shared DOM', () => {
  const dom = createRichDom();
  dom.window.requestAnimationFrame = (cb) => cb();

  loadScript(dom, 'src/grid-cluster/grid-cluster.js');
  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const doc = dom.window.document;

  // Grid cluster created wrapper
  const gridWrapper = doc.querySelector('.theme-grid');
  assert.ok(gridWrapper, 'grid-cluster should create .theme-grid wrapper');

  // Cards created card items
  const cardItems = doc.querySelectorAll('.theme-card-item');
  assert.ok(cardItems.length >= 2, 'cards should create .theme-card-item elements');

  // No cross-contamination
  assert.equal(
    gridWrapper.querySelectorAll('.theme-card-item').length, 0,
    'grid wrapper should not contain card items'
  );
});

test('cards and grid-cluster use separate initialization markers', () => {
  const dom = createRichDom();
  dom.window.requestAnimationFrame = (cb) => cb();

  loadScript(dom, 'src/grid-cluster/grid-cluster.js');
  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const doc = dom.window.document;

  // Grid blocks use gridInitialized
  const gridItems = doc.querySelectorAll('.theme-grid > [data-grid-initialized]');
  gridItems.forEach(el => {
    assert.equal(el.dataset.gridInitialized, 'true');
  });

  // Cards containers use cardsInitialized
  const cardsContainer = doc.querySelector('[data-cards="cards"]');
  assert.equal(cardsContainer.getAttribute('data-cards-initialized'), 'true');
});

// ===== Modal + Shopping Cart interaction =====

test('modal respects preventWhenCartOpen across plugins', () => {
  const dom = createDom(
    '<div data-modal="test" class="container-component">' +
      '<div class="wrapper"><div class="inner">M</div></div>' +
    '</div>' +
    '<div class="theme-shopcart-panel open"></div>'
  );
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;
  dom.window.CarrdPluginOptions = { modal: { preventWhenCartOpen: true } };

  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  dom.window.CarrdModal.open('test');
  assert.equal(dom.window.CarrdModal.isOpen(), false,
    'modal should not open when cart panel is open');
});

// ===== Active plugins loaded together =====

test('all core plugins load without errors on shared DOM', () => {
  const dom = createRichDom();
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;
  mockViewport(dom, 1280);

  // Load active plugins together in the supported shared runtime mix
  const plugins = [
    'src/faq/faq.js',
    'src/accordeon/accordeon.js',
    'src/grid-cluster/grid-cluster.js',
    'src/cards/cards.js',
    'src/shopping-cart/shopping-cart.js',
    'src/slider/slider.js',
    'src/modal/modal.js',
    'src/typography/typography.js',
    'src/floating-cta/floating-cta.js',
  ];

  // Should not throw
  plugins.forEach(p => loadScript(dom, p));
  triggerDomReady(dom);

  // All APIs exposed
  assert.ok(dom.window.CarrdShoppingCart, 'CarrdShoppingCart API should exist');
  assert.ok(dom.window.CarrdSlider, 'CarrdSlider API should exist');
  assert.ok(dom.window.CarrdModal, 'CarrdModal API should exist');
  assert.ok(dom.window.CarrdTypography, 'CarrdTypography API should exist');

  // DOM markers set
  const doc = dom.window.document;
  assert.ok(doc.querySelector('.theme-grid'), 'grid wrapper should exist');
  assert.ok(doc.querySelector('.theme-card-item'), 'card item should exist');
  assert.ok(doc.querySelector('.theme-faq-question'), 'faq question should exist');
  assert.ok(doc.querySelector('.theme-accordeon-panel'), 'accordeon panel should exist');
  assert.ok(doc.querySelector('.theme-typography-h1'), 'typography heading should exist');
  assert.ok(doc.querySelector('[data-floating-clone="true"].theme-floating-cta'), 'floating cta clone should exist');
});
