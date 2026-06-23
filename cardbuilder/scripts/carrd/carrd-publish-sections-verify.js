/*
Carrd Builder — Targeted Verify: Script C (Panel Open States)
Usage:

  === Sub-script C1: #publish-panel ===
  1) Click the Publish button in the Carrd builder toolbar.
  2) Wait for the publish panel to open.
  3) Open DevTools Console (F12 → Console).
  4) Paste the C1 section below and press Enter.
  5) Copy the console output.

  === Sub-script C2: #sections-panel ===
  1) Close the publish panel (click × or press Escape).
  2) Click the # (Show Sections) button in the toolbar.
  3) Wait for the sections panel to open.
  4) Paste the C2 section below and press Enter.
  5) Copy the console output.
*/

// ════════════════════════════════════════════════════════════
// C1 — #publish-panel structure (paste AFTER opening publish)
// ════════════════════════════════════════════════════════════
(function scriptC1_publishPanel() {
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      el.offsetParent !== null ||
      el.getClientRects().length > 0 ||
      (style.display !== 'none' && style.visibility !== 'hidden')
    );
  }

  function skeletonOf(el, maxDepth, currentDepth) {
    if (!el || currentDepth > maxDepth) return null;
    const style = window.getComputedStyle(el);
    const result = {
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      classList: el.className ? Array.from(el.classList) : [],
      dataAction: el.getAttribute('data-action') || undefined,
      dataTab: el.getAttribute('data-tab') || undefined,
      text: el.children.length === 0 ? (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : undefined,
      display: style.display,
      visible: isVisible(el),
    };
    if (el.children.length > 0 && currentDepth < maxDepth) {
      result.children = Array.from(el.children).map(child => skeletonOf(child, maxDepth, currentDepth + 1));
    }
    return result;
  }

  const panel = document.querySelector('#publish-panel');

  const report = {
    meta: {
      script: 'C1 — #publish-panel open',
      generatedAt: new Date().toISOString(),
      url: location.href,
    },
    publishPanel: panel ? {
      found: true,
      visible: isVisible(panel),
      classList: Array.from(panel.classList),
      // Tabs
      tabs: Array.from(panel.querySelectorAll('li, [data-tab], [role="tab"]')).map((el, i) => ({
        index: i,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        active: el.classList.contains('active') || el.getAttribute('aria-selected') === 'true',
        dataTab: el.getAttribute('data-tab') || null,
        classList: Array.from(el.classList),
      })),
      // Buttons / actions
      buttons: Array.from(panel.querySelectorAll('button, [data-action], a.button, .button')).map((el, i) => ({
        index: i,
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        dataAction: el.getAttribute('data-action') || null,
        href: el.getAttribute('href') || null,
        classList: Array.from(el.classList),
        visible: isVisible(el),
      })),
      // Skeleton (depth 5)
      skeleton: skeletonOf(panel, 5, 0),
    } : { found: false },
  };

  console.log('[Script C1] — #publish-panel result:');
  console.log(JSON.stringify(report, null, 2));
  return report;
})();


// ════════════════════════════════════════════════════════════
// C2 — #sections-panel structure (paste AFTER opening sections)
// ════════════════════════════════════════════════════════════
(function scriptC2_sectionsPanel() {
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      el.offsetParent !== null ||
      el.getClientRects().length > 0 ||
      (style.display !== 'none' && style.visibility !== 'hidden')
    );
  }

  function skeletonOf(el, maxDepth, currentDepth) {
    if (!el || currentDepth > maxDepth) return null;
    const style = window.getComputedStyle(el);
    const result = {
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      classList: el.className ? Array.from(el.classList) : [],
      dataAction: el.getAttribute('data-action') || undefined,
      dataId: el.getAttribute('data-id') || undefined,
      dataType: el.getAttribute('data-type') || undefined,
      text: el.children.length === 0 ? (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : undefined,
      display: style.display,
      visible: isVisible(el),
    };
    if (el.children.length > 0 && currentDepth < maxDepth) {
      result.children = Array.from(el.children).map(child => skeletonOf(child, maxDepth, currentDepth + 1));
    }
    return result;
  }

  const panel = document.querySelector('#sections-panel');

  // Also check alternative selectors in case id differs
  const altPanel = panel || document.querySelector('.sections-panel') || document.querySelector('[id*="section"][id*="panel"]');

  const target = panel || altPanel;

  // Section items — look for clickable items in the panel
  const sectionItems = target
    ? Array.from(target.querySelectorAll('[data-id], li, .item, .section-item')).map((el, i) => ({
        index: i,
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        dataId: el.getAttribute('data-id') || null,
        dataAction: el.getAttribute('data-action') || null,
        classList: Array.from(el.classList),
        visible: isVisible(el),
      }))
    : [];

  const report = {
    meta: {
      script: 'C2 — #sections-panel open',
      generatedAt: new Date().toISOString(),
      url: location.href,
      panelFoundById: !!panel,
      altSelectorUsed: !panel && !!altPanel,
    },
    sectionsPanel: target ? {
      found: true,
      id: target.id,
      visible: isVisible(target),
      classList: Array.from(target.classList),
      sectionItemCount: sectionItems.length,
      sectionItems,
      // Skeleton (depth 4)
      skeleton: skeletonOf(target, 4, 0),
    } : {
      found: false,
      // Dump all panels visible in the DOM for debugging
      visiblePanels: Array.from(document.querySelectorAll('[id*="panel"], [class*="panel"]'))
        .filter(el => isVisible(el))
        .map(el => ({ id: el.id, classList: Array.from(el.classList) })),
    },
  };

  console.log('[Script C2] — #sections-panel result:');
  console.log(JSON.stringify(report, null, 2));
  return report;
})();
