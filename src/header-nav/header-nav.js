(function () {
  'use strict';

  /*
   * Header Nav - anti-jump mobile collapse.
   *
   * Activation: any #header that contains at least one
   * `.header-mobile-hide` element. Legacy
   * `.header-mobile-el-collapsing` still works as an alias. No `site-header` /
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
    ...((window.CarrdPluginOptions && window.CarrdPluginOptions.headerNav) || {})
  };

  const HEADER_SELECTOR = '#header';
  const COLLAPSING_SELECTOR = '.header-mobile-hide, .header-mobile-el-collapsing';
  const CLASSNAMES = {
    open: 'is-nav-open',
    primarySection: 'theme-header-nav-primary-section',
    toggle: 'theme-header-nav-toggle',
    toggleBar: 'theme-header-nav-toggle-bar'
  };

  const INSTANCES = [];
  const POSITION_INSTANCES = [];
  let globalsBound = false;

  /**
   * Build the fixed-position hamburger button used on mobile breakpoints.
   */
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

  /* The column that hosts the hamburger (the "primary section").
   *
   * Default: the first child column inside .inner (Carrd's first cell).
   * Override: if an element with id="header-primary-section" exists, use the
   * column that contains it instead — typically the logo cell — so the
   * hamburger lands in the same cell as the always-visible logo rather than
   * in a cell full of collapsed items. (Carrd strips custom data-* attributes
   * from components but preserves the id set in the element's settings, so the
   * marker is an id, not a data attribute.) The marker may sit nested
   * (row > column > element), so we climb from it up to the direct child of
   * the flex row (.inner). If it cannot be resolved to a cell, we fall back to
   * the first cell. */
  /* Climb from a marked element to the column that is a direct child of the
   * flex row (inner). Returns the marked element itself if it already sits
   * directly under inner, or null if it cannot be resolved to a cell. */
  function climbToCell(marked, inner) {
    let cell = marked;
    while (cell && cell !== inner && cell.parentElement !== inner) {
      cell = cell.parentElement;
    }
    return cell && cell.parentElement === inner ? cell : null;
  }

  function resolvePrimarySection(header) {
    const inner =
      header.querySelector('.wrapper > .inner') ||
      header.querySelector('.inner') ||
      header.querySelector('.wrapper') ||
      header;
    const marked = header.querySelector('#header-primary-section');
    if (marked && inner.contains(marked)) {
      return climbToCell(marked, inner) || marked;
    }
    return inner.firstElementChild || inner;
  }

  function bindGlobals() {
    if (globalsBound || (!INSTANCES.length && !POSITION_INSTANCES.length)) return;
    globalsBound = true;

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        INSTANCES.forEach(i => i.onResize());
        POSITION_INSTANCES.forEach(i => i.sync());
      }, 60);
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      INSTANCES.forEach(i => { if (i.isOpen()) i.close(true); });
    });
  }

  /* Per-header override of the fixed hamburger's top offset. Mirrors
   * applyOffsetAttribute: bare number -> rem, value with a unit -> as-is,
   * anything else ignored (token default stays in effect). The custom property
   * is set on #header and inherits into the JS-injected toggle button. Read
   * from a direct child carrying the attribute (the authored header container)
   * or from #header itself. */
  function applyToggleTopAttribute(header) {
    const source =
      header.querySelector(':scope > [data-header-nav-toggle-top]') ||
      (header.hasAttribute('data-header-nav-toggle-top') ? header : null);
    if (!source) return;
    const raw = source.getAttribute('data-header-nav-toggle-top');
    if (raw === null || raw.trim() === '') return;
    const text = raw.trim();
    let value = null;
    if (/^-?\d*\.?\d+$/.test(text)) {
      value = text + 'rem';
    } else if (/^-?\d*\.?\d+(px|rem|em|vh|vw|%)$/.test(text)) {
      value = text;
    }
    if (value) header.style.setProperty('--theme-header-nav-toggle-top', value);
  }

  /**
   * Bind one Carrd header instance if it contains collapsible mobile rows.
   * The menu stays in normal document flow; JS only injects/toggles the button.
   */
  function initializeHeader(header) {
    if (header.getAttribute('data-header-nav-bound') === 'true') return;
    // Only activate if there is something to collapse.
    if (!header.querySelector(COLLAPSING_SELECTOR)) return;
    header.setAttribute('data-header-nav-bound', 'true');

    /* Optional per-header override of the fixed hamburger's top offset. */
    applyToggleTopAttribute(header);

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
      const open = header.classList.contains(CLASSNAMES.open);
      /* If the menu is open but the user has scrolled away from the header,
       * the expanded menu is off-screen. Closing it here would be invisible
       * and disorienting, so instead scroll back to the header where the
       * open menu lives. Closing only happens while the header is in view. */
      if (open && header.getBoundingClientRect().top < 0) {
        revealHeader();
        return;
      }
      setOpen(!open);
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

  /**
   * Fixed / sticky header positioning. Independent of the mobile-collapse
   * feature above: it activates purely on `data-header-position` and works even
   * when the header has no `.header-mobile-hide` elements.
   *
   * CSS pins the header (position:sticky). JS only keeps two things in sync:
   *   - `scroll-padding-top` on <html>, so in-page anchor links land below the
   *     pinned bar instead of behind it;
   *   - for `sticky` mode, `--theme-header-nav-sticky-top` = negative height of the
   *     rows above the flagged container, so that container lands flush at the
   *     top after the earlier rows scroll away.
   */
  /* Read data-header-nav-fixed-offset and, if valid, write the offset custom
   * property on the header. Bare number -> rem; a value with a unit is used
   * as-is; anything else is ignored (token/default stays in effect). */
  function applyOffsetAttribute(header, target) {
    const raw = target.getAttribute('data-header-nav-fixed-offset');
    if (raw === null || raw.trim() === '') return;
    const text = raw.trim();
    let value = null;
    if (/^-?\d*\.?\d+$/.test(text)) {
      value = text + 'rem';
    } else if (/^-?\d*\.?\d+(px|rem|em|vh|vw|%)$/.test(text)) {
      value = text;
    }
    if (value) header.style.setProperty('--theme-header-nav-fixed-offset', value);
  }

  function initializeHeaderPosition(header) {
    if (header.getAttribute('data-header-position-bound') === 'true') return;

    const target =
      header.querySelector(':scope > [data-header-position]') ||
      (header.hasAttribute('data-header-position') ? header : null);
    if (!target) return;

    const mode = (target.getAttribute('data-header-position') || '').trim();
    if (mode !== 'fixed' && mode !== 'sticky') return;
    header.setAttribute('data-header-position-bound', 'true');

    /* Per-header override of the top gap via attribute. Sets the same custom
     * property the token uses, so CSS (fixed top) and JS (sticky fold + scroll
     * offset) pick it up unchanged. */
    applyOffsetAttribute(header, target);

    /* Resolve --theme-header-nav-fixed-offset (any CSS length, default 0) to px
     * so it can be added to the anchor scroll offset. CSS owns the pin position
     * itself; JS only needs the number for scroll-padding. */
    const resolveOffsetPx = () => {
      let raw = '';
      try {
        raw = window.getComputedStyle(target)
          .getPropertyValue('--theme-header-nav-fixed-offset').trim();
      } catch (error) { raw = ''; }
      if (!raw || parseFloat(raw) === 0) return 0;
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:absolute;visibility:hidden;pointer-events:none;height:' + raw;
      header.appendChild(probe);
      const px = probe.offsetHeight;
      probe.remove();
      return px || 0;
    };

    const sync = () => {
      const offsetPx = resolveOffsetPx();
      let pinnedHeight;
      if (mode === 'sticky') {
        const above =
          target.getBoundingClientRect().top - header.getBoundingClientRect().top;
        const aboveOffset = Math.max(0, Math.round(above));
        /* Sticky point = fixed-offset below the top, minus the rows above the
         * flagged container. Folded here (not via CSS calc) on purpose. */
        header.style.setProperty(
          '--theme-header-nav-sticky-top',
          (offsetPx - aboveOffset) + 'px'
        );
        pinnedHeight = target.getBoundingClientRect().height;
      } else {
        pinnedHeight = header.getBoundingClientRect().height;
      }
      /* Measure only while the menu is collapsed: an open mobile menu inflates
       * the header height, which is not the height that stays pinned. */
      if (!header.classList.contains(CLASSNAMES.open)) {
        document.documentElement.style.scrollPaddingTop =
          Math.round(pinnedHeight + offsetPx) + 'px';
      }
    };

    sync();
    /* Fonts and images can change the header height after first paint. */
    window.addEventListener('load', sync, { once: true });
    POSITION_INSTANCES.push({ sync: sync });
  }

  /**
   * Initialize every matching Carrd header on the page.
   */
  function init() {
    document.querySelectorAll(HEADER_SELECTOR).forEach(header => {
      initializeHeader(header);
      initializeHeaderPosition(header);
    });
    bindGlobals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
