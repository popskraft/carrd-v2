const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  setPluginOptions,
  triggerDomReady,
  mockViewport,
  click,
  keydown,
  useFakeTimers
} = require('./helpers');

function createHeaderMarkup(extraRootClasses = '') {
  return (
    `<header id="header" class="${extraRootClasses}">` +
      '<div class="container-component">' +
        '<div class="wrapper"><div class="inner">' +
          '<div class="brand-slot">Brand</div>' +
          '<div class="nav-slot">' +
            '<ul class="links-component header-mobile-hide">' +
              '<li><a href="#menu">Menu</a></li>' +
            '</ul>' +
          '</div>' +
          '<div class="cta-slot">' +
            '<ul class="buttons-component">' +
              '<li><a href="tel:+10000000000">Call</a></li>' +
            '</ul>' +
          '</div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
}

test('header-nav initializes from #header collapsing markers and toggles mobile menu', () => {
  const dom = createDom(createHeaderMarkup());
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const header = doc.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');
  const primarySection = header.querySelector('.brand-slot');

  assert.equal(header.getAttribute('data-header-nav-bound'), 'true');
  assert.ok(primarySection.classList.contains('theme-header-nav-primary-section'));
  assert.ok(toggle);
  assert.equal(toggle.parentNode, primarySection);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(header.querySelector('.theme-header-nav-overlay'), null);

  click(dom, toggle);

  assert.equal(header.classList.contains('is-nav-open'), true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');

  click(dom, header.querySelector('.header-mobile-hide a'));

  assert.equal(header.classList.contains('is-nav-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('header-nav closes mobile menu on Escape and restores focus to toggle', () => {
  const dom = createDom(createHeaderMarkup());
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const header = doc.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');

  click(dom, toggle);
  assert.equal(header.classList.contains('is-nav-open'), true);

  keydown(dom, doc, 'Escape');

  assert.equal(header.classList.contains('is-nav-open'), false);
  assert.equal(doc.activeElement, toggle);
});

test('header-nav does not initialize without a collapsing marker', () => {
  const dom = createDom(
    '<header id="header">' +
      '<div class="container-component site-header header-fixed header-collapsing">' +
        '<div class="wrapper"><div class="inner">' +
          '<div>Brand</div>' +
          '<div><ul class="links-component"><li><a href="#a">A</a></li></ul></div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  assert.equal(header.getAttribute('data-header-nav-bound'), null);
  assert.equal(header.querySelector('.theme-header-nav-toggle'), null);
});

test('header-nav still initializes from the legacy collapsing marker alias', () => {
  const dom = createDom(
    '<header id="header">' +
      '<div class="container-component">' +
        '<div class="wrapper"><div class="inner">' +
          '<div>Brand</div>' +
          '<div><ul class="links-component header-mobile-el-collapsing"><li><a href="#a">A</a></li></ul></div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  assert.equal(header.getAttribute('data-header-nav-bound'), 'true');
  assert.ok(header.querySelector('.theme-header-nav-toggle'));
});

test('header-nav does not require legacy site-header or header-collapsing classes', () => {
  const dom = createDom(createHeaderMarkup());
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  assert.equal(header.querySelector('.site-header'), null);
  assert.equal(header.querySelector('.header-collapsing'), null);
  assert.equal(header.getAttribute('data-header-nav-bound'), 'true');
  assert.ok(header.querySelector('.theme-header-nav-toggle'));
});

test('header-nav finds collapsing elements anywhere inside #header', () => {
  const dom = createDom(
    '<header id="header">' +
      '<div class="external-nav-slot">' +
        '<ul class="links-component header-mobile-hide">' +
          '<li><a href="#a">A</a></li>' +
        '</ul>' +
      '</div>' +
      '<div class="container-component">' +
        '<div class="wrapper"><div class="inner">' +
          '<div>Brand</div>' +
          '<div><ul class="buttons-component"><li><a href="#b">B</a></li></ul></div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const header = doc.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');
  const externalNav = doc.querySelector('.external-nav-slot .header-mobile-hide');

  assert.ok(toggle);
  assert.equal(header.getAttribute('data-header-nav-bound'), 'true');
  assert.ok(externalNav);

  click(dom, toggle);

  assert.equal(header.classList.contains('is-nav-open'), true);
});

test('header-nav closes an open mobile menu on resize past breakpoint', () => {
  const dom = createDom(createHeaderMarkup());
  const timers = useFakeTimers(dom);
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');

  click(dom, toggle);
  assert.equal(header.classList.contains('is-nav-open'), true);

  mockViewport(dom, 900);
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  timers.flush();

  assert.equal(header.classList.contains('is-nav-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');

  timers.restore();
});

test('header-nav ignores toggle clicks above breakpoint', () => {
  const dom = createDom(createHeaderMarkup());
  mockViewport(dom, 900);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');

  click(dom, toggle);

  assert.equal(header.classList.contains('is-nav-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('header-nav respects closeOnLinkClick false', () => {
  const dom = createDom(createHeaderMarkup());
  mockViewport(dom, 480);
  setPluginOptions(dom, { headerNav: { closeOnLinkClick: false } });

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');

  click(dom, toggle);
  click(dom, header.querySelector('.header-mobile-hide a'));

  assert.equal(header.classList.contains('is-nav-open'), true);
});

test('header-nav scrolls header into view when opening off-screen menu', () => {
  const dom = createDom(createHeaderMarkup());
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');
  let scrollOptions = null;

  dom.window.matchMedia = () => ({ matches: false });
  header.getBoundingClientRect = () => ({ top: -40 });
  header.scrollIntoView = options => { scrollOptions = options; };

  click(dom, toggle);

  assert.equal(scrollOptions.behavior, 'smooth');
  assert.equal(scrollOptions.block, 'start');
});

test('header-nav toggle click while open and scrolled away scrolls up instead of closing', () => {
  const dom = createDom(createHeaderMarkup());
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  const toggle = header.querySelector('.theme-header-nav-toggle');
  let scrollCount = 0;

  dom.window.matchMedia = () => ({ matches: false });
  header.getBoundingClientRect = () => ({ top: 0 });
  header.scrollIntoView = () => { scrollCount += 1; };

  click(dom, toggle);
  assert.equal(header.classList.contains('is-nav-open'), true);

  // User scrolls down: header is now off-screen, menu still open.
  header.getBoundingClientRect = () => ({ top: -300 });

  click(dom, toggle);
  assert.equal(header.classList.contains('is-nav-open'), true, 'menu stays open');
  assert.equal(scrollCount, 1, 'click scrolls back to header');

  // Header back in view: click closes normally.
  header.getBoundingClientRect = () => ({ top: 0 });
  click(dom, toggle);
  assert.equal(header.classList.contains('is-nav-open'), false);
});

test('header-nav does not create sticky shell, spacer, or overlay artifacts', () => {
  const dom = createDom(
    '<header id="header">' +
      '<div class="container-component site-header header-fixed header-collapsing">' +
        '<div class="wrapper"><div class="inner">' +
          '<div>Brand</div>' +
          '<div><ul class="header-mobile-hide"><li><a href="#a">A</a></li></ul></div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const header = doc.querySelector('#header');

  assert.equal(header.classList.contains('theme-header-nav-shell'), false);
  assert.equal(header.classList.contains('theme-header-nav-sticky'), false);
  assert.equal(header.classList.contains('is-stuck'), false);
  assert.equal(Boolean(header.previousElementSibling?.classList.contains('theme-header-nav-spacer')), false);
  assert.equal(doc.querySelector('.theme-header-nav-overlay'), null);
});
