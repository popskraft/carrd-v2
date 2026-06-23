const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  triggerDomReady,
  setPluginOptions,
  setLegacyPluginOptions,
  click,
  useFakeTimers
} = require('./helpers');

function mockRaf(dom) {
  const raf = (cb) => cb();
  dom.window.requestAnimationFrame = raf;
  dom.window.globalThis.requestAnimationFrame = raf;
}

// ==========================================================================
// P0 — slider (the reported production bug)
// ==========================================================================

test('slider initializes from v1 data-slider attribute', () => {
  const dom = createDom('<div data-slider="hero">A</div><div data-slider="hero">B</div>');
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-slider-wrapper').length, 1);
  assert.equal(doc.querySelectorAll('.theme-slider-track .theme-slider-slide').length, 2);
  assert.ok(dom.window.CarrdSliderV2);
  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 1);
});

test('slider reads config from window.CarrdPluginOptions (v1 namespace)', () => {
  const dom = createDom('<div class="slide-card">A</div><div class="slide-card">B</div>');
  setLegacyPluginOptions(dom, {
    slider: {
      slideSelector: '.slide-card'
    }
  });

  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-slider-wrapper').length, 1);
  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 1);
});

test('slider prefers CarrdPluginOptionsV2 over CarrdPluginOptions when both set', () => {
  const dom = createDom(
    '<div class="v2-card">A</div><div class="v2-card">B</div>' +
    '<div class="v1-card">C</div><div class="v1-card">D</div>'
  );
  setPluginOptions(dom, { slider: { slideSelector: '.v2-card' } });
  setLegacyPluginOptions(dom, { slider: { slideSelector: '.v1-card' } });

  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  // The V2 selector wins: only the .v2-card elements get wrapped, .v1-card stay untouched.
  assert.equal(doc.querySelectorAll('.theme-slider-wrapper').length, 1);
  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 1);
  // Each slide wraps an original .v2-card element.
  const slides = doc.querySelectorAll('.theme-slider-slide');
  assert.equal(slides.length, 2);
  slides.forEach(slide => assert.ok(slide.querySelector('.v2-card')));
  // The v1-card elements were never collected as slides.
  doc.querySelectorAll('.v1-card').forEach(el => {
    assert.equal(el.closest('.theme-slider-wrapper'), null);
  });
});

// ==========================================================================
// P1 — switcher, modal, faq, accordeon
// ==========================================================================

