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
    '<div id="modalContact" class="container-component modal"><div class="wrapper"><div class="inner"><h2>Contact Us</h2><button>Inside</button></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdModalV2;
  const doc = dom.window.document;
  const modal = doc.getElementById('modalContact');

  assert.ok(api);
  api.open('modalContact');
  assert.equal(api.isOpen(), true);
  assert.ok(modal.classList.contains('is-open'));
  assert.ok(doc.body.classList.contains('modal-open'));
  assert.equal(modal.getAttribute('aria-hidden'), 'false');
  assert.equal(modal.getAttribute('aria-labelledby'), 'modalContact-title');

  api.close();
  assert.equal(api.isOpen(), false);
  assert.ok(!modal.classList.contains('is-open'));
  assert.ok(!doc.body.classList.contains('modal-open'));
  assert.equal(modal.getAttribute('aria-hidden'), 'true');
});

test('modal opens by click trigger and closes by overlay and Escape', () => {
  const dom = createDom(
    '<a id="trigger" href="#modalContact">Open</a>' +
      '<div id="modalContact" class="container-component modal"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const modal = doc.getElementById('modalContact');
  click(dom, doc.getElementById('trigger'));
  assert.ok(modal.classList.contains('is-open'));

  const overlay = doc.querySelector('.theme-modal-overlay');
  click(dom, overlay);
  assert.ok(!modal.classList.contains('is-open'));

  dom.window.CarrdModalV2.open('modalContact');
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.ok(!modal.classList.contains('is-open'));
});

test('modal opens v2 data modal from namespaced hash trigger', () => {
  const dom = createDom(
    '<a id="trigger" href="#data-modal-v2-contact">Open</a>' +
      '<div id="sectionContact">Native section</div>' +
      '<div data-modal-v2="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const modal = doc.querySelector('[data-modal-v2="contact"]');
  click(dom, doc.getElementById('trigger'));

  assert.ok(modal.classList.contains('is-open'));
  assert.equal(dom.window.CarrdModalV2.isOpen('contact'), true);
});

test('modal opens from the primary data-modal-v2-open trigger alias', () => {
  const dom = createDom(
    '<button id="trigger" data-modal-v2-open="contact">Open</button>' +
      '<div data-modal-v2="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  click(dom, doc.getElementById('trigger'));

  assert.equal(doc.querySelector('[data-modal-v2="contact"]').classList.contains('is-open'), true);
});

test('modal keeps legacy data-modal-v2-target trigger alias as fallback', () => {
  const dom = createDom(
    '<button id="trigger" data-modal-v2-target="contact">Open</button>' +
      '<div data-modal-v2="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  click(dom, doc.getElementById('trigger'));

  assert.equal(doc.querySelector('[data-modal-v2="contact"]').classList.contains('is-open'), true);
});

test('modal leaves native and missing plugin hashes alone', () => {
  const dom = createDom(
    '<a id="native" href="#sectionContact">Native</a>' +
      '<a id="missing" href="#data-modal-v2-missing">Missing</a>' +
      '<section id="sectionContact">Native section</section>' +
      '<div data-modal-v2="contact" class="container-component"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const nativeEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const missingEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });

  assert.equal(dom.window.document.getElementById('native').dispatchEvent(nativeEvent), true);
  assert.equal(nativeEvent.defaultPrevented, false);
  assert.equal(dom.window.document.getElementById('missing').dispatchEvent(missingEvent), true);
  assert.equal(missingEvent.defaultPrevented, false);
  assert.equal(dom.window.CarrdModalV2.isOpen(), false);
});

test('modal falls back to aria-label when no visible title exists', () => {
  const dom = createDom(
    '<div id="modalContact" class="container-component modal" data-modal-v2-label="Contact modal"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const modal = dom.window.document.getElementById('modalContact');
  assert.equal(modal.getAttribute('aria-label'), 'Contact modal');
  assert.equal(modal.hasAttribute('aria-labelledby'), false);
});

test('modal respects preventWhenCartOpen config', () => {
  const dom = createDom(
    '<div class="theme-shopcart-panel open"></div>' +
      '<div id="modalContact" class="container-component modal"><div class="wrapper"><div class="inner">Content</div></div></div>'
  );
  mockRaf(dom);
  setPluginOptions(dom, {
    modal: {
      preventWhenCartOpen: true
    }
  });

  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const modal = dom.window.document.getElementById('modalContact');
  dom.window.CarrdModalV2.open('modalContact');
  assert.ok(!modal.classList.contains('is-open'));
  assert.equal(dom.window.CarrdModalV2.isOpen(), false);
});

test('modal init is idempotent for global bindings', () => {
  const dom = createDom(
    '<a id="trigger" href="#modalContact">Open</a>' +
      '<div id="modalContact" class="container-component modal"><div class="wrapper"><div class="inner"><h2>Title</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);
  triggerDomReady(dom);

  click(dom, dom.window.document.getElementById('trigger'));
  assert.equal(dom.window.document.querySelectorAll('.theme-modal-overlay').length, 1);
  assert.equal(dom.window.document.getElementById('modalContact').classList.contains('is-open'), true);
});

test('modal public API refresh scans new modals without duplicating overlay', () => {
  const dom = createDom(
    '<div id="modalContact" class="container-component modal"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  dom.window.document.body.insertAdjacentHTML(
    'beforeend',
    '<div id="modalDynamic" class="container-component modal"><div class="wrapper"><div class="inner"><h2>Dynamic</h2></div></div></div>'
  );

  assert.equal(typeof dom.window.CarrdModalV2.refresh, 'function');
  dom.window.CarrdModalV2.refresh();

  assert.equal(dom.window.document.querySelectorAll('.theme-modal-overlay').length, 1);
  assert.equal(dom.window.document.getElementById('modalDynamic').dataset.modalInitialized, 'true');
});
