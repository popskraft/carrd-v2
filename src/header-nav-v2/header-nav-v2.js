(function () {
  'use strict';

  /*
   * Header Nav - anti-jump mobile collapse.
   *
   * Activation: any #header that contains at least one
   * `.header-mobile-el-collapsing` element. No `site-header` /
   * `header-collapsing` classes required. No sticky.
   *
   * On mobile (<= breakpoint) flagged elements collapse behind a
   * hamburger and expand inline (they push the header down, not a dropdown
   * panel). The collapsed layout is produced by CSS on first paint (see
   * header-nav.css + the Head guard), so there is no load jump. JS only
   * injects the hamburger and toggles open/close. No dimming overlay; the
   * menu is in flow, so an overlay would only cover surrounding content.
   */

  const CONFIG = {
    breakpoint: 736,
    closeOnLinkClick: true,
    ...((window.CarrdPluginOptionsV2 && window.CarrdPluginOptionsV2.headerNav) || {})
  };

  const HEADER_SELECTOR = '#header';
  const COLLAPSING_SELECTOR = '.header-mobile-el-collapsing';
  const CLASSNAMES = {
    open: 'is-nav-open',
    primarySection: 'theme-header-nav-primary-section',
    toggle: 'theme-header-nav-toggle',
    toggleBar: 'theme-header-nav-toggle-bar'
  };

  const INSTANCES = [];
  let globalsBound = false;

  function createToggle() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = CLASSNAMES.toggle;
    button.setAttribute('aria-label', 'Toggle navigation');
    button.setAttribute('aria-expanded', 'false');
    for (let i = 0; i < 3; i += 1) {
      const bar = document.createElement('span');
      bar.className = CLASSNAMES.toggleBar;
      button.appendChild(bar);
    }
    return button;
  }

  /* The logo row: first child row inside .inner, falling back gracefully. */
  function resolvePrimarySection(header) {
    const inner =
      header.querySelector('.wrapper > .inner') ||
      header.querySelector('.inner') ||
      header.querySelector('.wrapper') ||
      header;
    return inner.firstElementChild || inner;
  }

  function bindGlobals() {
    if (globalsBound || !INSTANCES.length) return;
    globalsBound = true;

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        INSTANCES.forEach(i => i.onResize());
      }, 60);
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      INSTANCES.forEach(i => { if (i.isOpen()) i.close(true); });
    });
  }

  function initializeHeader(header) {
    if (header.getAttribute('data-header-nav-v2-bound') === 'true') return;
    // Only activate if there is something to collapse.
    if (!header.querySelector(COLLAPSING_SELECTOR)) return;
    header.setAttribute('data-header-nav-v2-bound', 'true');

    const primarySection = resolvePrimarySection(header);
    primarySection.classList.add(CLASSNAMES.primarySection);

    const toggle = header.querySelector('.' + CLASSNAMES.toggle) || createToggle();
    if (toggle.parentNode !== primarySection) {
      primarySection.appendChild(toggle);
    }

    const isMobile = () => window.innerWidth <= CONFIG.breakpoint;

    /* The hamburger is position:fixed, but the menu expands in flow inside
     * #header. If the user opens the menu while scrolled away from the header,
     * the expanded menu would be off-screen. Scroll the header into view on
     * open so the menu is always visible. Honour reduced-motion. */
    const revealHeader = () => {
      const reduceMotion =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (header.getBoundingClientRect().top < 0) {
        header.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    };

    const setOpen = (open, options) => {
      options = options || {};
      header.classList.toggle(CLASSNAMES.open, open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && isMobile()) revealHeader();
      if (!open && options.restoreFocus) toggle.focus();
    };

    const onResize = () => {
      if (!isMobile()) setOpen(false);
    };

    toggle.addEventListener('click', () => {
      if (!isMobile()) return;
      setOpen(!header.classList.contains(CLASSNAMES.open));
    });

    if (CONFIG.closeOnLinkClick) {
      header.addEventListener('click', event => {
        if (!isMobile()) return;
        const link = event.target.closest('a');
        if (link && header.contains(link)) setOpen(false);
      });
    }

    INSTANCES.push({
      onResize: onResize,
      isOpen: () => header.classList.contains(CLASSNAMES.open),
      close: restoreFocus => setOpen(false, { restoreFocus: restoreFocus })
    });

    onResize();
  }

  function init() {
    document.querySelectorAll(HEADER_SELECTOR).forEach(initializeHeader);
    bindGlobals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
