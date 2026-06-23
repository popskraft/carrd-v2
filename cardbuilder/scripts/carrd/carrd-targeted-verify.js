/*
Carrd Builder — Targeted Verify: Script A (Static State)
Usage:
  1) Open Carrd builder in Chrome.
  2) Do NOT click any element (no properties panel open).
  3) Open DevTools Console (F12 → Console).
  4) Paste this script and press Enter.
  5) Copy the console output and share it.
*/
(function scriptA_staticState() {
  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      el.offsetParent !== null ||
      el.getClientRects().length > 0 ||
      (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none')
    );
  }

  function nodeInfo(el, label) {
    if (!el) return { label, found: false };
    const style = window.getComputedStyle(el);
    return {
      label,
      found: true,
      visible: isVisible(el),
      offsetParent: el.offsetParent ? (el.offsetParent.id || el.offsetParent.className || el.offsetParent.tagName) : null,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      classList: Array.from(el.classList),
      parentTag: el.parentElement ? el.parentElement.tagName : null,
      parentClass: el.parentElement ? el.parentElement.className : null,
      parentId: el.parentElement ? el.parentElement.id : null,
    };
  }

  // ── Item 3: background-properties & main-properties ──────────────────────

  // Direct toolbar nodes (top-level in #menu)
  const bgDirect = document.querySelector('#menu > [data-action="background-properties"]');
  const mainDirect = document.querySelector('#menu > [data-action="main-properties"]');

  // Dropdown (nested inside .items)
  const bgDropdown = document.querySelector('#menu .items [data-action="background-properties"]');
  const mainDropdown = document.querySelector('#menu .items [data-action="main-properties"]');

  // Also try any occurrence to cover unexpected nesting
  const bgAny = document.querySelectorAll('[data-action="background-properties"]');
  const mainAny = document.querySelectorAll('[data-action="main-properties"]');

  // ── Item 4: do-ui-previous / do-ui-next (panel closed state) ─────────────

  const prevEl = document.querySelector('#properties-panel .do-ui-previous');
  const nextEl = document.querySelector('#properties-panel .do-ui-next');
  const panel = document.querySelector('#properties-panel');

  // ── All #menu [data-action] with visibility ───────────────────────────────
  const allMenuActions = Array.from(document.querySelectorAll('#menu [data-action]')).map(el => ({
    action: el.getAttribute('data-action'),
    visible: isVisible(el),
    depth: (function depth(node, root) {
      let d = 0; while (node && node !== root) { d++; node = node.parentElement; } return d;
    })(el, document.querySelector('#menu')),
    parentClass: el.parentElement ? el.parentElement.className : null,
  }));

  const report = {
    meta: {
      script: 'A — static state (no element selected)',
      generatedAt: new Date().toISOString(),
      url: location.href,
      panelOpen: panel ? panel.classList.contains('visible') : false,
    },

    item3_backgroundProperties: {
      direct: nodeInfo(bgDirect, 'direct toolbar (#menu > [data-action])'),
      dropdown: nodeInfo(bgDropdown, 'dropdown (.items [data-action])'),
      allOccurrences: Array.from(bgAny).map((el, i) => nodeInfo(el, 'occurrence_' + i)),
    },

    item3_mainProperties: {
      direct: nodeInfo(mainDirect, 'direct toolbar (#menu > [data-action])'),
      dropdown: nodeInfo(mainDropdown, 'dropdown (.items [data-action])'),
      allOccurrences: Array.from(mainAny).map((el, i) => nodeInfo(el, 'occurrence_' + i)),
    },

    item4_prevNext_panelClosed: {
      panelExists: !!panel,
      panelVisible: panel ? panel.classList.contains('visible') : false,
      prev: nodeInfo(prevEl, '.do-ui-previous'),
      next: nodeInfo(nextEl, '.do-ui-next'),
    },

    allMenuActions,
  };

  console.log('[Script A] — static state result:');
  console.log(JSON.stringify(report, null, 2));
  return report;
})();
