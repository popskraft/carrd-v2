const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  triggerDomReady,
  setPluginOptions,
  click,
  mockViewport,
  useFakeTimers
} = require('./helpers');

test('cookie banner uses the data-cookie marker, applies indent, and hides all banners after accept', () => {
  const dom = createDom(
    '<div data-cookie="consent" data-cookie-indent="0-2"><a role="button" href="#">Accept</a></div>' +
    '<div data-cookie="consent-secondary"><a role="button" href="#">Accept</a></div>'
  );
  const timers = useFakeTimers(dom);

  setPluginOptions(dom, {
    cookieBanner: {
      showDelay: 0,
      fadeOutDuration: 0,
      fadeInDuration: 0,
      position: 'top-right'
    }
  });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);
  timers.flush();

  const banners = dom.window.document.querySelectorAll('[data-cookie]');
  const banner = banners[0];
  assert.equal(banner.dataset.cookieBannerInitialized, 'true');
  assert.ok(banner.classList.contains('theme-cookie-banner'));
  assert.equal(banner.style.position, 'fixed');
  assert.equal(banner.style.top, '0rem');
  assert.equal(banner.style.right, '2rem');
  assert.equal(banner.style.maxWidth, 'calc(100vw - 2rem - 2rem)');
  assert.equal(banner.style.opacity, '1');

  click(dom, banner.querySelector('a'));
  timers.flush();

  assert.match(dom.window.document.cookie, /cookies_accepted=1/);
  banners.forEach(item => assert.equal(item.style.display, 'none'));
  timers.restore();
});

test('cookie banner uses per-banner data position and delay overrides', () => {
  const dom = createDom(
    '<div data-cookie="consent" data-cookie-position="bottom-right" data-cookie-delay="250">' +
      '<a role="button" href="#">Accept</a>' +
    '</div>'
  );

  const originalSetTimeout = dom.window.setTimeout;
  const delays = [];
  dom.window.setTimeout = (fn, delay = 0) => {
    delays.push(delay);
    fn();
    return 1;
  };

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);

  const banner = dom.window.document.querySelector('[data-cookie="consent"]');
  assert.equal(banner.style.bottom, '1rem');
  assert.equal(banner.style.right, '1rem');
  assert.equal(banner.style.left, 'auto');
  assert.ok(delays.includes(250));

  dom.window.setTimeout = originalSetTimeout;
});

test('cookie banner stays hidden when consent cookie already exists', () => {
  const dom = createDom(
    '<div data-cookie="consent"><a role="button" href="#">Accept</a></div>' +
    '<div id="cookie-baner"><a role="button" href="#">Accept</a></div>'
  );
  dom.window.document.cookie = 'cookies_accepted=1; path=/';

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);

  const banners = [
    dom.window.document.querySelector('[data-cookie="consent"]'),
    dom.window.document.getElementById('cookie-baner')
  ];

  banners.forEach(banner => {
    assert.equal(banner.style.display, 'none');
    assert.equal(banner.dataset.cookieBannerInitialized, undefined);
  });
});

test('cookie banner still supports the legacy id fallback', () => {
  const dom = createDom('<div id="cookie-baner"><a role="button" href="#">Accept</a></div>');
  const timers = useFakeTimers(dom);

  setPluginOptions(dom, {
    cookieBanner: {
      showDelay: 0,
      fadeOutDuration: 0,
      fadeInDuration: 0
    }
  });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);
  timers.flush();

  const banner = dom.window.document.getElementById('cookie-baner');
  assert.equal(banner.dataset.cookieBannerInitialized, 'true');
  assert.ok(banner.classList.contains('theme-cookie-banner'));
  timers.restore();
});

