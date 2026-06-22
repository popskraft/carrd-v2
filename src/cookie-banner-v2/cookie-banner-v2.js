(function() {
  'use strict';

  const DATA_SELECTOR = '[data-cookie-v2]';
  const LEGACY_SELECTOR = '.theme-cookie-banner, .cookie-banner';
  const LEGACY_ID = 'cookie-baner';
  const POSITIONS = new Set([
    'bottom-left',
    'bottom-center',
    'bottom-right',
    'top-left',
    'top-center',
    'top-right'
  ]);

  const DEFAULTS = {
    cookieName: 'cookies_accepted',
    cookieDays: 7,
    fadeOutDuration: 300,
    fadeInDuration: 400,
    showDelay: 1000,
    position: 'bottom-left',
    breakpoint: 736,
    indent: '1',
    indentMobile: '1-0.5'
  };

  const externalOptions =
    (typeof window !== 'undefined' &&
      window.CarrdPluginOptionsV2 &&
      window.CarrdPluginOptionsV2.cookieBanner) ||
    {};

  const CONFIG = {
    ...DEFAULTS,
    ...externalOptions
  };

  let trackedBanners = [];
  let listenersBound = false;
  const safeNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

  function getCookie(name) {
    if (typeof name !== 'string' || name.length === 0) return null;

    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (const entry of cookies) {
      const trimmed = entry.trim();
      if (!trimmed) continue;

      const separatorIndex = trimmed.indexOf('=');
      const rawName = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
      if (rawName !== name) continue;

      const rawValue = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : '';
      try {
        return decodeURIComponent(rawValue);
      } catch (_error) {
        return rawValue;
      }
    }

    return null;
  }

  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }

    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
  }

  function isMobile() {
    return window.innerWidth <= CONFIG.breakpoint;
  }

  function parseInteger(value, { min = 0 } = {}) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= min) {
      return value;
    }

    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return null;

    const parsed = Number.parseInt(trimmed, 10);
    return parsed >= min ? parsed : null;
  }

  function normalizePosition(value) {
    const requested = typeof value === 'string' ? value.trim() : '';
    const fallback = POSITIONS.has(CONFIG.position) ? CONFIG.position : DEFAULTS.position;
    return POSITIONS.has(requested) ? requested : fallback;
  }

  function parseIndent(value) {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const parts = trimmed.split('-').map(part => part.trim());
    const validParts = parts.every(part => /^\d*\.?\d+$/.test(part));
    if (!validParts || parts.length < 1 || parts.length > 2) return null;

    if (parts.length === 1) {
      const rem = parts[0] + 'rem';
      return { block: rem, inline: rem };
    }

    return {
      block: parts[0] + 'rem',
      inline: parts[1] + 'rem'
    };
  }

  function normalizeName(value) {
    return (value || '')
      .trim()
      .replace(/&quot;/g, '"')
      .replace(/^["']+|["']+$/g, '');
  }

  function isNamedBanner(banner) {
    if (!banner || !banner.hasAttribute || !banner.hasAttribute('data-cookie-v2')) return false;
    return safeNamePattern.test(normalizeName(banner.getAttribute('data-cookie-v2')));
  }

  function resolveIndent(banner) {
    const desktopIndent =
      parseIndent(banner.getAttribute('data-cookie-v2-indent')) ||
      parseIndent(CONFIG.indent) ||
      parseIndent(DEFAULTS.indent);

    const mobileIndent =
      parseIndent(banner.getAttribute('data-cookie-v2-indent-mobile')) ||
      parseIndent(CONFIG.indentMobile) ||
      desktopIndent;

    return isMobile() ? mobileIndent : desktopIndent;
  }

  function getPositionStyles(position, indent) {
    const base = {
      position: 'fixed',
      zIndex: '9999',
      margin: '0',
      maxWidth: 'calc(100vw - ' + indent.inline + ' - ' + indent.inline + ')',
      left: 'auto',
      right: 'auto',
      top: 'auto',
      bottom: 'auto',
      transform: 'none'
    };

    switch (position) {
      case 'bottom-right':
        base.bottom = indent.block;
        base.right = indent.inline;
        break;
      case 'bottom-center':
        base.bottom = indent.block;
        base.left = '50%';
        base.transform = 'translateX(-50%)';
        break;
      case 'top-left':
        base.top = indent.block;
        base.left = indent.inline;
        break;
      case 'top-right':
        base.top = indent.block;
        base.right = indent.inline;
        break;
      case 'top-center':
        base.top = indent.block;
        base.left = '50%';
        base.transform = 'translateX(-50%)';
        break;
      case 'bottom-left':
      default:
        base.bottom = indent.block;
        base.left = indent.inline;
        break;
    }

    return base;
  }

  function applyStyles(element, styles) {
    for (const prop in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, prop)) {
        element.style[prop] = styles[prop];
      }
    }
  }

  function getDisplayMode(banner) {
    return banner.classList.contains('columns') ? 'flex' : 'block';
  }

  function findBanners() {
    const banners = [];
    const seen = new Set();

    const addBanner = (banner) => {
      if (!banner || seen.has(banner)) return;
      seen.add(banner);
      banners.push(banner);
    };

    document.querySelectorAll(DATA_SELECTOR).forEach(banner => {
      if (isNamedBanner(banner)) {
        addBanner(banner);
      }
    });
    document.querySelectorAll(LEGACY_SELECTOR).forEach(addBanner);
    addBanner(document.getElementById(LEGACY_ID));

    return banners;
  }

  function resolvePosition(banner) {
    return normalizePosition(banner.getAttribute('data-cookie-v2-position') || CONFIG.position);
  }

  function resolveShowDelay(banner) {
    return (
      parseInteger(banner.getAttribute('data-cookie-v2-delay'), { min: 0 }) ??
      parseInteger(CONFIG.showDelay, { min: 0 }) ??
      DEFAULTS.showDelay
    );
  }

  function resolveCookieDays(banner) {
    return (
      parseInteger(banner.getAttribute('data-cookie-v2-days'), { min: 1 }) ??
      parseInteger(CONFIG.cookieDays, { min: 1 }) ??
      DEFAULTS.cookieDays
    );
  }

  function updateBannerLayout(banner) {
    const position = resolvePosition(banner);
    const indent = resolveIndent(banner);
    applyStyles(banner, getPositionStyles(position, indent));
  }

  function hideBanner(banner, instant) {
    if (!banner) return;

    if (instant || CONFIG.fadeOutDuration <= 0) {
      banner.style.opacity = '0';
      banner.style.visibility = 'hidden';
      banner.style.display = 'none';
      return;
    }

    banner.style.transition = 'opacity ' + CONFIG.fadeOutDuration + 'ms ease';
    banner.style.opacity = '0';

    setTimeout(function() {
      banner.style.visibility = 'hidden';
      banner.style.display = 'none';
    }, CONFIG.fadeOutDuration);
  }

  function acceptCookies(sourceBanner) {
    setCookie(CONFIG.cookieName, '1', resolveCookieDays(sourceBanner));
    trackedBanners.forEach(banner => hideBanner(banner, false));
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;

    window.addEventListener('resize', function() {
      trackedBanners.forEach(updateBannerLayout);
    });
  }

  function initBanner(banner) {
    if (banner.dataset.cookieBannerInitialized === 'true') {
      updateBannerLayout(banner);
      return;
    }

    banner.dataset.cookieBannerInitialized = 'true';
    banner.classList.add('theme-cookie-banner');
    updateBannerLayout(banner);

    const acceptBtn =
      banner.querySelector('a[role="button"]') ||
      banner.querySelector('[data-cookie-v2-accept]') ||
      banner.querySelector('.icons-component a');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function(event) {
        event.preventDefault();
        acceptCookies(banner);
      });
    }

    banner.style.display = getDisplayMode(banner);
    banner.style.visibility = 'visible';
    banner.style.opacity = '0';
    banner.style.transition = 'opacity ' + CONFIG.fadeInDuration + 'ms ease';

    setTimeout(function() {
      if (getCookie(CONFIG.cookieName) === '1') return;
      banner.style.opacity = '1';
    }, resolveShowDelay(banner));
  }

  function init() {
    trackedBanners = findBanners();
    if (!trackedBanners.length) return;

    bindListeners();

    if (getCookie(CONFIG.cookieName) === '1') {
      trackedBanners.forEach(banner => hideBanner(banner, true));
      return;
    }

    trackedBanners.forEach(initBanner);
  }

  window.CarrdCookieBannerV2 = {
    refresh: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
