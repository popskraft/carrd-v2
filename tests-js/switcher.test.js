const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDom, loadScript, triggerDomReady, click, setPluginOptions } = require('./helpers');

function createSwitcherDom() {
  return createDom(
    '<section id="home-section">' +
      '<h2>Switcher</h2>' +
      '<ul id="buttons01" class="buttons-component instance-1 style-2" data-switcher="switcher">' +
        '<li><a href="#" class="n99" role="button">Switcher Var 1</a></li>' +
        '<li><a href="#" class="n02" role="button">Switcher Var 2</a></li>' +
      '</ul>' +
      '<div id="container13" class="container-component instance-13 style-3 grid-4 justify default">' +
        '<div class="wrapper"><div class="inner">' +
          '<p id="text37" class="text-component instance-37 style-6 switcher-1">State 1</p>' +
          '<p id="text29" class="text-component instance-29 style-6 switcher-2">State 2</p>' +
        '</div></div>' +
      '</div>' +
    '</section>'
  );
}

test('switcher initializes from data-switcher and hides inactive targets', () => {
  const dom = createSwitcherDom();

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const firstButton = doc.querySelector('#buttons01 a');
  const secondButton = doc.querySelectorAll('#buttons01 a')[1];
  const firstTarget = doc.getElementById('text37');
  const secondTarget = doc.getElementById('text29');

  assert.ok(dom.window.CarrdSwitcher);
  assert.equal(firstButton.classList.contains('is-active'), true);
  assert.equal(firstButton.getAttribute('aria-pressed'), 'true');
  assert.equal(secondButton.classList.contains('is-inactive'), true);
  assert.equal(secondButton.getAttribute('aria-pressed'), 'false');
  assert.equal(firstTarget.hidden, false);
  assert.equal(firstTarget.getAttribute('aria-hidden'), 'false');
  assert.equal(secondTarget.hidden, true);
  assert.equal(secondTarget.getAttribute('aria-hidden'), 'true');
});

test('switcher maps by button order rather than Carrd n classes', () => {
  const dom = createSwitcherDom();

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const buttons = doc.querySelectorAll('#buttons01 a');

  assert.equal(buttons[0].className.includes('n99'), true);
  assert.equal(doc.getElementById('text37').hidden, false);
  assert.equal(doc.getElementById('text29').hidden, true);

  click(dom, buttons[1]);

  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);
});

test('switcher blocks anchor hash behavior and delegated click handlers', () => {
  const dom = createSwitcherDom();
  const doc = dom.window.document;
  const delegatedClicks = [];

  doc.addEventListener('click', event => {
    delegatedClicks.push(event.target);
  });

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const secondButton = doc.querySelectorAll('#buttons01 a')[1];
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const dispatchResult = secondButton.dispatchEvent(event);

  assert.equal(dispatchResult, false);
  assert.equal(event.defaultPrevented, true);
  assert.equal(delegatedClicks.length, 0);
  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);
});

test('switcher keeps pointer cursor even when Carrd button has no href', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'switcher', 'switcher.css'), 'utf-8');
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="switcher">' +
        '<li><a class="n01" role="button">One</a></li>' +
        '<li><a class="n02" role="button">Two</a></li>' +
      '</ul>' +
      '<p class="switcher-1">One</p>' +
      '<p class="switcher-2">Two</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  assert.match(css, /\[data-switcher\][^{]*\.theme-switcher-button\s*{[^}]*cursor:\s*pointer;/s);
  // clean switcher buttons keep the active-state styling inside the controller scope
  assert.match(css, /\[data-switcher\]\s+\.theme-switcher-button\.is-active/s);
  assert.equal(dom.window.document.querySelector('.theme-switcher-button').hasAttribute('href'), false);
});

test('switcher finds targets in nearest section when controller is outside target container', () => {
  const dom = createSwitcherDom();

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const controller = doc.getElementById('buttons01');
  const targetContainer = doc.getElementById('container13');

  assert.equal(controller.closest('.container-component'), null);
  assert.equal(targetContainer.contains(doc.getElementById('text37')), true);
  assert.equal(doc.getElementById('text37').classList.contains('theme-switcher-panel'), true);
  assert.equal(doc.getElementById('text29').classList.contains('theme-switcher-panel'), true);
});

