const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, setPluginOptions, triggerDomReady, mockViewport } = require('./helpers');

function mockScrollState(dom, value) {
  Object.defineProperty(dom.window, 'scrollY', {
    value,
    writable: true,
    configurable: true
  });
  Object.defineProperty(dom.window, 'pageYOffset', {
    value,
    writable: true,
    configurable: true
  });
}

test('floating-cta clones all named data-floating-v2 elements and reveals clones after threshold', () => {
  const dom = createDom(
    '<div>' +
      '<a id="source-one" data-floating-v2="contact" data-floating-v2-position="top-left" href="#contact">Call</a>' +
      '<a id="source-two" data-floating-v2="order" data-floating-v2-position="bottom-center" href="#order">Order</a>' +
    '</div>' +
    '<div id="contact"></div><div id="order"></div>'
  );
  mockScrollState(dom, 0);
  setPluginOptions(dom, {
    floatingCta: {
      scrollY: 200
    }
  });

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const sources = dom.window.document.querySelectorAll('[data-floating-v2]');
  const floatingItems = dom.window.document.querySelectorAll('[data-floating-v2-clone="true"]');

  assert.equal(sources.length, 2);
  assert.equal(floatingItems.length, 2);
  sources.forEach(item => {
    assert.equal(item.classList.contains('theme-floating-cta'), false);
    assert.equal(item.getAttribute('aria-hidden'), null);
    assert.equal(item.getAttribute('data-floating-v2-initialized'), 'true');
  });
  floatingItems.forEach(item => {
    assert.equal(item.classList.contains('theme-floating-cta'), true);
    assert.equal(item.classList.contains('theme-floating-cta-clone'), true);
    assert.equal(item.classList.contains('is-visible'), false);
    assert.equal(item.getAttribute('aria-hidden'), 'true');
    assert.equal(item.hasAttribute('id'), false);
  });

  dom.window.scrollY = 200;
  dom.window.pageYOffset = 200;
  dom.window.dispatchEvent(new dom.window.Event('scroll'));

  floatingItems.forEach(item => {
    assert.equal(item.classList.contains('is-visible'), true);
    assert.equal(item.getAttribute('aria-hidden'), 'false');
  });
});

test('floating-cta ignores elements without a valid data-floating-v2 name', () => {
  const dom = createDom(
    '<a id="legacy" href="#contact">Legacy</a>' +
    '<a data-floating-v2="invalid name" href="#contact">Broken</a>' +
    '<a data-floating-v2="floating" href="#contact">Floating</a>'
  );

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('legacy').classList.contains('theme-floating-cta'), false);
  assert.equal(doc.querySelector('[data-floating-v2="invalid name"]').classList.contains('theme-floating-cta'), false);
  assert.equal(doc.querySelector('[data-floating-v2="floating"]').classList.contains('theme-floating-cta'), false);
  assert.equal(doc.querySelector('[data-floating-v2-clone="true"]').classList.contains('theme-floating-cta'), true);
});

test('floating-cta normalizes missing or invalid positions to bottom-right', () => {
  const dom = createDom(
    '<a id="missing" data-floating-v2="missing" href="#contact">Missing</a>' +
    '<a id="invalid" data-floating-v2="invalid" data-floating-v2-position="middle" href="#contact">Invalid</a>'
  );

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const clones = doc.querySelectorAll('[data-floating-v2-clone="true"]');
  assert.equal(clones[0].getAttribute('data-floating-v2-position'), 'bottom-right');
  assert.equal(clones[1].getAttribute('data-floating-v2-position'), 'bottom-right');
});

test('floating-cta accepts all supported positions', () => {
  const positions = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
  ];
  const dom = createDom(
    positions.map(position =>
      `<a data-floating-v2="${position}" data-floating-v2-position="${position}" href="#contact">${position}</a>`
    ).join('')
  );

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const actualPositions = Array.from(dom.window.document.querySelectorAll('[data-floating-v2-clone="true"]'))
    .map(item => item.getAttribute('data-floating-v2-position'));
  assert.deepEqual(actualPositions, positions);
});

test('floating-cta supports per-viewport position overrides with fallback to base position', () => {
  const dom = createDom(
    '<a data-floating-v2="contact" ' +
      'data-floating-v2-position="bottom-right" ' +
      'data-floating-v2-position-mobile="top-center" ' +
      'href="#contact">Contact</a>' +
    '<div id="contact"></div>'
  );
  mockScrollState(dom, 300);
  setPluginOptions(dom, {
    floatingCta: {
      scrollY: 200
    }
  });

  mockViewport(dom, 375);
  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const clone = dom.window.document.querySelector('[data-floating-v2-clone="true"]');
  assert.equal(clone.getAttribute('data-floating-v2-position'), 'top-center');

  mockViewport(dom, 1280);
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(clone.getAttribute('data-floating-v2-position'), 'bottom-right');
});

test('floating-cta falls back from viewport overrides to base position', () => {
  const dom = createDom(
    '<a data-floating-v2="contact" data-floating-v2-position="top-right" href="#contact">Contact</a>' +
    '<div id="contact"></div>'
  );
  mockScrollState(dom, 300);
  mockViewport(dom, 375);

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const clone = dom.window.document.querySelector('[data-floating-v2-clone="true"]');
  assert.equal(clone.getAttribute('data-floating-v2-position'), 'top-right');

  mockViewport(dom, 1280);
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(clone.getAttribute('data-floating-v2-position'), 'top-right');
});

test('floating-cta supports data-floating-v2-hide mobile per element', () => {
  const dom = createDom(
    '<a data-floating-v2="mobile-hidden" data-floating-v2-hide="mobile" href="#contact">Mobile hidden</a>' +
    '<a data-floating-v2="always-visible" href="#contact">Always visible</a>' +
    '<div id="contact"></div>'
  );
  mockViewport(dom, 375);
  mockScrollState(dom, 300);
  setPluginOptions(dom, {
    floatingCta: {
      scrollY: 200
    }
  });

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const clones = dom.window.document.querySelectorAll('[data-floating-v2-clone="true"]');
  assert.equal(clones[0].getAttribute('data-floating-v2-hide'), 'mobile');
  assert.equal(clones[0].classList.contains('is-visible'), false);
  assert.equal(clones[0].getAttribute('aria-hidden'), 'true');
  assert.equal(clones[1].classList.contains('is-visible'), true);
  assert.equal(clones[1].getAttribute('aria-hidden'), 'false');
});

test('floating-cta supports data-floating-v2-hide desktop per element', () => {
  const dom = createDom(
    '<a data-floating-v2="desktop-hidden" data-floating-v2-hide="desktop" href="#contact">Desktop hidden</a>' +
    '<a data-floating-v2="always-visible" href="#contact">Always visible</a>' +
    '<div id="contact"></div>'
  );
  mockViewport(dom, 1280);
  mockScrollState(dom, 300);
  setPluginOptions(dom, {
    floatingCta: {
      scrollY: 200
    }
  });

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const clones = dom.window.document.querySelectorAll('[data-floating-v2-clone="true"]');
  assert.equal(clones[0].getAttribute('data-floating-v2-hide'), 'desktop');
  assert.equal(clones[0].classList.contains('is-visible'), false);
  assert.equal(clones[0].getAttribute('aria-hidden'), 'true');
  assert.equal(clones[1].classList.contains('is-visible'), true);
  assert.equal(clones[1].getAttribute('aria-hidden'), 'false');
});
