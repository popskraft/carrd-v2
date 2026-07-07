// Accessibility contract tests for interactive plugins.
// Uses the existing jsdom harness (no external a11y dependency) to lock the
// WCAG-critical invariants: correct roles, accessible names, coherent
// aria-expanded/aria-hidden/aria-pressed state, and a working modal focus trap.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  triggerDomReady,
  click,
  keydown
} = require('./helpers');

function mockRaf(dom) {
  const raf = (cb) => cb();
  dom.window.requestAnimationFrame = raf;
  dom.window.globalThis.requestAnimationFrame = raf;
}

test('a11y: modal exposes dialog role, accessible name and toggles aria-hidden', () => {
  const dom = createDom(
    '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner">' +
      '<h2>Contact Us</h2><button>Inside</button>' +
    '</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const api = dom.window.CarrdModal;
  const modal = doc.querySelector('[data-modal="contact"]');

  assert.equal(modal.getAttribute('role'), 'dialog');
  assert.equal(modal.getAttribute('aria-modal'), 'true');
  // Accessible name via labelledby (heading) or explicit label.
  const hasName = modal.getAttribute('aria-labelledby') || modal.getAttribute('aria-label');
  assert.ok(hasName, 'modal must have an accessible name');

  assert.equal(modal.getAttribute('aria-hidden'), 'true');
  api.open('contact');
  assert.equal(modal.getAttribute('aria-hidden'), 'false');
  api.close();
  assert.equal(modal.getAttribute('aria-hidden'), 'true');
});

test('a11y: modal Tab focus trap wraps within the dialog', () => {
  const dom = createDom(
    '<div data-modal="trap" class="container-component"><div class="wrapper"><div class="inner">' +
      '<h2>Trap</h2><button id="b1">One</button><button id="b2">Two</button>' +
    '</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  dom.window.CarrdModal.open('trap');

  const focusables = doc.querySelector('[data-modal="trap"]')
    .querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  last.focus();
  assert.equal(doc.activeElement, last);
  keydown(dom, doc, 'Tab');
  assert.equal(doc.activeElement, first, 'Tab on last focusable wraps to first');

  first.focus();
  keydown(dom, doc, 'Tab', { shiftKey: true });
  assert.equal(doc.activeElement, last, 'Shift+Tab on first focusable wraps to last');
});

test('a11y: faq trigger links to answer and keeps aria-expanded/aria-hidden coherent', () => {
  const dom = createDom(
    '<div data-faq="main">' +
      '<hr class="divider-component"><h2>Q1</h2><p>A1</p>' +
      '<hr class="divider-component"><h2>Q2</h2><p>A2</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const trigger = doc.querySelector('.theme-faq-trigger');
  const answer = doc.querySelector('.theme-faq-answer');

  assert.equal(trigger.getAttribute('aria-controls'), answer.id);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(answer.getAttribute('aria-hidden'), 'true');

  click(dom, trigger);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(answer.getAttribute('aria-hidden'), 'false');
});

test('a11y: accordeon control aria-expanded mirrors target aria-hidden', () => {
  const dom = createDom(
    '<a id="control" href="#data-accordeon-ppf" role="button">Toggle</a>' +
    '<div id="one" data-accordeon="ppf">One</div>'
  );
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const control = doc.getElementById('control');
  const target = doc.getElementById('one');

  assert.equal(control.getAttribute('aria-expanded'), 'false');
  assert.equal(target.getAttribute('aria-hidden'), 'true');

  click(dom, control);
  assert.equal(control.getAttribute('aria-expanded'), 'true');
  assert.equal(target.getAttribute('aria-hidden'), 'false');
});

test('a11y: switcher controller is a group with aria-pressed reflecting state', () => {
  const dom = createDom(
    '<section>' +
      '<ul id="buttons01" class="buttons-component" data-switcher="switcher">' +
        '<li><a href="#" class="n99" role="button">Var 1</a></li>' +
        '<li><a href="#" class="n02" role="button">Var 2</a></li>' +
      '</ul>' +
      '<div class="container-component"><div class="wrapper"><div class="inner">' +
        '<p id="t1" class="switcher-1">State 1</p>' +
        '<p id="t2" class="switcher-2">State 2</p>' +
      '</div></div></div>' +
    '</section>'
  );
  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const controller = doc.getElementById('buttons01');
  const buttons = controller.querySelectorAll('a');

  assert.equal(controller.getAttribute('role'), 'group');
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'true');
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'false');
  assert.equal(doc.getElementById('t2').getAttribute('aria-hidden'), 'true');
});
