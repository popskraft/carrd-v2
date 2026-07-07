const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady, click, setPluginOptions } = require('./helpers');

function accordeonHtml() {
  return (
    '<ul id="buttons04" class="buttons-component">' +
      '<li><a href="#data-accordeon-ppf" role="button"><svg></svg><span>Toggle</span></a></li>' +
    '</ul>' +
    '<div id="one" class="container-component" data-accordeon="ppf">One</div>' +
    '<div id="two" class="container-component" data-accordeon="ppf">Two</div>'
  );
}

test('accordeon initializes matching links and hides targets by default', () => {
  const dom = createDom(accordeonHtml());
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const button = doc.querySelector('a[href="#data-accordeon-ppf"]');
  const targets = doc.querySelectorAll('.theme-accordeon-panel');

  assert.equal(button.classList.contains('theme-accordeon-toggle'), true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(targets.length, 2);
  assert.equal(doc.getElementById('one').hidden, true);
  assert.equal(doc.getElementById('two').getAttribute('aria-hidden'), 'true');
});

test('accordeon supports clean data hash triggers', () => {
  const dom = createDom(
    '<a id="control" href="#data-accordeon-ppf" role="button">Toggle</a>' +
    '<div id="one" data-accordeon="ppf">One</div>' +
    '<div id="two" data-accordeon="ppf">Two</div>'
  );
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const control = doc.getElementById('control');

  assert.equal(control.getAttribute('aria-expanded'), 'false');
  click(dom, control);
  assert.equal(control.getAttribute('aria-expanded'), 'true');
  assert.equal(doc.getElementById('one').hidden, false);
  assert.equal(doc.getElementById('two').hidden, false);
});

test('accordeon toggles all targets in a group and syncs matching controls', () => {
  const dom = createDom(
    accordeonHtml() +
    '<a id="second-control" href="#data-accordeon-ppf" role="button">Toggle elsewhere</a>'
  );
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const firstButton = doc.querySelector('#buttons04 a');
  const secondButton = doc.getElementById('second-control');

  click(dom, firstButton);

  assert.equal(doc.getElementById('one').hidden, false);
  assert.equal(doc.getElementById('two').hidden, false);
  assert.equal(firstButton.getAttribute('aria-expanded'), 'true');
  assert.equal(secondButton.getAttribute('aria-expanded'), 'true');

  click(dom, secondButton);

  assert.equal(doc.getElementById('one').hidden, true);
  assert.equal(firstButton.getAttribute('aria-expanded'), 'false');
});

test('accordeon scrolls to the first target when opening by default', () => {
  const dom = createDom(accordeonHtml());
  dom.window.requestAnimationFrame = (callback) => callback();
  let scrollOptions = null;

  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  doc.getElementById('one').scrollIntoView = (options) => {
    scrollOptions = options;
  };

  click(dom, doc.querySelector('#buttons04 a'));

  assert.equal(scrollOptions.behavior, 'smooth');
  assert.equal(scrollOptions.block, 'start');
});

test('accordeon can disable scroll on open', () => {
  const dom = createDom(accordeonHtml());
  dom.window.requestAnimationFrame = (callback) => callback();
  let scrollCount = 0;

  setPluginOptions(dom, {
    accordeon: {
      scrollOnOpen: false
    }
  });

  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  doc.getElementById('one').scrollIntoView = () => {
    scrollCount += 1;
  };

  click(dom, doc.querySelector('#buttons04 a'));

  assert.equal(scrollCount, 0);
});

test('accordeon leaves unmatched and unrelated hash links alone', () => {
  const dom = createDom(
    '<a id="modal" href="#modal-contact" role="button">Modal</a>' +
    '<a id="missing" href="#data-accordeon-missing" role="button">Missing</a>' +
    '<a id="v2-missing" href="#data-accordeon-missing" role="button">Missing v2</a>' +
    '<div data-accordeon="ppf">PPF</div>'
  );
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const modalEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const missingEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const v2MissingEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });

  assert.equal(dom.window.document.getElementById('modal').dispatchEvent(modalEvent), true);
  assert.equal(modalEvent.defaultPrevented, false);
  assert.equal(dom.window.document.getElementById('missing').dispatchEvent(missingEvent), true);
  assert.equal(missingEvent.defaultPrevented, false);
  assert.equal(dom.window.document.getElementById('v2-missing').dispatchEvent(v2MissingEvent), true);
  assert.equal(v2MissingEvent.defaultPrevented, false);
});

