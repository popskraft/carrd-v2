const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  triggerDomReady,
  click,
  runAxe
} = require('./helpers');

function mockRaf(dom) {
  const raf = (cb) => cb();
  dom.window.requestAnimationFrame = raf;
  dom.window.globalThis.requestAnimationFrame = raf;
}

async function assertNoCriticalViolations(results, label) {
  const disallowed = results.violations.filter((violation) =>
    !['region', 'document-title', 'html-has-lang', 'landmark-one-main', 'page-has-heading-one', 'color-contrast'].includes(violation.id)
  );
  assert.equal(
    disallowed.length,
    0,
    `${label} has axe violations: ${disallowed.map((item) => item.id).join(', ')}`
  );
}

test('axe: modal surface has no critical accessibility violations', async () => {
  const dom = createDom(
    '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner">' +
      '<h2>Contact Us</h2><button>Inside</button>' +
    '</div></div></div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal/modal.js');
  triggerDomReady(dom);
  dom.window.CarrdModal.open('contact');

  const modal = dom.window.document.querySelector('[data-modal="contact"]');
  const results = await runAxe(dom, modal);
  await assertNoCriticalViolations(results, 'modal');
});

test('axe: faq surface has no critical accessibility violations', async () => {
  const dom = createDom(
    '<div data-faq="main">' +
      '<hr class="divider-component"><h2>Q1</h2><p>A1</p>' +
      '<hr class="divider-component"><h2>Q2</h2><p>A2</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);
  click(dom, dom.window.document.querySelector('.theme-faq-trigger'));

  const results = await runAxe(dom, dom.window.document.querySelector('[data-faq="main"]'));
  await assertNoCriticalViolations(results, 'faq');
});

test('axe: accordeon surface has no critical accessibility violations', async () => {
  const dom = createDom(
    '<div>' +
      '<a id="control" href="#data-accordeon-ppf" role="button">Toggle</a>' +
      '<div id="one" data-accordeon="ppf">One</div>' +
    '</div>'
  );
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);
  click(dom, dom.window.document.getElementById('control'));

  const results = await runAxe(dom, dom.window.document.body.firstElementChild);
  await assertNoCriticalViolations(results, 'accordeon');
});

test('axe: switcher surface has no critical accessibility violations', async () => {
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

  const results = await runAxe(dom, dom.window.document.querySelector('section'));
  await assertNoCriticalViolations(results, 'switcher');
});
