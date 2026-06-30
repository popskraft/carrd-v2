(function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  
  const DEFAULTS = {
    animationDuration: 750,      // Duration for is-playing class (ms)
    observerTimeout: 5000,       // Auto-disconnect observers after this time (ms)
    scrollPulseInterval: 120,    // Interval between follow-up resize pulses (ms)
    scrollPulseCount: 2,         // Number of delayed resize pulses
    rafPulseCount: 2             // Number of requestAnimationFrame resize pulses
  };

  // Merge with external options
  const externalOptions = (typeof window !== 'undefined' && (
    (window.CarrdPluginOptions && window.CarrdPluginOptions.noLoadwaiting)
  )) || {};
    
  const CONFIG = {};
  for (const key in DEFAULTS) {
    CONFIG[key] = Object.prototype.hasOwnProperty.call(externalOptions, key)
      ? externalOptions[key]
      : DEFAULTS[key];
  }

  // ==========================================
  // PLUGIN LOGIC
  // ==========================================

  let initialized = false;
  let cachedBody = null;
  let classObserver = null;
  let childObserver = null;
  let observerTimeoutId = null;
  let pulseTimer = null;
  let rafId = null;

  function getBody() {
    if (cachedBody && cachedBody.isConnected) return cachedBody;
    cachedBody = document.body;
    return cachedBody;
  }

  // FIX for Lighthouse NO_FCP error:
  // Carrd's default CSS hides the body with `opacity: 0` until `is-ready` class is present.
  // Previously, `is-ready` was added after a 750ms delay, causing Lighthouse to see
  // an invisible page during its First Contentful Paint measurement window.
  // Now we add `is-ready` immediately to ensure content is visible from the start.
  // The `is-playing` class is kept for visual animation purposes but no longer
  // blocks the initial paint.
  function markReadyNow() {
    const body = getBody();
    if (!body) return;

    body.classList.remove('is-loading', 'with-loader');

    if (!body.classList.contains('is-ready')) {
      // Add is-ready immediately so Lighthouse sees visible content (fixes NO_FCP)
      body.classList.add('is-ready');

      // Trigger Carrd's entry animations via is-playing class
      body.classList.add('is-playing');
      setTimeout(function() {
        body.classList.remove('is-playing');
      }, CONFIG.animationDuration);
    }
  }

  function hideLoaderIfPresent() {
    const loader = document.getElementById('loader');
    if (!loader) return false;

    loader.style.setProperty('display', 'none', 'important');
    loader.style.setProperty('visibility', 'hidden', 'important');
    loader.style.setProperty('opacity', '0', 'important');
    loader.style.setProperty('pointer-events', 'none', 'important');
    loader.setAttribute('aria-hidden', 'true');
    return true;
  }

  function kickScrollHandlers() {
    if (pulseTimer !== null) {
      clearInterval(pulseTimer);
      pulseTimer = null;
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    dispatchLayoutEvents();

    let pulses = 0;

    pulseTimer = setInterval(function() {
      if (++pulses > CONFIG.scrollPulseCount) {
        clearInterval(pulseTimer);
        pulseTimer = null;
        return;
      }
      dispatchLayoutEvents();
    }, CONFIG.scrollPulseInterval);

    let rafPulses = 0;
    (function rafTick() {
      if (++rafPulses > CONFIG.rafPulseCount) {
        rafId = null;
        return;
      }
      dispatchLayoutEvents();
      rafId = requestAnimationFrame(rafTick);
    })();
  }

  function dispatchLayoutEvents() {
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (e) {
      /* ignore */
    }
  }

  function setupObservers() {
    const body = getBody();
    if (!body) return;

    if (classObserver) classObserver.disconnect();
    if (childObserver) childObserver.disconnect();
    if (observerTimeoutId !== null) {
      clearTimeout(observerTimeoutId);
      observerTimeoutId = null;
    }

    classObserver = new MutationObserver(function() {
      if (body.classList.contains('with-loader')) {
        body.classList.remove('with-loader');
      }
    });

    childObserver = new MutationObserver(function() {
      if (hideLoaderIfPresent()) {
        childObserver.disconnect();
        childObserver = null;
      }
    });

    classObserver.observe(body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    childObserver.observe(body, { childList: true });

    observerTimeoutId = setTimeout(function() {
      if (classObserver) {
        classObserver.disconnect();
        classObserver = null;
      }
      if (childObserver) {
        childObserver.disconnect();
        childObserver = null;
      }
      observerTimeoutId = null;
    }, CONFIG.observerTimeout);
  }

  function init() {
    if (initialized) return;

    try {
      markReadyNow();
      hideLoaderIfPresent();
      setupObservers();
      kickScrollHandlers();
      initialized = true;
    } catch (e) {
      console.warn('early-animate-override failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