test('cookie banner uses per-banner data-cookie-days when writing consent cookie', () => {
  const dom = createDom(
    '<div data-cookie="consent" data-cookie-days="10"><a role="button" href="#">Accept</a></div>'
  );
  const timers = useFakeTimers(dom);
  const realDate = dom.window.Date;
  const fixedNow = new realDate('2026-06-21T00:00:00Z').getTime();
  let cookieWrite = '';

  class FixedDate extends realDate {
    constructor(...args) {
      if (args.length > 0) {
        super(...args);
        return;
      }
      super(fixedNow);
    }

    static now() {
      return fixedNow;
    }
  }

  Object.defineProperty(dom.window.document, 'cookie', {
    configurable: true,
    get() {
      return cookieWrite;
    },
    set(value) {
      cookieWrite = value;
    }
  });

  dom.window.Date = FixedDate;
  setPluginOptions(dom, {
    cookieBanner: {
      showDelay: 0,
      fadeOutDuration: 0,
      fadeInDuration: 0
    }
  });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);
  timers.flush();

  const banner = dom.window.document.querySelector('[data-cookie="consent"]');
  click(dom, banner.querySelector('a'));
  timers.flush();

  assert.match(cookieWrite, /cookies_accepted=1/);
  assert.match(cookieWrite, /expires=Wed, 01 Jul 2026 00:00:00 GMT/);
  assert.match(cookieWrite, /; Secure$/);
  dom.window.Date = realDate;
  timers.restore();
});

test('cookie banner recalculates indent on mobile resize with data-cookie-indent-mobile', () => {
  const dom = createDom(
    '<div data-cookie="consent" data-cookie-indent="1-2" data-cookie-indent-mobile="0-1">' +
      '<a role="button" href="#">Accept</a>' +
    '</div>'
  );
  const timers = useFakeTimers(dom);

  mockViewport(dom, 1280);
  setPluginOptions(dom, {
    cookieBanner: {
      showDelay: 0,
      fadeInDuration: 0,
      position: 'top-right'
    }
  });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);
  timers.flush();

  const banner = dom.window.document.querySelector('[data-cookie="consent"]');
  assert.equal(banner.style.top, '1rem');
  assert.equal(banner.style.right, '2rem');

  mockViewport(dom, 375);
  dom.window.dispatchEvent(new dom.window.Event('resize'));

  assert.equal(banner.style.top, '0rem');
  assert.equal(banner.style.right, '1rem');
  assert.equal(banner.style.maxWidth, 'calc(100vw - 1rem - 1rem)');
  timers.restore();
});

test('cookie banner reads cookie names safely without regex parsing', () => {
  const dom = createDom('<div data-cookie="consent"><a role="button" href="#">Accept</a></div>');
  dom.window.document.cookie = 'cookies_accepted_extra=1; path=/';

  setPluginOptions(dom, {
    cookieBanner: {
      cookieName: 'cookies_accepted[primary]',
      showDelay: 0,
      fadeInDuration: 0
    }
  });

  dom.window.document.cookie = 'cookies_accepted[primary]=1; path=/';
  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);

  const banner = dom.window.document.querySelector('[data-cookie="consent"]');
  assert.equal(banner.style.display, 'none');
});

test('cookie banner keeps legacy data-cookie="banner" marker as fallback', () => {
  const dom = createDom('<div data-cookie="banner"><a role="button" href="#">Accept</a></div>');
  const timers = useFakeTimers(dom);

  setPluginOptions(dom, {
    cookieBanner: {
      showDelay: 0,
      fadeOutDuration: 0,
      fadeInDuration: 0
    }
  });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);
  timers.flush();

  assert.equal(dom.window.document.querySelector('[data-cookie="banner"]').dataset.cookieBannerInitialized, 'true');
  timers.restore();
});

test('cookie banner adds a region role and aria-label for assistive tech', () => {
  const dom = createDom(
    '<div data-cookie="consent"><a role="button" href="#">Accept</a></div>'
  );
  const timers = useFakeTimers(dom);
  setPluginOptions(dom, { cookieBanner: { showDelay: 0, fadeInDuration: 0 } });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);
  timers.flush();

  const banner = dom.window.document.querySelector('[data-cookie]');
  assert.equal(banner.getAttribute('role'), 'region');
  assert.equal(banner.getAttribute('aria-label'), 'Cookie notice');
  timers.restore();
});

test('cookie banner preserves author-provided role and aria-label', () => {
  const dom = createDom(
    '<div data-cookie="consent" role="alert" aria-label="Custom notice">' +
      '<a role="button" href="#">Accept</a>' +
    '</div>'
  );
  const timers = useFakeTimers(dom);
  setPluginOptions(dom, { cookieBanner: { showDelay: 0, fadeInDuration: 0 } });

  loadScript(dom, 'src/cookie-banner/cookie-banner.js');
  triggerDomReady(dom);
  timers.flush();

  const banner = dom.window.document.querySelector('[data-cookie]');
  assert.equal(banner.getAttribute('role'), 'alert');
  assert.equal(banner.getAttribute('aria-label'), 'Custom notice');
  timers.restore();
});
