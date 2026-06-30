(function() {
  'use strict';

  // Default configuration
  const DEFAULTS = {
    containerSelector: '.txt',
    paragraphSelector: 'span.p',
    headingClasses: {
      h1: 'theme-typography-h1',
      h2: 'theme-typography-h2',
      h3: 'theme-typography-h3',
      h4: 'theme-typography-h4'
    },
    listClasses: {
      ul: 'theme-typography-ul',
      ol: 'theme-typography-ol',
      li: 'theme-typography-li'
    },
    hrClass: 'theme-typography-hr'
  };

  // Merge with external options
  const externalOptions =
    (typeof window !== 'undefined' && (
      (window.CarrdPluginOptions && window.CarrdPluginOptions.typography)
    )) ||
    {};
  const CONFIG = {
    ...DEFAULTS,
    ...externalOptions,
    headingClasses: { ...DEFAULTS.headingClasses, ...(externalOptions.headingClasses || {}) },
    listClasses: { ...DEFAULTS.listClasses, ...(externalOptions.listClasses || {}) }
  };

  /**
   * Parse text content from a span.p element
   * @param {string} html - Raw innerHTML of span.p
   * @returns {string|null} Converted HTML or null if no conversion needed
   */
  function parseContent(html) {
    // Normalize line breaks: <br>, <br/>, <br /> → \n
    let text = html.replace(/<br\s*\/?>/gi, '\n').trim();

    // Check for horizontal rule
    if (/^-{3,}$/.test(text)) {
      return `<hr class="${CONFIG.hrClass}">`;
    }

    // Check for headings (# to ####)
    const headingMatch = text.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2].trim();
      const tag = `h${level}`;
      const className = CONFIG.headingClasses[tag] || '';
      return `<${tag} class="${className}">${content}</${tag}>`;
    }

    // Split by newlines for list detection
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Check for unordered list (all lines start with - )
    if (lines.length > 0 && lines.every(l => /^-\s+/.test(l))) {
      const items = lines.map(l => {
        const content = l.replace(/^-\s+/, '');
        return `<li class="${CONFIG.listClasses.li}">${content}</li>`;
      });
      return `<ul class="${CONFIG.listClasses.ul}">${items.join('')}</ul>`;
    }

    // Check for ordered list (all lines start with digits followed by . )
    if (lines.length > 0 && lines.every(l => /^\d+\.\s+/.test(l))) {
      const items = lines.map(l => {
        const content = l.replace(/^\d+\.\s+/, '');
        return `<li class="${CONFIG.listClasses.li}">${content}</li>`;
      });
      return `<ol class="${CONFIG.listClasses.ol}">${items.join('')}</ol>`;
    }

    // No conversion needed - return null to keep original span
    return null;
  }



  /**
   * Process a single .txt container
   * @param {HTMLElement} container - The .txt element
   */
  function processContainer(container) {
    if (container.dataset.typographyInitialized === 'true') return;

    // Find all span.p elements
    const spans = container.querySelectorAll(CONFIG.paragraphSelector);
    if (!spans.length) return;
    container.dataset.typographyInitialized = 'true';

    spans.forEach(span => {
      const html = span.innerHTML;
      const converted = parseContent(html);

      if (converted !== null) {
        // Replace span with converted content
        const temp = document.createElement('div');
        temp.innerHTML = converted;

        // Insert new elements before the span
        while (temp.firstChild) {
          span.parentNode.insertBefore(temp.firstChild, span);
        }
        // Remove the original span
        span.remove();
      }
      // If null, keep the original span.p unchanged
    });
  }

  /**
   * Initialize typography processing
   */
  function init() {
    const containers = document.querySelectorAll(CONFIG.containerSelector);
    containers.forEach(processContainer);
  }

  // Expose public API
  window.CarrdTypography = {
    init,
    process: processContainer,
    parseContent
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
