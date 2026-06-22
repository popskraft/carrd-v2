const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createDom,
  loadScript,
  triggerDomReady,
  setPluginOptions,
  mockMutationObserver,
  useFakeTimers
} = require('./helpers');

test('no-loadwaiting marks body ready and hides loader', () => {
  const dom = createDom('<div id="loader"></div>');
  const timers = useFakeTimers(dom);
  const { observers } = mockMutationObserver(dom);

  setPluginOptions(dom, {
    noLoadwaiting: {
      animationDuration: 0,
      observerTimeout: 0,
      scrollPulseCount: 1,
      rafPulseCount: 1
    }
  });

  dom.window.document.body.className = 'is-loading with-loader';
  loadScript(dom, 'src/no-loadwaiting-v2/no-loadwaiting-v2.js');
  triggerDomReady(dom);
  timers.flush();

  const body = dom.window.document.body;
  const loader = dom.window.document.getElementById('loader');
  assert.ok(body.classList.contains('is-ready'));
  assert.ok(!body.classList.contains('is-loading'));
  assert.ok(!body.classList.contains('with-loader'));
  assert.equal(loader.style.display, 'none');
  assert.equal(loader.style.visibility, 'hidden');
  assert.equal(loader.getAttribute('aria-hidden'), 'true');
  assert.equal(observers.length, 2);
  timers.restore();
});

test('no-loadwaiting observer callback removes with-loader class', () => {
  const dom = createDom('<div id="loader"></div>');
  const timers = useFakeTimers(dom);
  const { observers } = mockMutationObserver(dom);

  setPluginOptions(dom, {
    noLoadwaiting: {
      observerTimeout: 999999,
      scrollPulseCount: 0,
      rafPulseCount: 0
    }
  });

  loadScript(dom, 'src/no-loadwaiting-v2/no-loadwaiting-v2.js');
  triggerDomReady(dom);

  const body = dom.window.document.body;
  body.classList.add('with-loader');
  observers[0].trigger();
  assert.ok(!body.classList.contains('with-loader'));
  timers.restore();
});

test('no-loadwaiting dispatches resize pulses without synthetic scroll events', () => {
  const dom = createDom('<div id="loader"></div>');
  const timers = useFakeTimers(dom);
  mockMutationObserver(dom);

  let resizeEvents = 0;
  let scrollEvents = 0;
  dom.window.addEventListener('resize', () => {
    resizeEvents += 1;
  });
  dom.window.addEventListener('scroll', () => {
    scrollEvents += 1;
  });

  setPluginOptions(dom, {
    noLoadwaiting: {
      animationDuration: 0,
      observerTimeout: 0,
      scrollPulseInterval: 1,
      scrollPulseCount: 2,
      rafPulseCount: 2
    }
  });

  loadScript(dom, 'src/no-loadwaiting-v2/no-loadwaiting-v2.js');
  triggerDomReady(dom);
  timers.flush();

  assert.equal(scrollEvents, 0);
  assert.ok(resizeEvents >= 3);
  timers.restore();
});
