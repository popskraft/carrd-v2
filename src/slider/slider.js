(function () {
  'use strict';

  // Native CSS scroll-snap engine. No window.CarrdPluginOptions;
  // position is always scroller.scrollLeft. See docs/specs/slider-v2-plan.md.

  const BREAKPOINTS = [737, 1280];
  const DEFAULT_SPV = [1.2, 3, 4];
  const DEFAULT_GAP = [16, 16, 16];
  const WARN_PREFIX = '[slider]';
  const S = {
    wrap: 'theme-slider-wrapper', scroller: 'theme-slider-scroller', slide: 'theme-slider-slide',
    dots: 'theme-slider-dots', dot: 'theme-slider-dot',
    nav: 'theme-slider-nav', prev: 'theme-slider-nav--prev', next: 'theme-slider-nav--next',
    grabbing: 'is-grabbing'
  };
  const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"]';
  const safeNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  const ICONS = {
    prev: `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    next: `<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"></polyline></svg>`
  };
  const SLIDER_INSTANCES = [];

  function warn(id, msg) { console.warn(`${WARN_PREFIX}${id ? ' [' + id + ']' : ''} ${msg}`); }
  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // --- Cluster detection (ported from v1, attribute hardcoded to data-slider) ---
  function normalizeName(value) {
    return (value || '').trim().replace(/&quot;/g, '"').replace(/^["']+|["']+$/g, '');
  }
  function getSliderName(slide) {
    const name = normalizeName(slide.getAttribute('data-slider'));
    return safeNamePattern.test(name) ? name : '';
  }
  function isSameSliderCluster(slide, baseName) {
    if (!slide || !slide.matches || !slide.matches('[data-slider]')) return false;
    const slideName = getSliderName(slide);
    if (baseName || slideName) return slideName === baseName;
    return true;
  }
  function findSliderClusters() {
    const all = document.querySelectorAll('[data-slider]');
    if (!all.length) return [];
    const clusters = [], processed = new Set();
    all.forEach((slide) => {
      if (processed.has(slide) || slide.getAttribute('data-slider-initialized') === 'true') return;
      const baseName = getSliderName(slide);
      const cluster = [slide];
      processed.add(slide);
      let sib = slide.nextElementSibling;
      while (isSameSliderCluster(sib, baseName) && !processed.has(sib)) {
        cluster.push(sib);
        processed.add(sib);
        sib = sib.nextElementSibling;
      }
      cluster.forEach((el) => el.setAttribute('data-slider-initialized', 'true'));
      clusters.push(cluster);
    });
    return clusters;
  }

  // --- data-attribute configuration (read only from cluster[0]) ---
  function parseTriplet(raw, fallback, validate) {
    if (raw == null) return { value: fallback.slice(), invalid: false };
    const nums = String(raw).trim().split(/\s+/).filter(Boolean).map(Number);
    if (!nums.length || nums.length > 3 || nums.some((n) => !validate(n))) return { value: fallback.slice(), invalid: true };
    if (nums.length === 1) return { value: [nums[0], nums[0], nums[0]], invalid: false };
    if (nums.length === 2) return { value: [nums[0], nums[1], nums[1]], invalid: false };
    return { value: nums, invalid: false };
  }

  function parseMode(raw, warnFn) {
    if (raw == null) return 'free';
    const v = normalizeName(raw).toLowerCase();
    if (v === 'center' || v === 'free') return v;
    warnFn(`invalid data-slider-mode "${raw}", using default "free"`);
    return 'free';
  }

  // Returns true/false for an explicit "on"/"off" value, or null when unset
  // or invalid (caller decides the default in that case).
  function parseOnOffFlag(raw, attrName, warnFn) {
    if (raw == null) return null;
    const v = normalizeName(raw).toLowerCase();
    if (v === 'off') return false;
    if (v === 'on') return true;
    warnFn(`invalid ${attrName} "${raw}", using default`);
    return null;
  }

  function parseAutoplay(raw, warnFn) {
    if (raw == null) return 0;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    warnFn(`invalid data-slider-autoplay "${raw}", autoplay disabled`);
    return 0;
  }

  function parseSizeTriplet(raw, attrName, fallback, validate, warnFn) {
    const result = parseTriplet(raw, fallback, validate);
    if (raw != null && result.invalid) warnFn(`invalid ${attrName} "${raw}", using default "${fallback.join(' ')}"`);
    return result.value;
  }

  function parseConfig(firstSlide, warnFn) {
    const mode = parseMode(firstSlide.getAttribute('data-slider-mode'), warnFn);
    const spv = parseSizeTriplet(firstSlide.getAttribute('data-slider-spv'), 'data-slider-spv', DEFAULT_SPV, (n) => Number.isFinite(n) && n > 0, warnFn);
    const gap = parseSizeTriplet(firstSlide.getAttribute('data-slider-gap'), 'data-slider-gap', DEFAULT_GAP, (n) => Number.isFinite(n) && n >= 0, warnFn);
    const autoplay = parseAutoplay(firstSlide.getAttribute('data-slider-autoplay'), warnFn);
    const dotsFlag = parseOnOffFlag(firstSlide.getAttribute('data-slider-dots'), 'data-slider-dots', warnFn);
    const arrowsFlag = parseOnOffFlag(firstSlide.getAttribute('data-slider-arrows'), 'data-slider-arrows', warnFn);
    const arrowsMobileFlag = parseOnOffFlag(firstSlide.getAttribute('data-slider-arrows-mobile'), 'data-slider-arrows-mobile', warnFn);
    return {
      mode, spv, gap, autoplay,
      dots: dotsFlag !== false,
      arrows: arrowsFlag !== false,
      arrowsMobile: arrowsMobileFlag === true
    };
  }

  // --- Pure helpers, unit-tested directly (no DOM/layout dependency) ---
  function resolveBreakpointIndex(width) {
    if (width >= BREAKPOINTS[1]) return 2;
    if (width >= BREAKPOINTS[0]) return 1;
    return 0;
  }
  function pickActiveIndex(ratios) {
    if (!ratios || !ratios.length) return 0;
    let best = 0, bestRatio = ratios[0];
    for (let i = 1; i < ratios.length; i++) { if (ratios[i] > bestRatio) { bestRatio = ratios[i]; best = i; } }
    return best;
  }

  // One instance owns the generated wrapper/scroller, IO-driven active-index
  // tracking, mouse-drag (touch stays fully native), autoplay, and breakpoint
  // CSS-variable recalculation for a contiguous cluster of `[data-slider]` els.
  class Slider {
    constructor(slides, config) {
      this.slides = slides;
      this.config = config;
      this.currentIndex = 0;
      this.eventHandlers = [];
      this.dotHandlers = [];
      this.mqlHandlers = [];
      this.suppressClick = false;
      this.suppressClickTimer = null;
      this.scrollSyncTimer = null;
      this.scrollEndTimer = null;
      this.scrollEndHandler = null;
      this.navTargetLeft = null;
      this.inertiaId = null;
      this.autoplayTimer = null;
      this.init();
    }

    init() {
      this.wrapper = document.createElement('div');
      this.wrapper.className = S.wrap;
      this.wrapper.setAttribute('role', 'region');
      this.wrapper.setAttribute('aria-roledescription', 'carousel');
      this.wrapper.setAttribute('tabindex', '0');
      this.wrapper.setAttribute('data-mode', this.config.mode);
      this.wrapper.setAttribute('data-arrows-mobile', this.config.arrowsMobile ? 'on' : 'off');
      this.slides[0].parentNode.insertBefore(this.wrapper, this.slides[0]);
      this.scroller = document.createElement('div');
      this.scroller.className = S.scroller;
      this.wrapper.appendChild(this.scroller);
      this.slideElements = this.slides.map((slide, index) => {
        const w = document.createElement('div');
        w.className = S.slide;
        w.setAttribute('role', 'group');
        w.setAttribute('aria-roledescription', 'slide');
        w.setAttribute('aria-label', `${index + 1} of ${this.slides.length}`);
        w.appendChild(slide);
        this.scroller.appendChild(w);
        return w;
      });
      const multi = this.slides.length > 1;
      if (this.config.dots && multi) {
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = S.dots;
        this.wrapper.appendChild(this.dotsContainer);
        this.buildDots();
      }
      if (this.config.arrows && multi) this.createArrows();
      this.updateResponsiveVars();
      this.setupBreakpointListeners();
      this.setupObserver();
      this.bindScrollEndSync();
      this.bindPointerDrag();
      this.bindKeyboard();
      this.setActiveIndex(0);
      if (this.config.autoplay && multi) this.startAutoplay();
      this.bindAutoplayGuards();
      this.addListener(window, 'load', () => this.refreshLayout(), { once: true });
    }

    addListener(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      this.eventHandlers.push({ target, event, handler, options });
    }

    // Layout: CSS variables only, recomputed on breakpoint change.
    updateResponsiveVars() {
      const idx = resolveBreakpointIndex(window.innerWidth || 0);
      const spv = this.config.spv[idx], gap = this.config.gap[idx];
      const totalGaps = Math.max(0, Math.ceil(spv) - 1);
      this.wrapper.style.setProperty('--slider-gap', gap + 'px');
      this.wrapper.style.setProperty('--slider-slide-w', `calc((100% - ${totalGaps * gap}px) / ${spv})`);
    }

    setupBreakpointListeners() {
      if (typeof window.matchMedia !== 'function') return;
      const handler = () => this.updateResponsiveVars();
      [`(min-width: ${BREAKPOINTS[0]}px)`, `(min-width: ${BREAKPOINTS[1]}px)`].forEach((query) => {
        const mql = window.matchMedia(query);
        if (mql.addEventListener) mql.addEventListener('change', handler);
        else if (mql.addListener) mql.addListener(handler);
        this.mqlHandlers.push({ mql, handler });
      });
    }

    refreshLayout() { this.updateResponsiveVars(); }

    // Dots / arrows / active-slide bookkeeping.
    buildDots() {
      this.dotHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      this.dotHandlers = [];
      this.dotsContainer.innerHTML = '';
      this.slideElements.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = S.dot;
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        const fn = () => this.scrollToSlide(i);
        dot.addEventListener('click', fn);
        this.dotHandlers.push({ el: dot, fn });
        this.dotsContainer.appendChild(dot);
      });
      this.dots = this.dotsContainer.querySelectorAll('.' + S.dot);
    }

    createArrows() {
      const makeBtn = (cls, label, icon, fn) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = S.nav + ' ' + cls;
        btn.setAttribute('aria-label', label);
        btn.innerHTML = icon;
        this.addListener(btn, 'click', () => fn());
        this.wrapper.appendChild(btn);
        return btn;
      };
      this.prevBtn = makeBtn(S.prev, 'Previous slide', ICONS.prev, () => this.scrollBySlide(-1));
      this.nextBtn = makeBtn(S.next, 'Next slide', ICONS.next, () => this.scrollBySlide(1));
      this.addListener(this.scroller, 'scroll', () => this.updateNavState(), { passive: true });
      this.updateNavState();
    }

    bindKeyboard() {
      this.addListener(this.wrapper, 'keydown', (e) => {
        if (e.key === 'ArrowLeft') this.scrollToSlide(this.currentIndex - 1);
        if (e.key === 'ArrowRight') this.scrollToSlide(this.currentIndex + 1);
      });
    }

    setActiveIndex(i) {
      this.currentIndex = i;
      this.wrapper.setAttribute('aria-label', `Slide ${i + 1} of ${this.slideElements.length}`);
      if (this.dots) this.dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
      this.updateNavState();
    }

    // Programmatic scroll — arrows/dots/keyboard/autoplay all funnel here.
    scrollTo(left) {
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      if (typeof this.scroller.scrollTo === 'function') this.scroller.scrollTo({ left, behavior });
      else this.scroller.scrollLeft = left;
    }

    scrollBySlide(direction) {
      const first = this.slideElements[0], second = this.slideElements[1];
      if (!first || !direction) return;
      const gap = parseFloat(getComputedStyle(this.scroller).gap) || 0;
      const pitch = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth + gap;
      if (!(pitch > 0)) return;
      const maxScroll = Math.max(0, this.scroller.scrollWidth - this.scroller.clientWidth);
      const base = this.navTargetLeft === null ? this.scroller.scrollLeft : this.navTargetLeft;
      this.navTargetLeft = Math.max(0, Math.min(maxScroll, base + direction * pitch));
      this.scrollTo(this.navTargetLeft);
      this.updateNavState(this.navTargetLeft);
      this.waitForScrollEnd(() => {
        this.navTargetLeft = null;
        this.syncFromScroll();
      });
    }

    updateNavState(left = this.scroller.scrollLeft) {
      if (!this.prevBtn || !this.nextBtn) return;
      const maxScroll = Math.max(0, this.scroller.scrollWidth - this.scroller.clientWidth);
      this.prevBtn.disabled = left <= 1;
      this.nextBtn.disabled = left >= maxScroll - 1;
    }

    scrollToSlide(index) {
      const max = this.slideElements.length - 1;
      index = Math.max(0, Math.min(max, index));
      const slide = this.slideElements[index];
      if (!slide) return;
      const target = slide.offsetLeft - (this.scroller.clientWidth - slide.offsetWidth) / 2;
      const maxScroll = Math.max(0, this.scroller.scrollWidth - this.scroller.clientWidth);
      this.scrollTo(Math.max(0, Math.min(maxScroll, target)));
      this.setActiveIndex(index);
    }

    // IntersectionObserver active-slide tracking (feature-detected).
    setupObserver() {
      if (typeof IntersectionObserver !== 'function') return;
      this.ratios = new Array(this.slideElements.length).fill(0);
      this.io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const idx = this.slideElements.indexOf(entry.target);
          if (idx !== -1) this.ratios[idx] = entry.intersectionRatio;
        });
        this.setActiveIndex(pickActiveIndex(this.ratios));
      }, { root: this.scroller, threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] });
      this.slideElements.forEach((el) => this.io.observe(el));
    }

    // scrollend (or debounced scroll fallback for Safari) — final sync only.
    bindScrollEndSync() {
      if ('onscrollend' in window) {
        this.addListener(this.scroller, 'scrollend', () => this.syncFromScroll());
      } else {
        this.addListener(this.scroller, 'scroll', () => {
          clearTimeout(this.scrollSyncTimer);
          this.scrollSyncTimer = setTimeout(() => {
            this.scrollSyncTimer = null;
            this.syncFromScroll();
          }, 150);
        }, { passive: true });
      }
    }

    syncFromScroll() {
      if (!this.slideElements.length) return;
      this.navTargetLeft = null;
      this.setActiveIndex(this.nearestIndexToCenter());
    }

    // One-shot: run callback once the current scroll settles (native
    // scrollend, or a fixed fallback delay on browsers without it).
    waitForScrollEnd(callback) {
      this.clearPendingScrollEnd();
      if ('onscrollend' in window) {
        this.scrollEndHandler = () => {
          this.scroller.removeEventListener('scrollend', this.scrollEndHandler);
          this.scrollEndHandler = null;
          callback();
        };
        this.scroller.addEventListener('scrollend', this.scrollEndHandler);
      } else {
        this.scrollEndTimer = setTimeout(() => {
          this.scrollEndTimer = null;
          callback();
        }, 450);
      }
    }

    clearPendingScrollEnd() {
      clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = null;
      if (this.scrollEndHandler) this.scroller.removeEventListener('scrollend', this.scrollEndHandler);
      this.scrollEndHandler = null;
    }

    nearestIndexToCenter() {
      const center = this.scroller.scrollLeft + this.scroller.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      this.slideElements.forEach((el, i) => {
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    // Mouse drag (Pointer Events) — the only manual input path; touch is native.
    bindPointerDrag() {
      const scroller = this.scroller;
      let dragging = false, startX = 0, startScrollLeft = 0, history = [];
      const onDown = (e) => {
        if (e.pointerType !== 'mouse') return;
        if (e.target && e.target.closest && e.target.closest(INTERACTIVE_SELECTOR)) return;
        dragging = true;
        startX = e.clientX;
        startScrollLeft = scroller.scrollLeft;
        history = [{ t: performance.now(), x: e.clientX }];
        scroller.classList.add(S.grabbing);
        if (scroller.setPointerCapture) scroller.setPointerCapture(e.pointerId);
        this.stopAutoplay();
      };
      const onMove = (e) => {
        if (!dragging) return;
        scroller.scrollLeft = startScrollLeft - (e.clientX - startX);
        const now = performance.now();
        history.push({ t: now, x: e.clientX });
        while (history.length > 2 && now - history[0].t > 100) history.shift();
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        let velocity = 0;
        if (history.length >= 2) {
          const first = history[0], last = history[history.length - 1];
          const dt = last.t - first.t;
          if (dt > 0) velocity = (last.x - first.x) / dt;
        }
        if (Math.abs(scroller.scrollLeft - startScrollLeft) > 6) this.suppressNextClick();
        if (this.config.mode === 'center') {
          let target = this.currentIndex;
          if (Math.abs(velocity) > 0.3) target += velocity < 0 ? 1 : -1;
          else target = this.nearestIndexToCenter();
          this.scrollToSlide(target);
          // Keep snap disabled until the smooth scroll actually lands —
          // removing it mid-flight lets mandatory snap fight the animation.
          this.waitForScrollEnd(() => scroller.classList.remove(S.grabbing));
        } else {
          this.runFreeInertia(velocity, () => scroller.classList.remove(S.grabbing));
        }
        if (this.config.autoplay) this.startAutoplay();
      };
      this.addListener(scroller, 'pointerdown', onDown);
      this.addListener(scroller, 'pointermove', onMove);
      this.addListener(scroller, 'pointerup', onUp);
      this.addListener(scroller, 'pointercancel', onUp);
      this.addListener(scroller, 'dragstart', (e) => e.preventDefault());
      this.addListener(scroller, 'click', (e) => {
        if (!this.suppressClick) return;
        this.suppressClick = false;
        clearTimeout(this.suppressClickTimer);
        this.suppressClickTimer = null;
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }, true);
    }

    suppressNextClick() {
      this.suppressClick = true;
      clearTimeout(this.suppressClickTimer);
      this.suppressClickTimer = setTimeout(() => { this.suppressClick = false; this.suppressClickTimer = null; }, 500);
    }

    runFreeInertia(v0, onDone) {
      if (Math.abs(v0) <= 0.02) { onDone(); return; }
      const k = 0.004;
      let v = v0, last = performance.now();
      const step = (now) => {
        const dt = now - last;
        last = now;
        v *= Math.exp(-k * dt);
        this.scroller.scrollLeft -= v * dt;
        if (Math.abs(v) > 0.02) { this.inertiaId = requestAnimationFrame(step); }
        else { this.inertiaId = null; onDone(); this.syncFromScroll(); }
      };
      this.inertiaId = requestAnimationFrame(step);
    }

    // Autoplay.
    startAutoplay() {
      this.stopAutoplay();
      if (!this.config.autoplay || prefersReducedMotion()) return;
      this.autoplayTimer = setInterval(() => {
        const next = this.currentIndex >= this.slideElements.length - 1 ? 0 : this.currentIndex + 1;
        this.scrollToSlide(next);
      }, this.config.autoplay);
    }

    stopAutoplay() {
      if (this.autoplayTimer) { clearInterval(this.autoplayTimer); this.autoplayTimer = null; }
    }

    // Pause while hovered/focused; any direct interaction restarts the
    // countdown so a tick never fights the user's finger/pointer mid-gesture.
    bindAutoplayGuards() {
      if (!this.config.autoplay) return;
      const pause = () => this.stopAutoplay();
      const restart = () => this.startAutoplay();
      this.addListener(this.scroller, 'pointerenter', pause);
      this.addListener(this.scroller, 'pointerleave', restart);
      this.addListener(this.wrapper, 'focusin', pause);
      this.addListener(this.wrapper, 'focusout', restart);
      this.addListener(this.scroller, 'pointerdown', pause);
      this.addListener(this.scroller, 'pointerup', restart);
      this.addListener(this.scroller, 'pointercancel', restart);
      this.addListener(this.scroller, 'wheel', restart, { passive: true });
    }

    destroy() {
      this.stopAutoplay();
      if (this.inertiaId) { cancelAnimationFrame(this.inertiaId); this.inertiaId = null; }
      if (this.io) this.io.disconnect();
      this.mqlHandlers.forEach(({ mql, handler }) => {
        if (mql.removeEventListener) mql.removeEventListener('change', handler);
        else if (mql.removeListener) mql.removeListener(handler);
      });
      this.mqlHandlers = [];
      this.dotHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      this.dotHandlers = [];
      this.eventHandlers.forEach(({ target, event, handler, options }) => target.removeEventListener(event, handler, options));
      this.eventHandlers = [];
      clearTimeout(this.scrollSyncTimer);
      this.scrollSyncTimer = null;
      this.clearPendingScrollEnd();
      clearTimeout(this.suppressClickTimer);
      this.suppressClickTimer = null;
      this.slides.forEach((slide) => {
        slide.removeAttribute('data-slider-initialized');
        this.wrapper.parentNode.insertBefore(slide, this.wrapper);
      });
      this.wrapper.remove();
    }
  }

  // --- Discovery & public API ---
  function init() {
    findSliderClusters().forEach((cluster) => {
      const id = getSliderName(cluster[0]) || '';
      const config = parseConfig(cluster[0], (msg) => warn(id, msg));
      SLIDER_INSTANCES.push({ instance: new Slider(cluster, config), instanceId: id });
    });
  }
  function destroyById(id) {
    const i = SLIDER_INSTANCES.findIndex((e) => e.instanceId === id);
    if (i === -1) return false;
    SLIDER_INSTANCES[i].instance.destroy();
    SLIDER_INSTANCES.splice(i, 1);
    return true;
  }
  function destroyAll() {
    SLIDER_INSTANCES.forEach((e) => e.instance.destroy());
    SLIDER_INSTANCES.length = 0;
  }
  function refresh() { SLIDER_INSTANCES.forEach((e) => e.instance.refreshLayout()); }

  // Public API. `pickActiveIndex`/`resolveBreakpointIndex` are exposed purely so
  // tests-js/slider.test.js can unit-test pure selection logic without
  // emulating IntersectionObserver/scroll in jsdom.
  window.CarrdSlider = {
    init, destroyAll, destroyById, refresh,
    getInstances: () => SLIDER_INSTANCES.map((e) => e.instance),
    pickActiveIndex, resolveBreakpointIndex
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
