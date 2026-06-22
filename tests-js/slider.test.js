const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, mockViewport, setPluginOptions, triggerDomReady, useFakeTimers } = require('./helpers');

function setSlideWidths(instance, width = 100) {
  instance.slideElements.forEach((slide) => {
    Object.defineProperty(slide, 'offsetWidth', {
      value: width,
      configurable: true
    });
  });
}

function drag(instance, fromX, toX, fromY = 0, toY = 0) {
  instance.onDragStart({ type: 'mousedown', clientX: fromX, clientY: fromY });
  instance.onDragMove({
    type: 'mousemove',
    clientX: toX,
    clientY: toY,
    cancelable: true,
    preventDefault() {}
  });
  instance.onDragEnd();
}

test('slider initializes and registers instance', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div>');
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-slider-wrapper').length, 1);
  assert.equal(doc.querySelectorAll('.theme-slider-track .theme-slider-slide').length, 2);
  assert.ok(dom.window.CarrdSliderV2);
  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 1);
});

test('slider initializes from data-slider-v2 groups and keeps names isolated', () => {
  const dom = createDom(
    '<div data-slider-v2="gallery">A</div>' +
    '<div data-slider-v2="gallery">B</div>' +
    '<div data-slider-v2="reviews">C</div>' +
    '<div data-slider-v2="reviews">D</div>'
  );
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const wrappers = doc.querySelectorAll('.theme-slider-wrapper');

  assert.equal(wrappers.length, 2);
  assert.equal(wrappers[0].querySelectorAll('.theme-slider-slide').length, 2);
  assert.equal(wrappers[1].querySelectorAll('.theme-slider-slide').length, 2);
  assert.equal(dom.window.CarrdSliderV2.destroyById('gallery'), true);
  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 1);
});

test('slider destroyById removes instance', () => {
  const dom = createDom('<div class="slider" data-slider-v2-id="hero">A</div><div class="slider">B</div>');
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 1);
  assert.equal(dom.window.CarrdSliderV2.destroyById('hero'), true);
  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 0);
  assert.equal(dom.window.document.querySelectorAll('.theme-slider-wrapper').length, 0);

  dom.window.CarrdSliderV2.init();
  assert.equal(dom.window.CarrdSliderV2.getInstances().length, 1);
});

test('slider honors slideSelector override', () => {
  const dom = createDom('<div class="slide-card">A</div><div class="slide-card">B</div>');
  setPluginOptions(dom, {
    slider: {
      slideSelector: '.slide-card'
    }
  });

  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-slider-wrapper').length, 1);
});

test('slider snaps smoothly to the next slide by default after a horizontal drag', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);

  instance.onDragStart({ type: 'mousedown', clientX: 0, clientY: 0 });
  instance.onDragMove({ type: 'mousemove', clientX: -40, clientY: 0, cancelable: true, preventDefault() {} });
  instance.onDragEnd();

  assert.equal(instance.currentIndex, 1);
  assert.equal(instance.translateX, -116);
  assert.equal(instance.track.style.transform, 'translateX(-116px)');
  assert.match(instance.track.style.transition, /cubic-bezier/);
});

test('slider leaves vertical mobile scrolling untouched', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div>');
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  let prevented = false;

  instance.onDragStart({ type: 'touchstart', touches: [{ clientX: 100, clientY: 100 }] });
  instance.onDragMove({
    type: 'touchmove',
    touches: [{ clientX: 104, clientY: 140 }],
    cancelable: true,
    preventDefault() { prevented = true; }
  });
  instance.onDragEnd();

  assert.equal(prevented, false);
  assert.equal(Math.abs(instance.translateX), 0);
  assert.equal(instance.track.style.transform, 'translateX(0px)');
});

test('slider lets vertical mobile scrolling start on linked images', () => {
  const dom = createDom(
    '<div class="slider"><a href="/a"><img src="/a.jpg" alt="A"></a></div>' +
    '<div class="slider"><a href="/b"><img src="/b.jpg" alt="B"></a></div>'
  );
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  const image = dom.window.document.querySelector('img');
  let prevented = false;

  instance.onDragStart({ type: 'touchstart', target: image, touches: [{ clientX: 100, clientY: 100 }] });
  instance.onDragMove({
    type: 'touchmove',
    target: image,
    touches: [{ clientX: 103, clientY: 150 }],
    cancelable: true,
    preventDefault() { prevented = true; }
  });
  instance.onDragEnd();

  assert.equal(prevented, false);
  assert.equal(instance.suppressClick, false);
  assert.equal(Math.abs(instance.translateX), 0);
  assert.equal(instance.track.style.transform, 'translateX(0px)');
});