test('accordeon prevents Carrd hash navigation only after finding targets', () => {
  const dom = createDom(accordeonHtml());
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const button = dom.window.document.querySelector('#buttons04 a');

  assert.equal(button.dispatchEvent(event), false);
  assert.equal(event.defaultPrevented, true);
});

test('accordeon supports defaultOpen and the clean target attribute', () => {
  const dom = createDom(
    '<a href="#data-accordeon-legacy" role="button">Legacy</a>' +
    '<div id="legacy" data-accordeon="legacy">Legacy target</div>'
  );
  setPluginOptions(dom, {
    accordeon: {
      defaultOpen: true
    }
  });

  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.getElementById('legacy').hidden, false);
  assert.equal(dom.window.document.querySelector('a').getAttribute('aria-expanded'), 'true');
});

test('accordeon public API opens, closes, and refreshes groups', () => {
  const dom = createDom(accordeonHtml());
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const api = dom.window.CarrdAccordeon;
  api.open('ppf');
  assert.equal(api.isOpen('ppf'), true);
  assert.equal(dom.window.document.getElementById('one').hidden, false);

  api.close('ppf');
  assert.equal(api.isOpen('ppf'), false);

  dom.window.document.body.insertAdjacentHTML(
    'beforeend',
    '<a href="#data-accordeon-added" role="button">Added</a><div id="added" data-accordeon="added">Added</div>'
  );
  api.refresh();

  assert.equal(api.getTargets('added').length, 1);
  assert.equal(dom.window.document.getElementById('added').hidden, true);
});

test('accordeon initializes a multi-target ppf group after clean hash migration', () => {
  // Self-contained fixture (independent of the local carrd-source reference).
  // Starts from the legacy "#accordeon-ppf" hash and applies the clean-hash
  // migration to "#data-accordeon-ppf", then verifies a 6-target group.
  const legacyHtml =
    '<div id="buttons04" class="buttons-component">' +
      '<a href="#accordeon-ppf" role="button"><svg></svg><span>Toggle</span></a>' +
    '</div>' +
    '<div id="container08" class="container-component" data-accordeon="ppf">08</div>' +
    '<div id="container09" class="container-component" data-accordeon="ppf">09</div>' +
    '<div id="container10" class="container-component" data-accordeon="ppf">10</div>' +
    '<div id="container11" class="container-component" data-accordeon="ppf">11</div>' +
    '<div id="container16" class="container-component" data-accordeon="ppf">16</div>' +
    '<div id="container17" class="container-component" data-accordeon="ppf">17</div>';

  const html = legacyHtml.replace('href="#accordeon-ppf"', 'href="#data-accordeon-ppf"');
  const dom = createDom(html);

  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const button = doc.querySelector('#buttons04 a[href="#data-accordeon-ppf"]');

  assert.equal(doc.querySelectorAll('[data-accordeon="ppf"]').length, 6);
  assert.equal(doc.getElementById('container08').hidden, true);

  click(dom, button);

  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(doc.getElementById('container08').hidden, false);
  assert.equal(doc.getElementById('container16').hidden, false);
});

test('accordeon links controls to their panels via aria-controls', () => {
  const dom = createDom(accordeonHtml());
  loadScript(dom, 'src/accordeon/accordeon.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const button = doc.querySelector('a[href="#data-accordeon-ppf"]');
  const controls = (button.getAttribute('aria-controls') || '').split(' ').filter(Boolean);

  assert.equal(controls.length, 2);
  assert.ok(controls.includes('one'));
  assert.ok(controls.includes('two'));
});
