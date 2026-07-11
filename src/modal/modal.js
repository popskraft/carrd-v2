(function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  
  const DEFAULTS = {
    modalSelector: '.container-component[data-modal]',
    targetAttribute: 'data-modal',
    triggerAttribute: 'data-modal-open',
    legacyTriggerAttribute: 'data-modal-target',
    hashPrefix: '#data-modal-',
    legacyHashTargets: true,
    closeOnOverlay: true,
    closeOnEscape: true,
    showCloseButton: true,
    lockBodyScroll: true,
    preventWhenCartOpen: false
  };

  // Merge with external options
  const externalOptions = (typeof window !== 'undefined' && (
    (window.CarrdPluginOptions && window.CarrdPluginOptions.modal)
  )) || {};
  
  const CONFIG = { ...DEFAULTS, ...externalOptions };
  const SELECTORS = {
    overlay: 'theme-modal-overlay',
    close: 'theme-modal-close',
    modalClose: 'modal-close'
  };

  // ==========================================
  // ICONS
  // ==========================================
  
  const ICONS = {
    close: `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
  };

  // ==========================================
  // STATE
  // ==========================================
  
  let activeModal = null;
  let overlay = null;
  const modalWrappers = new Map();
  const modalConfigs = new Map();
  const cartOpenSelector = '.theme-shopcart-panel.open, .theme-shopcart-overlay.open';
  let triggersBound = false;
  let keyboardBound = false;
  let hashBound = false;
  const safeNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

  // --- Per-modal data-* overrides (data-* wins over window.CarrdPluginOptions) ---
  function parseOnOffAttr(raw, attrName) {
    if (raw == null) return null;
    const v = normalizeName(raw).toLowerCase();
    if (v === 'on') return true;
    if (v === 'off') return false;
    console.warn(`Modal: invalid ${attrName} "${raw}", using default`);
    return null;
  }

  function resolveModalConfig(modal) {
    const closeOnOverlay = parseOnOffAttr(modal.getAttribute('data-modal-close-on-overlay'), 'data-modal-close-on-overlay');
    const closeOnEscape = parseOnOffAttr(modal.getAttribute('data-modal-close-on-escape'), 'data-modal-close-on-escape');
    const showCloseButton = parseOnOffAttr(modal.getAttribute('data-modal-show-close'), 'data-modal-show-close');
    const lockBodyScroll = parseOnOffAttr(modal.getAttribute('data-modal-lock-scroll'), 'data-modal-lock-scroll');
    return {
      closeOnOverlay: closeOnOverlay !== null ? closeOnOverlay : CONFIG.closeOnOverlay,
      closeOnEscape: closeOnEscape !== null ? closeOnEscape : CONFIG.closeOnEscape,
      showCloseButton: showCloseButton !== null ? showCloseButton : CONFIG.showCloseButton,
      lockBodyScroll: lockBodyScroll !== null ? lockBodyScroll : CONFIG.lockBodyScroll
    };
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function normalizeName(value) {
    return (value || '')
      .trim()
      .replace(/&quot;/g, '"')
      .replace(/^["']+|["']+$/g, '');
  }

  function isSafeName(value) {
    return safeNamePattern.test(value);
  }

  function normalizeModalRef(value) {
    let name = normalizeName(value).replace(/^#/, '');
    const hashPrefix = CONFIG.hashPrefix.replace(/^#/, '');
    if (hashPrefix && name.startsWith(hashPrefix)) {
      name = name.slice(hashPrefix.length);
    }
    return normalizeName(name);
  }

  function getModalKey(modal) {
    const dataName = normalizeName(
      modal.getAttribute(CONFIG.targetAttribute) ||
      modal.getAttribute('data-modal')
    );
    if (dataName && isSafeName(dataName)) return dataName;
    return normalizeModalRef(modal.id);
  }

  function getTriggerAttributes() {
    return [
      CONFIG.triggerAttribute,
      CONFIG.legacyTriggerAttribute,
    ]
      .filter(Boolean)
      .filter((attribute, index, list) => list.indexOf(attribute) === index);
  }

  // ==========================================
  // MODAL API
  // ==========================================

  function showModalOverlay(modal) {
    if (!overlay) {
      createOverlay();
    }
    ensureOverlayPlacement(modal);
    if (overlay) {
      overlay.classList.add('is-open');
    }
  }

  function focusFirstElement(modal) {
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      // Wait slightly for transition
      setTimeout(() => firstFocusable.focus(), 50);
    } else {
      // Fallback to modal itself if no focusable content
      modal.setAttribute('tabindex', '-1');
      modal.focus();
    }
  }

  const ModalAPI = {
    /**
     * Open a modal by ID
     * @param {string} modalId - The ID of the modal to open (without #)
     */
    open: function(modalId) {
      if (CONFIG.preventWhenCartOpen && document.querySelector(cartOpenSelector)) {
        return;
      }
      const id = normalizeModalRef(modalId);
      if (!id) return;
      const modal = getOrInitModal(id);

      if (!modal) {
        console.warn(`Modal: No modal found with id "${id}"`);
        return;
      }

      // Already open — nothing to do
      if (activeModal === id) return;

      // Close any currently open modal
      if (activeModal) {
        this.close();
      }

      // Store previous focus to restore later
      this.lastFocus = document.activeElement;

      // Ensure overlay exists, is placed with the active modal, and is open
      showModalOverlay(modal);

      // Open modal
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modal.classList.add('is-visible');
        });
      });

      // Lock body scroll (per-modal override via data-modal-lock-scroll)
      const modalConfig = modalConfigs.get(id) || CONFIG;
      if (modalConfig.lockBodyScroll) {
        document.body.classList.add('modal-open');
      }

      activeModal = id;

      // Focus management
      focusFirstElement(modal);

      // Add Focus Trap listener
      document.addEventListener('keydown', this.handleTabKey);
    },

    /**
     * Connection for Tab Key trap (bound to 'this')
     */
    handleTabKey: function(e) {
      if (e.key !== 'Tab' || !activeModal) return;

      const modal = modalWrappers.get(activeModal);
      const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },

    /**
     * Close the currently open modal
     */
    close: function() {
      if (!activeModal) return;

      const modal = modalWrappers.get(activeModal);
      const modalConfig = modalConfigs.get(activeModal) || CONFIG;

      // Remove Trap
      document.removeEventListener('keydown', this.handleTabKey);

      // Close overlay
      if (overlay) {
        overlay.classList.remove('is-open');
      }

      // Close modal
      if (modal) {
        modal.classList.remove('is-visible');
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }

      // Unlock body scroll (per-modal override via data-modal-lock-scroll)
      if (modalConfig.lockBodyScroll) {
        document.body.classList.remove('modal-open');
      }

      activeModal = null;
      
      // Restore Focus
      if (this.lastFocus && typeof this.lastFocus.focus === 'function' && this.lastFocus.isConnected) {
        this.lastFocus.focus();
      }
      this.lastFocus = null;
    },

    /**
     * Toggle a modal
     * @param {string} modalId - The ID of the modal to toggle
     */
    toggle: function(modalId) {
      const id = normalizeModalRef(modalId);
      if (activeModal === id) {
        this.close();
      } else {
        this.open(id);
      }
    },

    /**
     * Check if a modal is open
     * @param {string} modalId - Optional modal ID to check
     * @returns {boolean}
     */
    isOpen: function(modalId) {
      if (modalId) {
        return activeModal === normalizeModalRef(modalId);
      }
      return activeModal !== null;
    },

    refresh: function() {
      init();
    }
  };

  // Expose public API
  window.CarrdModal = ModalAPI;

  // ==========================================
  // SETUP FUNCTIONS
  // ==========================================
  
  /**
   * Create the shared overlay element
   */
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = SELECTORS.overlay;
    overlay.setAttribute('aria-hidden', 'true');

    // Always bind — closeOnOverlay is resolved per active modal (data-modal-close-on-overlay),
    // not fixed at overlay-creation time, since the overlay is a shared singleton.
    overlay.addEventListener('click', () => {
      const modalConfig = modalConfigs.get(activeModal) || CONFIG;
      if (modalConfig.closeOnOverlay) ModalAPI.close();
    });

    document.body.appendChild(overlay);
  }

  /**
   * Ensure overlay shares the same stacking context as the active modal.
   * @param {HTMLElement} modal - The modal element
   */
  function ensureOverlayPlacement(modal) {
    if (!overlay || !modal || !modal.parentNode) return;

    const parent = modal.parentNode;
    if (overlay.parentNode !== parent || overlay.nextSibling !== modal) {
      parent.insertBefore(overlay, modal);
    }
  }

  /**
   * Setup a modal element
   * @param {HTMLElement} modal - The modal element
   */
  function setupModal(modal) {
    const modalId = getModalKey(modal);
    if (!modalId) {
      console.warn('Modal: Modal element must have an ID or data-modal name', modal);
      return null;
    }

    const modalConfig = resolveModalConfig(modal);
    modalConfigs.set(modalId, modalConfig);

    // Add close button if enabled
    if (modalConfig.showCloseButton) {
      // Check if button already exists (to avoid duplicates on re-init)
      if (!modal.querySelector(`.${SELECTORS.modalClose}`)) {
        const closeBtn = document.createElement('button');
        closeBtn.className = `${SELECTORS.close} ${SELECTORS.modalClose}`;
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.innerHTML = ICONS.close;
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent bubbling
          ModalAPI.close();
        });
        
        // Insert close button at the beginning of the inner content
        const inner = modal.querySelector('.inner');
        if (inner) {
          inner.insertBefore(closeBtn, inner.firstChild);
        } else {
          modal.insertBefore(closeBtn, modal.firstChild);
        }
      }
    }
    
    // Initial ARIA setup
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    applyModalLabel(modal, modalId);
    
    // Store reference
    modalWrappers.set(modalId, modal);
    modal.dataset.modalInitialized = 'true';
    
    return modal;
  }

  function applyModalLabel(modal, modalId) {
    const labelSource =
      modal.querySelector('h1, h2, h3, h4, h5, h6, [data-modal-title], .modal-title');

    if (labelSource) {
      if (!labelSource.id) {
        labelSource.id = `${modalId}-title`;
      }
      modal.setAttribute('aria-labelledby', labelSource.id);
      modal.removeAttribute('aria-label');
      return;
    }

    const fallbackLabel =
      modal.getAttribute('data-modal-label') ||
      modal.getAttribute('aria-label') ||
      modalId.replace(/[-_]+/g, ' ').trim();

    if (fallbackLabel) {
      modal.setAttribute('aria-label', fallbackLabel);
    }
    modal.removeAttribute('aria-labelledby');
  }

  // Resolve modalId from a trigger's href="#..." (canonical hashPrefix, then legacy).
  function resolveHrefModalId(trigger, modalId) {
    if (!trigger.hasAttribute('href')) return modalId;
    const href = trigger.getAttribute('href') || '';
    if (!href.startsWith('#') || href.length <= 1) return modalId;
    if (CONFIG.hashPrefix && href.startsWith(CONFIG.hashPrefix)) {
      return normalizeModalRef(href);
    }
    if (modalId || CONFIG.legacyHashTargets !== true) return modalId;
    const targetId = href.substring(1);
    return getOrInitModal(targetId) ? targetId : modalId;
  }

  // Resolve which modal a trigger points to, across data-attributes and href.
  function resolveTriggerModalId(trigger) {
    let modalId = null;

    getTriggerAttributes().some(attribute => {
      if (!trigger.hasAttribute(attribute)) return false;
      modalId = normalizeModalRef(trigger.getAttribute(attribute));
      return !!modalId;
    });

    if (!modalId && (
      trigger.matches(`button[${CONFIG.targetAttribute}]`) ||
      trigger.matches(`a[${CONFIG.targetAttribute}]`)
    )) {
      modalId = normalizeModalRef(trigger.getAttribute(CONFIG.targetAttribute));
    }

    return resolveHrefModalId(trigger, modalId);
  }

  /**
   * Bind click handlers for modal triggers
   */
  function bindTriggers() {
    if (triggersBound) return;
    triggersBound = true;
    // Use event delegation for better performance (capture to beat Carrd's handlers)
    const handler = (e) => {
      const triggerSelectors = getTriggerAttributes()
        .flatMap(attribute => [`[${attribute}]`, `button[${attribute}]`, `a[${attribute}]`])
        .join(', ');
      const trigger = e.target.closest(
        `a[href^="#"]${triggerSelectors ? `, ${triggerSelectors}` : ''}, button[${CONFIG.targetAttribute}], a[${CONFIG.targetAttribute}]`
      );
      if (!trigger) return;

      const modalId = resolveTriggerModalId(trigger);
      if (modalId && getOrInitModal(modalId)) {
        e.preventDefault();
        ModalAPI.open(modalId);
      }
    };
    document.addEventListener('click', handler, true);
  }

  /**
   * Open modal from hash (supports Carrd hash-based navigation)
   */
  function bindHashChange() {
    if (hashBound) return;
    hashBound = true;
    const openFromHash = () => {
      const hash = window.location.hash || '';
      if (hash.length <= 1) return;
      const id = normalizeModalRef(hash);
      if (getOrInitModal(id)) {
        ModalAPI.open(id);
      }
    };

    window.addEventListener('hashchange', openFromHash);
    openFromHash();
  }

  /**
   * Bind keyboard handlers
   */
  function bindKeyboard() {
    if (keyboardBound) return;
    keyboardBound = true;
    // Always bind — closeOnEscape is resolved per active modal (data-modal-close-on-escape)
    // on every keypress, not gated once at bind time.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !activeModal) return;
      const modalConfig = modalConfigs.get(activeModal) || CONFIG;
      if (modalConfig.closeOnEscape) ModalAPI.close();
    });
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  function init() {
    // Find all modal containers
    const modals = document.querySelectorAll(CONFIG.modalSelector);

    // Setup each modal
    modals.forEach(modal => {
      if (modal.dataset.modalInitialized === 'true') return;
      setupModal(modal);
    });

    if (modals.length && !overlay) {
      createOverlay();
    }
    
    // Bind event handlers
    bindTriggers();
    bindKeyboard();
    bindHashChange();
  }

  /**
   * Fetch or initialize a modal by ID.
   * @param {string} modalId - The modal ID without hash.
   * @returns {HTMLElement|null}
   */
  function findModalByDataAttribute(id) {
    if (!isSafeName(id)) return null;
    const dataModal = document.querySelector(
      `[${CONFIG.targetAttribute}="${cssEscape(id)}"], [data-modal="${cssEscape(id)}"]`
    );
    if (dataModal && dataModal.matches && dataModal.matches(CONFIG.modalSelector)) {
      return dataModal;
    }
    return null;
  }

  function findModalByLegacyId(id) {
    const modal = CONFIG.legacyHashTargets === true ? document.getElementById(id) : null;
    if (modal && modal.matches && modal.matches(CONFIG.modalSelector)) {
      return modal;
    }
    return null;
  }

  function getOrInitModal(modalId) {
    const id = normalizeModalRef(modalId);
    if (!id) return null;

    if (modalWrappers.has(id)) {
      return modalWrappers.get(id);
    }

    const found = findModalByDataAttribute(id) || findModalByLegacyId(id);
    return found ? setupModal(found) : null;
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