test('slider suppresses linked-image clicks after horizontal mobile swipes', () => {
  const dom = createDom(
    '<div class="slider"><a href="/a"><img src="/a.jpg" alt="A"></a></div>' +
    '<div class="slider"><a href="/b"><img src="/b.jpg" alt="B"></a></div>' +
    '<div class="slider"><a href="/c"><img src="/c.jpg" alt="C"></a></div>'
  );
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  const image = dom.window.document.querySelector('img');
  const link = image.closest('a');
  setSlideWidths(instance);
  let preventedMove = false;

  instance.onDragStart({ type: 'touchstart', target: image, touches: [{ clientX: 100, clientY: 100 }] });
  instance.onDragMove({
    type: 'touchmove',
    target: image,
    touches: [{ clientX: 40, clientY: 102 }],
    cancelable: true,
    preventDefault() { preventedMove = true; }
  });
  instance.onDragEnd();

  const clickEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const clickAllowed = link.dispatchEvent(clickEvent);

  assert.equal(preventedMove, true);
  assert.equal(clickAllowed, false);
  assert.equal(clickEvent.defaultPrevented, true);
  assert.equal(instance.suppressClick, false);
  assert.equal(instance.currentIndex, 1);
});

test('slider freeScroll option keeps inertia after release instead of snapping', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  const timers = useFakeTimers(dom);
  mockViewport(dom, 375);
  setPluginOptions(dom, { slider: { freeScroll: true } });
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);

  instance.onDragStart({ type: 'mousedown', clientX: 0, clientY: 0 });
  instance.lastDragTime = Date.now() - 16;
  instance.lastDragX = 0;
  instance.onDragMove({ type: 'mousemove', clientX: -40, clientY: 0, cancelable: true, preventDefault() {} });
  instance.onDragEnd();
  timers.flush();

  assert.ok(instance.translateX < -40);
  assert.equal(instance.track.style.transform, `translateX(${instance.translateX}px)`);
  timers.restore();
});

test('slider freeScroll responds to horizontal wheel movement', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  setPluginOptions(dom, { slider: { wheelScroll: true, freeScroll: true } });
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);

  instance.onWheel({
    deltaX: 40,
    deltaY: 0,
    shiftKey: false,
    cancelable: true,
    preventDefault() {}
  });

  assert.equal(instance.translateX, -40);
  assert.equal(instance.track.style.transform, 'translateX(-40px)');
});

test('slider ignores short horizontal movement below snap threshold', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  drag(instance, 0, -20);

  assert.equal(instance.currentIndex, 0);
  assert.equal(Math.abs(instance.translateX), 0);
});

test('slider uses final drag direction after a mid-gesture reversal', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  instance.goToSlide(1);
  instance.onDragStart({ type: 'mousedown', clientX: 0, clientY: 0 });
  instance.onDragMove({ type: 'mousemove', clientX: -60, clientY: 0, cancelable: true, preventDefault() {} });
  instance.onDragMove({ type: 'mousemove', clientX: 45, clientY: 0, cancelable: true, preventDefault() {} });
  instance.onDragEnd();

  assert.equal(instance.currentIndex, 0);
  assert.equal(Math.abs(instance.translateX), 0);
});

test('slider stays clamped under repeated swipes at both boundaries', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);

  for (let i = 0; i < 20; i += 1) drag(instance, 0, 80);
  assert.equal(instance.currentIndex, 0);
  assert.equal(Math.abs(instance.translateX), 0);

  for (let i = 0; i < 20; i += 1) drag(instance, 0, -80);
  assert.equal(instance.currentIndex, instance.getTotalPages() - 1);
  assert.equal(instance.translateX, instance.getMinTranslate());
});

test('slider keeps one snap cleanup handler during rapid navigation', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  const timers = useFakeTimers(dom);
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  for (let i = 0; i < 50; i += 1) instance.goToSlide(i % 3);

  assert.equal(instance.currentIndex, 1);
  assert.equal(instance.translateX, -116);
  assert.equal(typeof instance.snapEndHandler, 'function');
  timers.flush();
  assert.equal(instance.snapEndHandler, null);
  assert.equal(instance.snapFallbackTimer, null);
  assert.equal(instance.track.style.transition, '');
  timers.restore();
});

test('slider navigation controls do not start or interrupt dragging', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);

  instance.nextBtn.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true }));
  assert.equal(instance.isDragging, false);
  instance.nextBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  instance.nextBtn.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true }));
  instance.nextBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  assert.equal(instance.isDragging, false);
  assert.equal(instance.currentIndex, 2);
  assert.equal(instance.translateX, -232);
});

