const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady, click, mockViewport } = require('./helpers');

/*
 * Idempotency tests: double DOMContentLoaded must not duplicate
 * DOM elements, event listeners, or initialization markers.
 */

test('grid-cluster does not double-wrap on repeated init', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div data-grid="features" data-grid-cols="2">A</div>' +
      '<div data-grid="features">B</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster/grid-cluster.js');
  triggerDomReady(dom);
  triggerDomReady(dom); // second init

  const wrappers = dom.window.document.querySelectorAll('.theme-grid');
  assert.equal(wrappers.length, 1, 'should have exactly 1 wrapper after double init');
});

test('cards does not double-wrap on repeated init', () => {
  const dom = createDom(
    '<div data-cards="cards"><div class="wrapper"><div class="inner">' +
      '<div>A</div><div>B</div>' +
    '</div></div></div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);
  triggerDomReady(dom); // second init

  const items = dom.window.document.querySelectorAll('.theme-card-item');
  assert.equal(items.length, 2, 'should have exactly 2 card items after double init');
});

test('faq does not duplicate questions on repeated init', () => {
  const dom = createDom(
    '<div data-faq="main">' +
      '<hr class="divider-component">' +
      '<h2>Q1</h2><p>A1</p>' +
      '<hr class="divider-component">' +
      '<h2>Q2</h2><p>A2</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );

  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const questions = dom.window.document.querySelectorAll('.theme-faq-question');
  assert.equal(questions.length, 2, 'should have exactly 2 FAQ questions after double init');
});

test('slider does not duplicate wrappers on repeated init', () => {
  const dom = createDom(
    '<div data-slider>Slide 1</div>'
  );
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const wrappers = dom.window.document.querySelectorAll('.theme-slider-wrapper');
  assert.equal(wrappers.length, 1, 'should have exactly 1 slider wrapper after double init');
});

test('modal does not duplicate overlays on repeated init', () => {
  const dom = createDom(
    '<div data-modal="test" class="container-component">' +
      '<div class="wrapper"><div class="inner">M</div></div>' +
    '</div>'
  );
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const overlays = dom.window.document.querySelectorAll('.theme-modal-overlay');
  assert.equal(overlays.length, 1, 'should have exactly 1 modal overlay after double init');
});

test('typography does not double-process paragraphs on repeated init', () => {
  const dom = createDom(
    '<div class="txt"><span class="p"># Title</span></div>'
  );

  loadScript(dom, 'src/typography/typography.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const headings = dom.window.document.querySelectorAll('.theme-typography-h1');
  assert.equal(headings.length, 1, 'should have exactly 1 heading after double init');
});

test('header-nav does not duplicate toggle on repeated init', () => {
  const dom = createDom(
    '<header id="header">' +
      '<div class="container-component">' +
          '<div class="wrapper"><div class="inner">' +
            '<div>' +
            '<div class="links-component header-mobile-hide">' +
              '<nav><a href="#a">A</a></nav>' +
            '</div>' +
          '</div>' +
          '<div></div>' +
          '<div><ul class="buttons-component"><li><a href="#b">B</a></li></ul></div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const toggles = dom.window.document.querySelectorAll('.theme-header-nav-toggle');
  assert.equal(toggles.length, 1, 'should have exactly 1 toggle after double init');
});

test('floating-cta does not duplicate initialization on repeated init', () => {
  const dom = createDom(
    '<div><ul data-floating="contact" class="buttons-component">' +
      '<li><a href="#contact">Order</a></li>' +
    '</ul></div><div id="contact"></div>'
  );

  loadScript(dom, 'src/floating-cta/floating-cta.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const floatingItems = dom.window.document.querySelectorAll('[data-floating-clone="true"]');
  assert.equal(floatingItems.length, 1, 'should have exactly 1 floating CTA clone after double init');
  assert.equal(dom.window.document.querySelector('[data-floating="contact"]').getAttribute('data-floating-initialized'), 'true');
});

test('switcher does not duplicate bindings on repeated init', () => {
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="switcher">' +
        '<li><a href="#" role="button">One</a></li>' +
        '<li><a href="#" role="button">Two</a></li>' +
      '</ul>' +
      '<p id="one" class="switcher-1">One</p>' +
      '<p id="two" class="switcher-2">Two</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const buttons = dom.window.document.querySelectorAll('.theme-switcher-button');
  const panels = dom.window.document.querySelectorAll('.theme-switcher-panel');
  assert.equal(buttons.length, 2, 'should have exactly 2 switcher buttons after double init');
  assert.equal(panels.length, 2, 'should have exactly 2 switcher panels after double init');
});

test('accordeon does not duplicate bindings on repeated init', () => {
  const dom = createDom(
    '<a href="#data-accordeon-ppf" role="button">Toggle</a>' +
    '<div data-accordeon="ppf">Panel</div>'
  );

  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  const buttons = dom.window.document.querySelectorAll('.theme-accordeon-toggle');
  const panels = dom.window.document.querySelectorAll('.theme-accordeon-panel');
  assert.equal(buttons.length, 1, 'should have exactly 1 accordeon button after double init');
  assert.equal(panels.length, 1, 'should have exactly 1 accordeon panel after double init');

  click(dom, buttons[0]);
  assert.equal(panels[0].hidden, false, 'single click should open after double init');
});