test('switcher supports multiple targets for one index', () => {
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="pricing">' +
        '<li><a href="#" role="button">Monthly</a></li>' +
        '<li><a href="#" role="button">Yearly</a></li>' +
      '</ul>' +
      '<p id="price-month" class="pricing-1">Monthly price</p>' +
      '<p id="copy-month" class="pricing-1">Monthly copy</p>' +
      '<p id="price-year" class="pricing-2">Yearly price</p>' +
      '<p id="copy-year" class="pricing-2">Yearly copy</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const secondButton = doc.querySelectorAll('[data-switcher] a')[1];
  click(dom, secondButton);

  assert.equal(doc.getElementById('price-month').hidden, true);
  assert.equal(doc.getElementById('copy-month').hidden, true);
  assert.equal(doc.getElementById('price-year').hidden, false);
  assert.equal(doc.getElementById('copy-year').hidden, false);
});

test('switcher supports v2 data targets with explicit indexes', () => {
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="pricing">' +
        '<li><a href="#" role="button">Monthly</a></li>' +
        '<li><a href="#" role="button">Yearly</a></li>' +
      '</ul>' +
      '<p id="price-month" data-switcher-target="pricing" data-switcher-index="1">Monthly price</p>' +
      '<p id="copy-month" data-switcher-target="pricing" data-switcher-index="1">Monthly copy</p>' +
      '<p id="price-year" data-switcher-target="pricing" data-switcher-index="2">Yearly price</p>' +
      '<p id="copy-year" data-switcher-target="pricing" data-switcher-index="2">Yearly copy</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  click(dom, doc.querySelectorAll('[data-switcher] a')[1]);

  assert.equal(doc.getElementById('price-month').hidden, true);
  assert.equal(doc.getElementById('copy-month').hidden, true);
  assert.equal(doc.getElementById('price-year').hidden, false);
  assert.equal(doc.getElementById('copy-year').hidden, false);
});

test('switcher supports v2 data targets by DOM order when indexes are omitted', () => {
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="pricing">' +
        '<li><a href="#" role="button">Monthly</a></li>' +
        '<li><a href="#" role="button">Yearly</a></li>' +
      '</ul>' +
      '<p id="monthly" data-switcher-target="pricing">Monthly</p>' +
      '<p id="yearly" data-switcher-target="pricing">Yearly</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('monthly').hidden, false);
  assert.equal(doc.getElementById('yearly').hidden, true);

  click(dom, doc.querySelectorAll('[data-switcher] a')[1]);

  assert.equal(doc.getElementById('monthly').hidden, true);
  assert.equal(doc.getElementById('yearly').hidden, false);
});