test('slider starts a new drag from the rendered in-flight position', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  instance.goToSlide(2);
  const originalGetComputedStyle = dom.window.getComputedStyle;
  dom.window.getComputedStyle = () => ({ transform: 'matrix(1, 0, 0, 1, -70, 0)' });
  instance.onDragStart({ type: 'mousedown', clientX: 0, clientY: 0 });

  assert.equal(instance.dragStartTranslate, -70);
  assert.equal(instance.track.style.transform, 'translateX(-70px)');
  dom.window.getComputedStyle = originalGetComputedStyle;
});

test('slider loop mode wraps navigation indexes', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  mockViewport(dom, 375);
  setPluginOptions(dom, { slider: { loop: true } });
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  instance.goToSlide(-1);
  assert.equal(instance.currentIndex, instance.getTotalPages() - 1);
  instance.goToSlide(instance.getTotalPages());
  assert.equal(instance.currentIndex, 0);
});

test('slider recalculates pages and clamps the index after viewport resize', () => {
  const dom = createDom(Array.from({ length: 7 }, (_, i) => `<div class="slider">${i}</div>`).join(''));
  const timers = useFakeTimers(dom);
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  instance.goToSlide(instance.getTotalPages() - 1);
  mockViewport(dom, 1280);
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  timers.flush();

  assert.equal(instance.currentIndex, instance.getTotalPages() - 1);
  assert.equal(instance.translateX, instance.getMinTranslate());
  timers.restore();
});

test('slider clears stale dot references when resize leaves one page', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div>');
  mockViewport(dom, 375);
  setPluginOptions(dom, {
    slider: {
      breakpoints: {
        737: { slidesPerView: 2, peek: 0 }
      }
    }
  });
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  assert.equal(instance.dots.length, 2);

  mockViewport(dom, 737);
  instance.updateSlidesPerView();

  assert.equal(instance.dots.length, 0);
  assert.equal(instance.dotsContainer.style.display, 'none');
});

test('slider autoplay stops during drag and resumes after snap', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div><div class="slider">C</div>');
  const timers = useFakeTimers(dom);
  mockViewport(dom, 375);
  setPluginOptions(dom, { slider: { autoplay: true } });
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  assert.notEqual(instance.autoplayTimer, null);
  instance.onDragStart({ type: 'mousedown', clientX: 0, clientY: 0 });
  assert.equal(instance.autoplayTimer, null);
  instance.onDragMove({ type: 'mousemove', clientX: -40, clientY: 0, cancelable: true, preventDefault() {} });
  instance.onDragEnd();
  assert.notEqual(instance.autoplayTimer, null);
  instance.stopAutoplay();
  timers.restore();
});

test('slider survives 500 mixed drag, navigation, and resize operations', () => {
  const dom = createDom(Array.from({ length: 8 }, (_, i) => `<div class="slider">${i}</div>`).join(''));
  const timers = useFakeTimers(dom);
  mockViewport(dom, 375);
  loadScript(dom, 'src/slider-v2/slider-v2.js');
  triggerDomReady(dom);

  const instance = dom.window.CarrdSliderV2.getInstances()[0];
  setSlideWidths(instance);
  let seed = 0x5f3759df;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (let i = 0; i < 500; i += 1) {
    const operation = Math.floor(random() * 4);
    if (operation === 0) {
      drag(instance, 0, Math.round((random() - 0.5) * 240));
    } else if (operation === 1) {
      instance.goToSlide(Math.floor(random() * 14) - 3);
    } else if (operation === 2) {
      instance.onDragStart({ type: 'touchstart', touches: [{ clientX: 100, clientY: 100 }] });
      instance.onDragMove({
        type: 'touchmove',
        touches: [{ clientX: 100 + Math.round(random() * 8), clientY: 140 }],
        cancelable: true,
        preventDefault() { throw new Error('vertical gesture must not be prevented'); }
      });
      instance.onDragEnd();
    } else {
      mockViewport(dom, random() > 0.5 ? 375 : 1280);
      instance.updateSlidesPerView();
      instance.updateSlider();
    }

    assert.ok(Number.isFinite(instance.translateX));
    assert.ok(instance.currentIndex >= 0);
    assert.ok(instance.currentIndex < instance.getTotalPages());
    assert.ok(instance.translateX <= 0);
    assert.ok(instance.translateX >= instance.getMinTranslate());
  }

  instance.cancelMomentum();
  timers.restore();
});
