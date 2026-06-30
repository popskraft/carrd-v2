const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  triggerDomReady,
  setPluginOptions,
  click
} = require('./helpers');

function mockRaf(dom) {
  const raf = (cb) => cb();
  dom.window.requestAnimationFrame = raf;
  dom.window.globalThis.requestAnimationFrame = raf;
}

test('modal opens/closes via API and toggles body lock', () => {
  const dom = createDom(
    '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact Us</h2><button>Inside</button></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdModal;
  const doc = dom.window.document;
  const modal = doc.querySelector('[data-modal="contact"]');

  assert.ok(api);
  api.open('contact');
  assert.equal(api.isOpen(), true);
  assert.ok(modal.classList.contains('is-open'));
  assert.ok(doc.body.classList.contains('modal-open'));
  assert.equal(modal.getAttribute('aria-hidden'), 'false');
  assert.equal(modal.getAttribute('aria-labelledby'), 'contact-title');

  api.close();
  assert.equal(api.isOpen(), false);
  assert.ok(!modal.classList.contains('is-open'));
  assert.ok(!doc.body.classList.contains('modal-open'));
  assert.equal(modal.getAttribute('aria-hidden'), 'true');
});

test('modal opens by click trigger and closes by overlay and Escape', () => {
  const dom = createDom(
    '<a id="trigger" href="#data-modal-contact">Open</a>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const modal = doc.querySelector('[data-modal="contact"]');
  click(dom, doc.getElementById('trigger'));
  assert.ok(modal.classList.contains('is-open'));

  const overlay = doc.querySelector('.theme-modal-overlay');
  click(dom, overlay);
  assert.ok(!modal.classList.contains('is-open'));

  dom.window.CarrdModal.open('contact');
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.ok(!modal.classList.contains('is-open'));
});

test('modal opens v2 data modal from namespaced hash trigger', () => {
  const dom = createDom(
    '<a id="trigger" href="#data-modal-contact">Open</a>' +
      '<div id="sectionContact">Native section</div>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const modal = doc.querySelector('[data-modal="contact"]');
  click(dom, doc.getElementById('trigger'));

  assert.ok(modal.classList.contains('is-open'));
  assert.equal(dom.window.CarrdModal.isOpen('contact'), true);
});

test('modal opens from the primary data-modal-open trigger alias', () => {
  const dom = createDom(
    '<button id="trigger" data-modal-open="contact">Open</button>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  click(dom, doc.getElementById('trigger'));

  assert.equal(doc.querySelector('[data-modal="contact"]').classList.contains('is-open'), true);
});

test('modal keeps legacy data-modal-target trigger alias as fallback', () => {
  const dom = createDom(
    '<button id="trigger" data-modal-target="contact">Open</button>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  click(dom, doc.getElementById('trigger'));

  assert.equal(doc.querySelector('[data-modal="contact"]').classList.contains('is-open'), true);
});

test('modal leaves native and missing plugin hashes alone', () => {
  const dom = createDom(
    '<a id="native" href="#sectionContact">Native</a>' +
      '<a id="missing" href="#data-modal-missing">Missing</a>' +
      '<section id="sectionContact">Native section</section>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const nativeEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const missingEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });

  assert.equal(dom.window.document.getElementById('native').dispatchEvent(nativeEvent), true);
  assert.equal(nativeEvent.defaultPrevented, false);
  assert.equal(dom.window.document.getElementById('missing').dispatchEvent(missingEvent), true);
  assert.equal(missingEvent.defaultPrevented, false);
  assert.equal(dom.window.CarrdModal.isOpen(), false);
});

test('modal falls back to aria-label when no visible title exists', () => {
  const dom = createDom(
    '<div data-modal="contact" class="container-component" data-modal-label="Contact modal"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const modal = dom.window.document.querySelector('[data-modal="contact"]');
  assert.equal(modal.getAttribute('aria-label'), 'Contact modal');
  assert.equal(modal.hasAttribute('aria-labelledby'), false);
});

test('modal respects preventWhenCartOpen config', () => {
  const dom = createDom(
    '<div class="theme-shopcart-panel open"></div>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  setPluginOptions(dom, {
    modal: {
      preventWhenCartOpen: true
    }
  });

  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const modal = dom.window.document.querySelector('[data-modal="contact"]');
  dom.window.CarrdModal.open('contact');
  assert.ok(!modal.classList.contains('is-open'));
  assert.equal(dom.window.CarrdModal.isOpen(), false);
});

test('modal init is idempotent for global bindings', () => {
  const dom = createDom(
    '<a id="trigger" href="#data-modal-contact">Open</a>' +
      '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Title</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  click(dom, dom.window.document.getElementById('trigger'));
  assert.equal(dom.window.document.querySelectorAll('.theme-modal-overlay').length, 1);
  assert.equal(dom.window.document.querySelector('[data-modal="contact"]').classList.contains('is-open'), true);
});

test('modal public API refresh scans new modals without duplicating overlay', () => {
  const dom = createDom(
    '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  dom.window.document.body.insertAdjacentHTML(
    'beforeend',
    '<div data-modal="dynamic" class="container-component"><div class="wrapper"><div class="inner"><h2>Dynamic</h2></div></div></div>'
  );

  assert.equal(typeof dom.window.CarrdModal.refresh, 'function');
  dom.window.CarrdModal.refresh();

  assert.equal(dom.window.document.querySelectorAll('.theme-modal-overlay').length, 1);
  assert.equal(dom.window.document.querySelector('[data-modal="dynamic"]').dataset.modalInitialized, 'true');
});