test('switcher syncs controllers with the same data-switcher name', () => {
  const dom = createDom(
    '<section>' +
      '<ul id="buttons07" class="buttons-component instance-7 style-2" data-switcher="switcher">' +
        '<li><a class="n01" role="button">Switcher Var 1</a></li>' +
        '<li><a class="n02" role="button">Switcher Var 2</a></li>' +
      '</ul>' +
      '<p id="top-one" class="switcher-1">Top one</p>' +
      '<p id="top-two" class="switcher-2">Top two</p>' +
    '</section>' +
    '<section>' +
      '<ul id="buttons06" class="buttons-component instance-6 style-2" data-switcher="switcher">' +
        '<li><a class="n01" role="button">Switcher Var 1</a></li>' +
        '<li><a class="n02" role="button">Switcher Var 2</a></li>' +
      '</ul>' +
      '<p id="bottom-one" class="switcher-1">Bottom one</p>' +
      '<p id="bottom-two" class="switcher-2">Bottom two</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const topButtons = doc.querySelectorAll('#buttons07 a');
  const bottomButtons = doc.querySelectorAll('#buttons06 a');

  click(dom, bottomButtons[1]);

  assert.equal(topButtons[0].getAttribute('aria-pressed'), 'false');
  assert.equal(topButtons[1].getAttribute('aria-pressed'), 'true');
  assert.equal(bottomButtons[0].getAttribute('aria-pressed'), 'false');
  assert.equal(bottomButtons[1].getAttribute('aria-pressed'), 'true');
  assert.equal(doc.getElementById('top-one').hidden, true);
  assert.equal(doc.getElementById('top-two').hidden, false);
  assert.equal(doc.getElementById('bottom-one').hidden, true);
  assert.equal(doc.getElementById('bottom-two').hidden, false);
});

test('switcher maps same-name data targets by explicit index', () => {
  const dom = createDom(
    '<main class="site-main">' +
      '<section id="switcher-controls">' +
        '<ul id="section-switcher" data-switcher="cases">' +
          '<li><a href="#" role="button">Case 1</a></li>' +
          '<li><a href="#" role="button">Case 2</a></li>' +
          '<li><a href="#" role="button">Case 3</a></li>' +
        '</ul>' +
      '</section>' +
      '<section id="case-one" data-switcher-target="cases" data-switcher-index="1">One</section>' +
      '<section id="case-two" data-switcher-target="cases" data-switcher-index="2">Two</section>' +
      '<section id="case-three" data-switcher-target="cases" data-switcher-index="3">Three</section>' +
    '</main>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const buttons = doc.querySelectorAll('#section-switcher a');

  assert.equal(doc.getElementById('case-one').hidden, false);
  assert.equal(doc.getElementById('case-two').hidden, true);
  assert.equal(doc.getElementById('case-three').hidden, true);

  click(dom, buttons[2]);

  assert.equal(doc.getElementById('case-one').hidden, true);
  assert.equal(doc.getElementById('case-two').hidden, true);
  assert.equal(doc.getElementById('case-three').hidden, false);
});

test('switcher data targets prefer outer Carrd containers over matching inner elements', () => {
  const dom = createDom(
    '<main class="site-main">' +
      '<ul id="buttons01" class="buttons-component" data-switcher="cases">' +
        '<li><a class="n01" role="button">Switcher Tab 1</a></li>' +
        '<li><a class="n02" role="button">Switcher Tab 2</a></li>' +
        '<li><a class="n03" role="button">Switcher Tab 3</a></li>' +
      '</ul>' +
      '<div id="container20" class="container-component" data-switcher-target="&quot;cases&quot;" data-switcher-index="1">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text41" class="text-component" data-switcher-target="cases" data-switcher-index="1">Tab content 1</h2>' +
        '</div></div>' +
      '</div>' +
      '<div id="container21" class="container-component" data-switcher-target="&quot;cases&quot;" data-switcher-index="2">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text42" class="text-component" data-switcher-target="cases" data-switcher-index="2">Tab content 2</h2>' +
        '</div></div>' +
      '</div>' +
      '<div id="container19" class="container-component" data-switcher-target="&quot;cases&quot;" data-switcher-index="3">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text12" class="text-component" data-switcher-target="cases" data-switcher-index="3">Tab content 3</h2>' +
        '</div></div>' +
      '</div>' +
    '</main>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const buttons = doc.querySelectorAll('#buttons01 a');

  assert.equal(doc.getElementById('container20').hidden, false);
  assert.equal(doc.getElementById('container21').hidden, true);
  assert.equal(doc.getElementById('container19').hidden, true);
  assert.equal(doc.getElementById('text41').classList.contains('theme-switcher-panel'), false);
  assert.equal(doc.getElementById('text42').hidden, false);

  click(dom, buttons[1]);

  assert.equal(doc.getElementById('container20').hidden, true);
  assert.equal(doc.getElementById('container21').hidden, false);
  assert.equal(doc.getElementById('container19').hidden, true);
  assert.equal(doc.getElementById('text42').hidden, false);
});

test('switcher data targets take priority over shared class fallback', () => {
  const dom = createDom(
    '<main class="site-main">' +
      '<ul id="buttons01" class="buttons-component" data-switcher="cases">' +
        '<li><a class="n01" role="button">Switcher Tab 1</a></li>' +
        '<li><a class="n02" role="button">Switcher Tab 2</a></li>' +
        '<li><a class="n03" role="button">Switcher Tab 3</a></li>' +
      '</ul>' +
      '<div id="container20" class="container-component instance-20 style-4 cases default" data-switcher-target="cases" data-switcher-index="1">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text41" class="text-component instance-41 style-2">Tab content 1</h2>' +
        '</div></div>' +
      '</div>' +
      '<div id="container21" class="container-component instance-21 style-4 cases default" data-switcher-target="cases" data-switcher-index="2">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text42" class="text-component instance-42 style-2">Tab content 2</h2>' +
        '</div></div>' +
      '</div>' +
      '<div id="container19" class="container-component instance-19 style-4 cases default" data-switcher-target="cases" data-switcher-index="3">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text12" class="text-component instance-12 style-2">Tab content 3</h2>' +
        '</div></div>' +
      '</div>' +
    '</main>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const buttons = doc.querySelectorAll('#buttons01 a');

  assert.equal(doc.getElementById('container20').hidden, false);
  assert.equal(doc.getElementById('container21').hidden, true);
  assert.equal(doc.getElementById('container19').hidden, true);
  assert.equal(doc.getElementById('text41').classList.contains('theme-switcher-panel'), false);

  click(dom, buttons[1]);

  assert.equal(doc.getElementById('container20').hidden, true);
  assert.equal(doc.getElementById('container21').hidden, false);
  assert.equal(doc.getElementById('container19').hidden, true);
  assert.equal(doc.getElementById('text42').hidden, false);
});

test('switcher supports independent controllers on one page', () => {
  const dom = createDom(
    '<section>' +
      '<ul id="pricing-switcher" data-switcher="pricing">' +
        '<li><a href="#" role="button">Monthly</a></li>' +
        '<li><a href="#" role="button">Yearly</a></li>' +
      '</ul>' +
      '<p id="pricing-one" class="pricing-1">Monthly</p>' +
      '<p id="pricing-two" class="pricing-2">Yearly</p>' +
      '<ul id="feature-switcher" data-switcher="features">' +
        '<li><a href="#" role="button">Basic</a></li>' +
        '<li><a href="#" role="button">Pro</a></li>' +
      '</ul>' +
      '<p id="feature-one" class="features-1">Basic</p>' +
      '<p id="feature-two" class="features-2">Pro</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  click(dom, doc.querySelectorAll('#pricing-switcher a')[1]);

  assert.equal(doc.getElementById('pricing-one').hidden, true);
  assert.equal(doc.getElementById('pricing-two').hidden, false);
  assert.equal(doc.getElementById('feature-one').hidden, false);
  assert.equal(doc.getElementById('feature-two').hidden, true);
});

test('switcher public API can show next and previous panels', () => {
  const dom = createSwitcherDom();

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  dom.window.CarrdSwitcher.show('switcher', 2);

  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);

  dom.window.CarrdSwitcher.next('switcher');
  assert.equal(doc.getElementById('text37').hidden, false);
  assert.equal(doc.getElementById('text29').hidden, true);

  dom.window.CarrdSwitcher.prev('switcher');
  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);
});

test('switcher warns on missing targets without throwing', () => {
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="switcher">' +
        '<li><a href="#" role="button">One</a></li>' +
        '<li><a href="#" role="button">Two</a></li>' +
      '</ul>' +
      '<p class="switcher-1">One</p>' +
    '</section>'
  );
  const warnings = [];
  dom.window.console.warn = (...args) => warnings.push(args.join(' '));

  assert.doesNotThrow(() => {
    loadScript(dom, 'src/switcher/switcher.js');
    triggerDomReady(dom);
  });

  assert.ok(warnings.some(message => message.includes('missing targets')));
});

test('switcher can initialize the current carrd-source structure', context => {
  const carrdSourcePath = path.resolve(__dirname, '..', 'carrd-source', 'index.html');
  if (!fs.existsSync(carrdSourcePath)) {
    context.skip('carrd-source reference is not included in this repository');
    return;
  }

  const html = fs.readFileSync(carrdSourcePath, 'utf-8');
  if (!/id="buttons01"/.test(html) || !/id="text37"/.test(html) || !/id="text29"/.test(html)) {
    context.skip('carrd-source reference lacks the expected switcher structure');
    return;
  }
  const dom = createDom(html);
  const doc = dom.window.document;

  const controller = doc.getElementById('buttons01');
  const originalButton = controller.querySelector('a');
  controller.setAttribute('data-switcher', 'switcher');
  controller.innerHTML =
    '<li><a href="#" class="n01" role="button">State 1</a></li>' +
    '<li><a href="#" class="n02" role="button">State 2</a></li>';
  doc.getElementById('text37').classList.add('switcher-1');
  doc.getElementById('text29').classList.add('switcher-2');
  if (originalButton) {
    originalButton.removeAttribute('aria-pressed');
  }

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const firstButton = doc.querySelector('#buttons01 a');
  const secondButton = doc.querySelectorAll('#buttons01 a')[1];

  assert.equal(doc.getElementById('text37').hidden, false);
  assert.equal(doc.getElementById('text29').hidden, true);

  click(dom, secondButton);

  assert.equal(firstButton.getAttribute('aria-pressed'), 'false');
  assert.equal(secondButton.getAttribute('aria-pressed'), 'true');
  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);
});

test('switcher shared class: targets without index suffix are mapped by DOM order', () => {
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="pricing">' +
        '<li><a href="#" role="button">Monthly</a></li>' +
        '<li><a href="#" role="button">Yearly</a></li>' +
      '</ul>' +
      '<p id="monthly" class="pricing">Monthly content</p>' +
      '<p id="yearly" class="pricing">Yearly content</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('monthly').hidden, false);
  assert.equal(doc.getElementById('yearly').hidden, true);

  click(dom, doc.querySelectorAll('a')[1]);

  assert.equal(doc.getElementById('monthly').hidden, true);
  assert.equal(doc.getElementById('yearly').hidden, false);
});

test('switcher shared class: prefers outer Carrd containers over matching inner elements', () => {
  const dom = createDom(
    '<main class="site-main"><section>' +
      '<ul id="buttons01" class="buttons-component" data-switcher="cases">' +
        '<li><a class="n01" role="button">Tab 1</a></li>' +
        '<li><a class="n02" role="button">Tab 2</a></li>' +
        '<li><a class="n03" role="button">Tab 3</a></li>' +
      '</ul>' +
      '<div id="container20" class="container-component cases">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text41" class="text-component cases">Tab content 1</h2>' +
        '</div></div>' +
      '</div>' +
      '<div id="container21" class="container-component cases">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text42" class="text-component cases">Tab content 2</h2>' +
        '</div></div>' +
      '</div>' +
      '<div id="container19" class="container-component cases">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text12" class="text-component cases">Tab content 3</h2>' +
        '</div></div>' +
      '</div>' +
    '</section></main>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const buttons = doc.querySelectorAll('#buttons01 a');

  // First button → first outer container visible, others hidden
  assert.equal(doc.getElementById('container20').hidden, false);
  assert.equal(doc.getElementById('container21').hidden, true);
  assert.equal(doc.getElementById('container19').hidden, true);
  // Inner h2s must NOT be flagged as switcher panels — only outer containers are targets
  assert.equal(doc.getElementById('text41').classList.contains('theme-switcher-panel'), false);
  assert.equal(doc.getElementById('text42').classList.contains('theme-switcher-panel'), false);
  assert.equal(doc.getElementById('text12').classList.contains('theme-switcher-panel'), false);

  click(dom, buttons[1]);
  assert.equal(doc.getElementById('container20').hidden, true);
  assert.equal(doc.getElementById('container21').hidden, false);
  assert.equal(doc.getElementById('container19').hidden, true);

  click(dom, buttons[2]);
  assert.equal(doc.getElementById('container20').hidden, true);
  assert.equal(doc.getElementById('container21').hidden, true);
  assert.equal(doc.getElementById('container19').hidden, false);
});

test('switcher indexed class: prefers outer Carrd containers over matching inner elements', () => {
  const dom = createDom(
    '<main class="site-main"><section>' +
      '<ul id="buttons01" class="buttons-component" data-switcher="pricing">' +
        '<li><a class="n01" role="button">Plan 1</a></li>' +
        '<li><a class="n02" role="button">Plan 2</a></li>' +
      '</ul>' +
      '<div id="container20" class="container-component pricing-1">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text41" class="text-component pricing-1">Plan content 1</h2>' +
        '</div></div>' +
      '</div>' +
      '<div id="container21" class="container-component pricing-2">' +
        '<div class="wrapper"><div class="inner">' +
          '<h2 id="text42" class="text-component pricing-2">Plan content 2</h2>' +
        '</div></div>' +
      '</div>' +
    '</section></main>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const buttons = doc.querySelectorAll('#buttons01 a');

  assert.equal(doc.getElementById('container20').hidden, false);
  assert.equal(doc.getElementById('container21').hidden, true);
  assert.equal(doc.getElementById('text41').classList.contains('theme-switcher-panel'), false);
  assert.equal(doc.getElementById('text42').classList.contains('theme-switcher-panel'), false);

  click(dom, buttons[1]);

  assert.equal(doc.getElementById('container20').hidden, true);
  assert.equal(doc.getElementById('container21').hidden, false);
  assert.equal(doc.getElementById('text41').hidden, false);
  assert.equal(doc.getElementById('text42').hidden, false);
});

test('switcher shared class: indexed classes take priority over shared class', () => {
  const dom = createDom(
    '<section>' +
      '<ul data-switcher="pricing">' +
        '<li><a href="#" role="button">Monthly</a></li>' +
        '<li><a href="#" role="button">Yearly</a></li>' +
      '</ul>' +
      '<p id="indexed-1" class="pricing-1">Indexed monthly</p>' +
      '<p id="indexed-2" class="pricing-2">Indexed yearly</p>' +
      '<p id="shared" class="pricing">Shared — should be ignored</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('indexed-1').hidden, false);
  assert.equal(doc.getElementById('indexed-2').hidden, true);
  assert.equal(doc.getElementById('shared').classList.contains('theme-switcher-panel'), false);
});

test('switcher respects configured default index', () => {
  const dom = createSwitcherDom();
  setPluginOptions(dom, { switcher: { defaultIndex: 2 } });

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);
});

test('switcher supports per-name instance default indexes', () => {
  const dom = createDom(
    '<section>' +
      '<ul id="price-switcher" data-switcher="price">' +
        '<li><a href="#" role="button">Monthly</a></li>' +
        '<li><a href="#" role="button">Yearly</a></li>' +
      '</ul>' +
      '<p id="price-one" class="price-1">Monthly</p>' +
      '<p id="price-two" class="price-2">Yearly</p>' +
      '<ul id="cases-switcher" data-switcher="cases">' +
        '<li><a href="#" role="button">Case A</a></li>' +
        '<li><a href="#" role="button">Case B</a></li>' +
      '</ul>' +
      '<p id="case-one" class="cases-1">Case A</p>' +
      '<p id="case-two" class="cases-2">Case B</p>' +
    '</section>'
  );
  setPluginOptions(dom, {
    switcher: {
      defaultIndex: 1,
      instances: {
        price: {
          defaultIndex: 2
        }
      }
    }
  });

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('price-one').hidden, true);
  assert.equal(doc.getElementById('price-two').hidden, false);
  assert.equal(doc.getElementById('case-one').hidden, false);
  assert.equal(doc.getElementById('case-two').hidden, true);
});

test('switcher data-switcher-default-index overrides JS defaultIndex and instances', () => {
  const dom = createSwitcherDom();
  dom.window.document.getElementById('buttons01').setAttribute('data-switcher-default-index', '2');
  setPluginOptions(dom, {
    switcher: {
      defaultIndex: 1,
      instances: { switcher: { defaultIndex: 1 } }
    }
  });

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);
});

test('switcher falls back to JS default index and warns on invalid data-switcher-default-index', () => {
  const dom = createSwitcherDom();
  dom.window.document.getElementById('buttons01').setAttribute('data-switcher-default-index', 'abc');
  const warnings = [];
  dom.window.console.warn = (...args) => warnings.push(args.join(' '));
  setPluginOptions(dom, { switcher: { defaultIndex: 2 } });

  loadScript(dom, 'src/switcher/switcher.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.getElementById('text37').hidden, true);
  assert.equal(doc.getElementById('text29').hidden, false);
  assert.ok(warnings.some((w) => w.includes('data-switcher-default-index')));
});
