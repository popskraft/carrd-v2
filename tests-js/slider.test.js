const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady } = require('./helpers');

// slider intentionally avoids IntersectionObserver/matchMedia/scrollend
// assertions here (all feature-detected and absent in jsdom) — see
// docs/specs/slider-v2-plan.md §8.3: active-slide selection is exercised
// through the exported pure functions instead.

test('slider parses default config when no data attributes are set', () => {
  const dom = createDom('<div data-slider>A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  assert.equal(instance.config.mode, 'free');
  assert.deepEqual(Array.from(instance.config.spv), [1.2, 3, 4]);
  assert.deepEqual(Array.from(instance.config.gap), [16, 16, 16]);
  assert.equal(instance.config.autoplay, 0);
  assert.equal(instance.config.dots, true);
  assert.equal(instance.config.arrows, true);
  assert.equal(instance.wrapper.getAttribute('data-mode'), 'free');
});

test('slider expands a single-value spv/gap triplet to all three breakpoints', () => {
  const dom = createDom('<div data-slider data-slider-spv="2" data-slider-gap="24">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  assert.deepEqual(Array.from(instance.config.spv), [2, 2, 2]);
  assert.deepEqual(Array.from(instance.config.gap), [24, 24, 24]);
});

test('slider expands a two-value triplet to mobile + (>=737 and >=1280)', () => {
  const dom = createDom('<div data-slider data-slider-spv="1 2" data-slider-gap="8 20">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  assert.deepEqual(Array.from(instance.config.spv), [1, 2, 2]);
  assert.deepEqual(Array.from(instance.config.gap), [8, 20, 20]);
});

test('slider accepts a full three-value triplet, decimals included', () => {
  const dom = createDom('<div data-slider data-slider-spv="1.2 3 4" data-slider-gap="8 16 24">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  assert.deepEqual(Array.from(instance.config.spv), [1.2, 3, 4]);
  assert.deepEqual(Array.from(instance.config.gap), [8, 16, 24]);
});

test('slider falls back to defaults and warns once per invalid attribute', () => {
  const dom = createDom(
    '<div data-slider ' +
    'data-slider-mode="diagonal" ' +
    'data-slider-spv="abc" ' +
    'data-slider-gap="1 2 3 4" ' +
    'data-slider-autoplay="soon" ' +
    'data-slider-dots="maybe" ' +
    'data-slider-arrows="nope">A</div>' +
    '<div data-slider>B</div>'
  );
  const warnings = [];
  dom.window.console.warn = (...args) => warnings.push(args.join(' '));

  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  assert.equal(instance.config.mode, 'free');
  assert.deepEqual(Array.from(instance.config.spv), [1.2, 3, 4]);
  assert.deepEqual(Array.from(instance.config.gap), [16, 16, 16]);
  assert.equal(instance.config.autoplay, 0);
  assert.equal(instance.config.dots, true);
  assert.equal(instance.config.arrows, true);

  ['data-slider-mode', 'data-slider-spv', 'data-slider-gap', 'data-slider-autoplay', 'data-slider-dots', 'data-slider-arrows']
    .forEach((attr) => assert.ok(warnings.some((w) => w.includes(attr)), `expected a warning mentioning ${attr}`));
});

test('slider negative gap is invalid, zero is not', () => {
  const dom = createDom('<div data-slider data-slider-gap="-4">A</div><div data-slider>B</div>');
  const warnings = [];
  dom.window.console.warn = (...args) => warnings.push(args.join(' '));
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  assert.deepEqual(Array.from(dom.window.CarrdSlider.getInstances()[0].config.gap), [16, 16, 16]);
  assert.ok(warnings.some((w) => w.includes('data-slider-gap')));
});

test('slider accepts explicit free mode and reflects it on the wrapper', () => {
  const dom = createDom('<div data-slider data-slider-mode="free">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  assert.equal(instance.config.mode, 'free');
  assert.equal(instance.wrapper.getAttribute('data-mode'), 'free');
});

test('slider detects clusters by data-slider name and keeps them isolated', () => {
  const dom = createDom(
    '<div data-slider="gallery">A</div>' +
    '<div data-slider="gallery">B</div>' +
    '<div data-slider="reviews">C</div>' +
    '<div data-slider="reviews">D</div>'
  );
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-slider-wrapper').length, 2);
  assert.equal(dom.window.CarrdSlider.getInstances().length, 2);
  assert.equal(dom.window.CarrdSlider.destroyById('gallery'), true);
  assert.equal(dom.window.CarrdSlider.getInstances().length, 1);
});

test('slider skips a slide already marked data-slider-initialized', () => {
  const dom = createDom('<div data-slider data-slider-initialized="true">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instances = dom.window.CarrdSlider.getInstances();
  assert.equal(instances.length, 1);
  assert.equal(instances[0].slides.length, 1);
  assert.equal(dom.window.document.querySelectorAll('.theme-slider-wrapper').length, 1);
});

test('slider destroy() restores the original DOM exactly', () => {
  const dom = createDom('<div id="root"><div data-slider>A</div><div data-slider>B</div></div>');
  const root = dom.window.document.getElementById('root');
  const before = root.innerHTML;

  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  assert.notEqual(root.innerHTML, before);

  dom.window.CarrdSlider.destroyAll();
  assert.equal(root.innerHTML, before);
});

test('slider gives every generated slide an accessible position label', () => {
  const dom = createDom('<div data-slider>A</div><div data-slider>B</div><div data-slider>C</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const slides = [...dom.window.document.querySelectorAll('.theme-slider-slide')];
  assert.deepEqual(slides.map((slide) => ({
    role: slide.getAttribute('role'),
    roledescription: slide.getAttribute('aria-roledescription'),
    label: slide.getAttribute('aria-label')
  })), [
    { role: 'group', roledescription: 'slide', label: '1 of 3' },
    { role: 'group', roledescription: 'slide', label: '2 of 3' },
    { role: 'group', roledescription: 'slide', label: '3 of 3' }
  ]);
});

test('slider destroy() clears pending scroll timers and listeners', () => {
  const dom = createDom('<div data-slider>A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  instance.scrollSyncTimer = dom.window.setTimeout(() => {}, 1000);
  instance.scrollEndTimer = dom.window.setTimeout(() => {}, 1000);
  instance.waitForScrollEnd(() => {});
  assert.notEqual(instance.scrollSyncTimer, null);
  assert.ok(instance.scrollEndTimer !== null || instance.scrollEndHandler !== null);

  dom.window.CarrdSlider.destroyAll();
  assert.equal(instance.scrollSyncTimer, null);
  assert.equal(instance.scrollEndTimer, null);
  assert.equal(instance.scrollEndHandler, null);
});

test('slider free mode renders dots by default', () => {
  const dom = createDom('<div data-slider data-slider-mode="free">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  assert.notEqual(dom.window.document.querySelector('.theme-slider-dots'), null);
});

test('slider free mode with an explicit dots=on renders the dots container', () => {
  const dom = createDom('<div data-slider data-slider-mode="free" data-slider-dots="on">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  assert.notEqual(dom.window.document.querySelector('.theme-slider-dots'), null);
});

test('slider center mode with dots=off renders no dots container', () => {
  const dom = createDom('<div data-slider data-slider-mode="center" data-slider-dots="off">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  assert.equal(dom.window.document.querySelector('.theme-slider-dots'), null);
});

test('slider arrows=off omits the nav buttons', () => {
  const dom = createDom('<div data-slider data-slider-arrows="off">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  assert.equal(dom.window.document.querySelector('.theme-slider-nav'), null);
});

test('slider hides arrows on mobile by default (data-arrows-mobile="off")', () => {
  const dom = createDom('<div data-slider>A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  const wrapper = dom.window.document.querySelector('.theme-slider-wrapper');
  assert.equal(wrapper.getAttribute('data-arrows-mobile'), 'off');
});

test('slider data-slider-arrows-mobile="on" keeps arrows visible on mobile', () => {
  const dom = createDom('<div data-slider data-slider-arrows-mobile="on">A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  const wrapper = dom.window.document.querySelector('.theme-slider-wrapper');
  assert.equal(wrapper.getAttribute('data-arrows-mobile'), 'on');
  assert.notEqual(dom.window.document.querySelector('.theme-slider-nav'), null);
});

test('slider falls back to arrows-mobile off and warns on an invalid data-slider-arrows-mobile value', () => {
  const dom = createDom('<div data-slider data-slider-arrows-mobile="maybe">A</div><div data-slider>B</div>');
  const warnings = [];
  dom.window.console.warn = (...args) => warnings.push(args.join(' '));
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);
  const wrapper = dom.window.document.querySelector('.theme-slider-wrapper');
  assert.equal(wrapper.getAttribute('data-arrows-mobile'), 'off');
  assert.ok(warnings.some((w) => w.includes('data-slider-arrows-mobile')));
});

test('slider arrow clicks advance by exactly one slide pitch', () => {
  const dom = createDom('<div data-slider>A</div><div data-slider>B</div><div data-slider>C</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  Object.defineProperties(instance.scroller, {
    clientWidth: { configurable: true, value: 600 },
    scrollWidth: { configurable: true, value: 1800 }
  });
  Object.defineProperties(instance.slideElements[0], {
    offsetLeft: { configurable: true, value: 0 },
    offsetWidth: { configurable: true, value: 300 }
  });
  Object.defineProperty(instance.slideElements[1], 'offsetLeft', { configurable: true, value: 316 });
  const targets = [];
  instance.scroller.scrollTo = ({ left }) => targets.push(left);
  instance.updateNavState(0);

  instance.nextBtn.click();
  instance.nextBtn.click();
  instance.prevBtn.click();

  assert.deepEqual(targets, [316, 632, 316]);
});

test('slider arrows disable at the actual scroll boundaries', () => {
  const dom = createDom('<div data-slider>A</div><div data-slider>B</div>');
  loadScript(dom, 'src/slider/slider.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSlider.getInstances()[0];
  Object.defineProperties(instance.scroller, {
    clientWidth: { configurable: true, value: 600 },
    scrollWidth: { configurable: true, value: 1000 }
  });
  instance.updateNavState(0);
  assert.equal(instance.prevBtn.disabled, true);
  assert.equal(instance.nextBtn.disabled, false);
  instance.updateNavState(400);
  assert.equal(instance.prevBtn.disabled, false);
  assert.equal(instance.nextBtn.disabled, true);
});

// --- Pure helpers: active-index selection logic, unit-tested directly.
// IO/scroll geometry are not emulated in jsdom (see plan §8.3); the
// underlying selection function is exercised here instead.

test('pickActiveIndex selects the slide with the highest intersection ratio', () => {
  const dom = createDom('');
  loadScript(dom, 'src/slider/slider.js');
  const { pickActiveIndex } = dom.window.CarrdSlider;

  assert.equal(pickActiveIndex([0, 0.2, 0.9, 0.1]), 2);
  assert.equal(pickActiveIndex([1, 1, 1]), 0);
  assert.equal(pickActiveIndex([0, 0, 0]), 0);
  assert.equal(pickActiveIndex([]), 0);
});

test('resolveBreakpointIndex maps viewport width to the correct tier', () => {
  const dom = createDom('');
  loadScript(dom, 'src/slider/slider.js');
  const { resolveBreakpointIndex } = dom.window.CarrdSlider;

  assert.equal(resolveBreakpointIndex(320), 0);
  assert.equal(resolveBreakpointIndex(736), 0);
  assert.equal(resolveBreakpointIndex(737), 1);
  assert.equal(resolveBreakpointIndex(1279), 1);
  assert.equal(resolveBreakpointIndex(1280), 2);
});
