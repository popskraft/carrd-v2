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

test('header-nav places the toggle in the cell containing id="header-primary-section"', () => {
  const dom = createDom(
    '<header id="header">' +
      '<div class="container-component">' +
        '<div class="wrapper"><div class="inner">' +
          '<div class="nav-slot">' +
            '<ul class="links-component header-mobile-hide"><li><a href="#menu">Menu</a></li></ul>' +
          '</div>' +
          '<div class="brand-slot">' +
            '<div id="header-primary-section" class="image-component">' +
              '<a href="#home">Logo</a>' +
            '</div>' +
          '</div>' +
          '<div class="cta-slot">' +
            '<ul class="buttons-component header-mobile-hide"><li><a href="#cta">CTA</a></li></ul>' +
          '</div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(dom, 480);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const header = doc.querySelector('#header');
  const brandCell = header.querySelector('.brand-slot');
  const toggle = header.querySelector('.theme-header-nav-toggle');

  // The middle cell (containing the marked logo) becomes the primary section.
  assert.ok(brandCell.classList.contains('theme-header-nav-primary-section'));
  assert.equal(toggle.parentNode, brandCell);
  // First cell is not promoted anymore.
  assert.ok(!header.querySelector('.nav-slot').classList.contains('theme-header-nav-primary-section'));
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

test('header-position="fixed" binds and sets anchor scroll offset without a spacer', () => {
  const dom = createDom(
    '<div class="site-wrapper"><div class="site-main"><div class="inner">' +
      '<header id="header">' +
        '<div class="container-component" data-header-position="fixed">' +
          '<div class="wrapper"><div class="inner"><div>Brand</div></div></div>' +
        '</div>' +
      '</header>' +
    '</div></div></div>'
  );
  mockViewport(dom, 1200);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const header = doc.querySelector('#header');

  assert.equal(header.getAttribute('data-header-position-bound'), 'true');
  // Anchor offset is applied to <html>.
  assert.notEqual(doc.documentElement.style.scrollPaddingTop, '');
  // No spacer / shell artifacts are introduced.
  assert.equal(header.previousElementSibling, null);
  assert.equal(doc.querySelector('.theme-header-nav-spacer'), null);
});

test('header-position="sticky" sets the negative top offset variable', () => {
  const dom = createDom(
    '<div class="site-wrapper"><div class="site-main"><div class="inner">' +
      '<header id="header">' +
        '<div id="topnav" class="container-component"><div class="wrapper"><div class="inner">top</div></div></div>' +
        '<div id="main-row" class="container-component" data-header-position="sticky">' +
          '<div class="wrapper"><div class="inner"><div>Brand</div></div></div>' +
        '</div>' +
      '</header>' +
    '</div></div></div>'
  );
  mockViewport(dom, 1200);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  assert.equal(header.getAttribute('data-header-position-bound'), 'true');
  // The sticky top var is written (value is layout-dependent; presence is enough here).
  assert.ok(/^-?\d+px$/.test(header.style.getPropertyValue('--theme-header-nav-sticky-top')));
});

test('header-position activates without any collapsing markers', () => {
  const dom = createDom(
    '<div class="site-wrapper"><div class="site-main"><div class="inner">' +
      '<header id="header">' +
        '<div class="container-component" data-header-position="fixed">' +
          '<div class="wrapper"><div class="inner"><div>Logo only</div></div></div>' +
        '</div>' +
      '</header>' +
    '</div></div></div>'
  );
  mockViewport(dom, 1200);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  // Collapse feature stays inactive (no .header-mobile-hide) ...
  assert.equal(header.getAttribute('data-header-nav-bound'), null);
  // ... but positioning still binds.
  assert.equal(header.getAttribute('data-header-position-bound'), 'true');
});

test('no data-header-position leaves scroll offset and header untouched', () => {
  const dom = createDom(
    '<div class="site-wrapper"><div class="site-main"><div class="inner">' +
      '<header id="header">' +
        '<div class="container-component">' +
          '<div class="wrapper"><div class="inner">' +
            '<div>Brand</div>' +
            '<div><ul class="header-mobile-hide"><li><a href="#a">A</a></li></ul></div>' +
          '</div></div>' +
        '</div>' +
      '</header>' +
    '</div></div></div>'
  );
  mockViewport(dom, 1200);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const header = doc.querySelector('#header');
  assert.equal(header.getAttribute('data-header-position-bound'), null);
  assert.equal(doc.documentElement.style.scrollPaddingTop, '');
});

test('data-header-nav-fixed-offset attribute sets the offset var (bare number -> rem)', () => {
  const dom = createDom(
    '<div class="site-wrapper"><div class="site-main"><div class="inner">' +
      '<header id="header">' +
        '<div class="container-component" data-header-position="fixed" data-header-nav-fixed-offset="2">' +
          '<div class="wrapper"><div class="inner"><div>Brand</div></div></div>' +
        '</div>' +
      '</header>' +
    '</div></div></div>'
  );
  mockViewport(dom, 1200);

  loadScript(dom, 'src/header-nav/header-nav.js');
  triggerDomReady(dom);

  const header = dom.window.document.querySelector('#header');
  assert.equal(header.style.getPropertyValue('--theme-header-nav-fixed-offset'), '2rem');
});

test('data-header-nav-fixed-offset accepts an explicit unit and rejects junk', () => {
  const withUnit = createDom(
    '<header id="header"><div class="container-component" data-header-position="sticky" data-header-nav-fixed-offset="24px">' +
      '<div class="wrapper"><div class="inner"><div>x</div></div></div></div></header>'
  );
  mockViewport(withUnit, 1200);
  loadScript(withUnit, 'src/header-nav/header-nav.js');
  triggerDomReady(withUnit);
  assert.equal(withUnit.window.document.querySelector('#header').style.getPropertyValue('--theme-header-nav-fixed-offset'), '24px');

  const junk = createDom(
    '<header id="header"><div class="container-component" data-header-position="fixed" data-header-nav-fixed-offset="abc">' +
      '<div class="wrapper"><div class="inner"><div>x</div></div></div></div></header>'
  );
  mockViewport(junk, 1200);
  loadScript(junk, 'src/header-nav/header-nav.js');
  triggerDomReady(junk);
  // Invalid value is ignored; the token default stays in effect.
  assert.equal(junk.window.document.querySelector('#header').style.getPropertyValue('--theme-header-nav-fixed-offset'), '');
});

test('data-header-nav-toggle-top on the container sets the toggle top var (bare number -> rem)', () => {
  const dom = createDom(
    '<header id="header">' +
      '<div class="container-component" data-header-nav-toggle-top="2">' +
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

  const header = dom.window.document.querySelector('#header');
  assert.equal(header.style.getPropertyValue('--theme-header-nav-toggle-top'), '2rem');
});

test('data-header-nav-toggle-top on #header itself works with an explicit unit', () => {
  const dom = createDom(
    '<header id="header" data-header-nav-toggle-top="24px">' +
      '<div class="container-component">' +
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

  const header = dom.window.document.querySelector('#header');
  assert.equal(header.style.getPropertyValue('--theme-header-nav-toggle-top'), '24px');
});

test('data-header-nav-toggle-top ignores junk and empty values', () => {
  const junk = createDom(
    '<header id="header">' +
      '<div class="container-component" data-header-nav-toggle-top="abc">' +
        '<div class="wrapper"><div class="inner">' +
          '<div>Brand</div>' +
          '<div><ul class="header-mobile-hide"><li><a href="#a">A</a></li></ul></div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(junk, 480);
  loadScript(junk, 'src/header-nav/header-nav.js');
  triggerDomReady(junk);
  assert.equal(junk.window.document.querySelector('#header').style.getPropertyValue('--theme-header-nav-toggle-top'), '');

  const empty = createDom(
    '<header id="header">' +
      '<div class="container-component" data-header-nav-toggle-top="">' +
        '<div class="wrapper"><div class="inner">' +
          '<div>Brand</div>' +
          '<div><ul class="header-mobile-hide"><li><a href="#a">A</a></li></ul></div>' +
        '</div></div>' +
      '</div>' +
    '</header>'
  );
  mockViewport(empty, 480);
  loadScript(empty, 'src/header-nav/header-nav.js');
  triggerDomReady(empty);
  assert.equal(empty.window.document.querySelector('#header').style.getPropertyValue('--theme-header-nav-toggle-top'), '');
});