test('switcher initializes from v1 data-switcher attribute', () => {
  const dom = createDom(
    '<section>' +
      '<ul id="buttons01" data-switcher="switcher">' +
        '<li><a href="#" class="n01" role="button">One</a></li>' +
        '<li><a href="#" class="n02" role="button">Two</a></li>' +
      '</ul>' +
      '<p id="state-1" class="switcher-1">State 1</p>' +
      '<p id="state-2" class="switcher-2">State 2</p>' +
    '</section>'
  );

  loadScript(dom, 'src/switcher-v2/switcher-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const buttons = doc.querySelectorAll('#buttons01 a');

  assert.ok(dom.window.CarrdSwitcherV2);
  assert.equal(buttons[0].classList.contains('is-active'), true);
  assert.equal(buttons[1].classList.contains('is-inactive'), true);
  assert.equal(doc.getElementById('state-1').hidden, false);
  assert.equal(doc.getElementById('state-2').hidden, true);

  click(dom, buttons[1]);

  assert.equal(doc.getElementById('state-1').hidden, true);
  assert.equal(doc.getElementById('state-2').hidden, false);
});

test('modal opens from a v1 data-modal element via #data-modal-NAME trigger', () => {
  const dom = createDom(
    '<a id="trigger" href="#data-modal-contact">Open</a>' +
      '<div data-modal="contact" class="container-component">' +
        '<div class="wrapper"><div class="inner"><h2>Contact</h2></div></div>' +
      '</div>'
  );
  mockRaf(dom);
  loadScript(dom, 'src/modal-v2/modal-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const modal = doc.querySelector('[data-modal="contact"]');
  click(dom, doc.getElementById('trigger'));

  assert.ok(modal.classList.contains('is-open'));
  assert.equal(dom.window.CarrdModalV2.isOpen('contact'), true);
});

test('faq initializes from v1 data-faq attribute', () => {
  const dom = createDom(
    '<div data-faq="main">' +
      '<hr class="divider-component">' +
      '<h2>Question 1</h2>' +
      '<p>Answer 1</p>' +
      '<hr class="divider-component">' +
      '<h2>Question 2</h2>' +
      '<p>Answer 2</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );
  loadScript(dom, 'src/faq-v2/faq-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-faq-question').length, 2);
  assert.equal(doc.querySelectorAll('.theme-faq-trigger').length, 2);
  assert.equal(doc.querySelectorAll('.theme-faq-answer').length, 2);
});

test('accordeon initializes from v1 data-accordeon attribute', () => {
  const dom = createDom(
    '<a id="control" href="#accordeon-ppf" role="button">Toggle</a>' +
    '<div id="one" class="container-component" data-accordeon="ppf">One</div>' +
    '<div id="two" class="container-component" data-accordeon="ppf">Two</div>'
  );
  loadScript(dom, 'src/accordeon-v2/accordeon-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const control = doc.getElementById('control');

  assert.equal(control.classList.contains('theme-accordeon-toggle'), true);
  assert.equal(doc.querySelectorAll('.theme-accordeon-panel').length, 2);
  assert.equal(control.getAttribute('aria-expanded'), 'false');
  assert.equal(doc.getElementById('one').hidden, true);

  click(dom, control);

  assert.equal(control.getAttribute('aria-expanded'), 'true');
  assert.equal(doc.getElementById('one').hidden, false);
  assert.equal(doc.getElementById('two').hidden, false);
});

test('accordeon initializes from the legacy data-accorderon typo attribute', () => {
  const dom = createDom(
    '<a id="control" href="#accordeon-ppf" role="button">Toggle</a>' +
    '<div id="one" class="container-component" data-accorderon="ppf">One</div>' +
    '<div id="two" class="container-component" data-accorderon="ppf">Two</div>'
  );
  loadScript(dom, 'src/accordeon-v2/accordeon-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const control = doc.getElementById('control');

  assert.equal(control.classList.contains('theme-accordeon-toggle'), true);
  assert.equal(doc.querySelectorAll('.theme-accordeon-panel').length, 2);

  click(dom, control);

  assert.equal(control.getAttribute('aria-expanded'), 'true');
  assert.equal(doc.getElementById('one').hidden, false);
});

// ==========================================================================
// P2 — cookie-banner, floating-cta, grid-cluster, cards
// ==========================================================================

test('cookie banner initializes from v1 data-cookie attribute', () => {
  const dom = createDom('<div data-cookie="consent"><a role="button" href="#">Accept</a></div>');
  const timers = useFakeTimers(dom);

  setPluginOptions(dom, {
    cookieBanner: {
      showDelay: 0,
      fadeOutDuration: 0,
      fadeInDuration: 0
    }
  });

  loadScript(dom, 'src/cookie-banner-v2/cookie-banner-v2.js');
  triggerDomReady(dom);
  timers.flush();

  const banner = dom.window.document.querySelector('[data-cookie="consent"]');
  assert.equal(banner.dataset.cookieBannerInitialized, 'true');
  assert.ok(banner.classList.contains('theme-cookie-banner'));

  click(dom, banner.querySelector('a'));
  timers.flush();

  assert.match(dom.window.document.cookie, /cookies_accepted=1/);
  assert.equal(banner.style.display, 'none');
  timers.restore();
});

test('floating-cta clones a v1 data-floating element', () => {
  const dom = createDom(
    '<a id="source" data-floating="contact" data-floating-position="bottom-right" href="#contact">Call</a>' +
    '<div id="contact"></div>'
  );

  loadScript(dom, 'src/floating-cta-v2/floating-cta-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const clones = doc.querySelectorAll('[data-floating-v2-clone="true"]');
  assert.equal(clones.length, 1);
  assert.equal(clones[0].classList.contains('theme-floating-cta'), true);
  assert.equal(doc.getElementById('source').getAttribute('data-floating-v2-initialized'), 'true');
});

test('grid-cluster wraps v1 data-grid blocks into a theme-grid wrapper', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div data-grid="features">A</div>' +
      '<div data-grid="features">B</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const wrappers = dom.window.document.querySelectorAll('.theme-grid');
  assert.equal(wrappers.length, 1);
  assert.equal(wrappers[0].children.length, 2);
});

test('cards initializes from v1 data-cards attribute', () => {
  const dom = createDom(
    '<div data-cards="pricing" data-cards-v2-color="#112233">' +
      '<div class="inner">' +
        '<div><p>One</p></div>' +
        '<div><p>Two</p></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards-v2/cards-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-card-item').length, 2);
  assert.equal(doc.querySelector('[data-cards="pricing"]').getAttribute('data-cards-v2-initialized'), 'true');
});

// ==========================================================================
// Second v1-config test (besides slider) — faq via setLegacyPluginOptions
// ==========================================================================

test('faq reads config from window.CarrdPluginOptions (v1 namespace)', () => {
  const dom = createDom(
    '<div data-faq="main">' +
      '<hr class="faq-divider">' +
      '<h2>Question</h2>' +
      '<p>Answer</p>' +
      '<hr class="faq-divider">' +
    '</div>'
  );
  setLegacyPluginOptions(dom, {
    faq: {
      dividerSelector: 'hr.faq-divider'
    }
  });

  loadScript(dom, 'src/faq-v2/faq-v2.js');
  triggerDomReady(dom);

  // The custom divider selector (only reachable via v1 config) is required to
  // detect the single question here, proving the v1 namespace was honored.
  assert.equal(dom.window.document.querySelectorAll('.theme-faq-question').length, 1);
});
