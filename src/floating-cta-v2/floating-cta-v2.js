(function() {
  'use strict';

  if (window.__themeFloatingCtaInitialized === true) {
    return;
  }
  window.__themeFloatingCtaInitialized = true;

  const CONFIG = {
    selector: '[data-floating-v2]',
    defaultPosition: 'bottom-right',
    scrollY: 800,
    breakpoint: 736,
    ...((window.CarrdPluginOptionsV2 && window.CarrdPluginOptionsV2.floatingCta) || {})
  };

  const hasFixedHeader = () => !!document.querySelector('.site-header.header-fixed');
  const isMobile = () => window.innerWidth <= CONFIG.breakpoint;
  const isGloballyEnabledForViewport = () => (
    isMobile() ? CONFIG.showOnMobile !== false : CONFIG.showOnDesktop !== false
  );

  const CLASSNAMES = {
    root: 'theme-floating-cta',
    clone: 'theme-floating-cta-clone',
    visible: 'is-visible'
  };

  let trackedElements = [];
  let listenersBound = false;
  const safeNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

  const POSITIONS = new Set([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
  ]);

  function normalizePosition(value) {
    const position = typeof value === 'string' ? value.trim() : '';
    const fallback = POSITIONS.has(CONFIG.defaultPosition) ? CONFIG.defaultPosition : 'bottom-right';
    return POSITIONS.has(position) ? position : fallback;
  }

  function normalizePositionOverride(value) {
    const position = typeof value === 'string' ? value.trim() : '';
    return POSITIONS.has(position) ? position : '';
  }

  function normalizeHide(value) {
    const hide = typeof value === 'string' ? value.trim() : '';
    return hide === 'mobile' || hide === 'desktop' ? hide : '';
  }

  function normalizeName(value) {
    return (value || '')
      .trim()
      .replace(/&quot;/g, '"')
      .replace(/^["']+|["']+$/g, '');
  }

  function isNamedSource(source) {
    return safeNamePattern.test(normalizeName(source.getAttribute('data-floating-v2')));
  }

  function isElementEnabledForViewport(element) {
    const hide = normalizeHide(element.getAttribute('data-floating-v2-hide'));
    if (isMobile()) return hide !== 'mobile';
    return hide !== 'desktop';
  }

  function resolvePositionForViewport(element) {
    const mobilePosition = normalizePositionOverride(element.getAttribute('data-floating-v2-position-mobile'));
    const basePosition = normalizePositionOverride(element.getAttribute('data-floating-v2-position-base'));

    if (isMobile()) {
      return mobilePosition || basePosition || normalizePosition('');
    }

    return basePosition || normalizePosition('');
  }

  function syncPositions() {
    trackedElements.forEach(element => {
      element.setAttribute('data-floating-v2-position', resolvePositionForViewport(element));
    });
  }

  function applyVisibility(isVisible) {
    trackedElements.forEach(element => {
      const shouldShow = isVisible && isElementEnabledForViewport(element);
      element.classList.toggle(CLASSNAMES.visible, shouldShow);
      element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    });
  }

  function updateSticky() {
    syncPositions();
    if (!isGloballyEnabledForViewport()) {
      applyVisibility(false);
      return;
    }
    if (hasFixedHeader() && !isMobile()) {
      applyVisibility(false);
      return;
    }
    const y = window.scrollY || window.pageYOffset || 0;
    applyVisibility(y >= CONFIG.scrollY);
  }

  function discoverElements() {
    const sources = Array.from(document.querySelectorAll(CONFIG.selector)).filter(isNamedSource);

    sources.forEach(source => {
      if (source.getAttribute('data-floating-v2-initialized') === 'true') return;

      const clone = source.cloneNode(true);
      clone.removeAttribute('id');
      clone.removeAttribute('data-floating-v2');
      clone.classList.add(CLASSNAMES.root, CLASSNAMES.clone);
      clone.setAttribute('data-floating-v2-clone', 'true');
      clone.setAttribute('data-floating-v2-position-base', normalizePosition(source.getAttribute('data-floating-v2-position')));
      clone.setAttribute('data-floating-v2-position-mobile', normalizePositionOverride(source.getAttribute('data-floating-v2-position-mobile')));
      clone.setAttribute('data-floating-v2-position', normalizePosition(source.getAttribute('data-floating-v2-position')));
      clone.setAttribute('data-floating-v2-hide', normalizeHide(source.getAttribute('data-floating-v2-hide')));
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));

      source.setAttribute('data-floating-v2-initialized', 'true');
      document.body.appendChild(clone);
    });

    trackedElements = Array.from(document.querySelectorAll('[data-floating-v2-clone="true"]'));
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;

    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky);
  }

  function init() {
    discoverElements();
    if (!trackedElements.length) return;
    bindListeners();
    updateSticky();
  }

  window.CarrdFloatingCtaV2 = {
    refresh: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
