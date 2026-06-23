/*
Carrd Builder — Targeted Verify: Script B (Element Selected State)
Usage:
  1) Open Carrd builder in Chrome.
  2) Click any element on the canvas so the properties panel opens.
  3) Open DevTools Console (F12 → Console).
  4) Paste this script and press Enter.
  5) Copy the console output and share it.
*/
(function scriptB_elementSelected() {
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      el.offsetParent !== null ||
      el.getClientRects().length > 0 ||
      (style.display !== 'none' && style.visibility !== 'hidden')
    );
  }

  function nodeInfo(el, label) {
    if (!el) return { label, found: false };
    const style = window.getComputedStyle(el);
    return {
      label,
      found: true,
      visible: isVisible(el),
      display: style.display,
      visibility: style.visibility,
      classList: Array.from(el.classList),
      tagName: el.tagName,
      innerHTML_trimmed: el.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 300),
      parentTag: el.parentElement ? el.parentElement.tagName : null,
      parentClass: el.parentElement ? el.parentElement.className : null,
      parentId: el.parentElement ? el.parentElement.id : null,
    };
  }

  const panel = document.querySelector('#properties-panel');

  // ── do-ui-previous / do-ui-next ──────────────────────────────────────────
  const prevEl = document.querySelector('#properties-panel .do-ui-previous');
  const nextEl = document.querySelector('#properties-panel .do-ui-next');

  // Also try broader selectors in case class differs
  const prevAny = document.querySelectorAll('.do-ui-previous');
  const nextAny = document.querySelectorAll('.do-ui-next');

  // Panel header actions container
  const actionsDiv = document.querySelector('#properties-panel header .actions');
  const actionsChildren = actionsDiv
    ? Array.from(actionsDiv.children).map(el => ({
        tagName: el.tagName,
        classList: Array.from(el.classList),
        text: (el.textContent || '').trim().slice(0, 40),
        visible: isVisible(el),
      }))
    : null;

  // Panel tabs
  const tabs = Array.from(document.querySelectorAll('#properties-panel header li')).map((li, i) => ({
    index: i,
    text: (li.textContent || '').trim(),
    active: li.classList.contains('active'),
    classList: Array.from(li.classList),
  }));

  // Panel title / element type
  const headerTitle = document.querySelector('#properties-panel header .title');
  const headerType = document.querySelector('#properties-panel header .type');

  // Footer controls
  const footerControls = Array.from(
    document.querySelectorAll('#properties-panel footer [class]')
  ).map(el => ({
    tagName: el.tagName,
    classList: Array.from(el.classList),
    text: (el.textContent || '').trim().slice(0, 40),
    visible: isVisible(el),
  }));

  const report = {
    meta: {
      script: 'B — element selected (properties panel open)',
      generatedAt: new Date().toISOString(),
      url: location.href,
      panelOpen: panel ? panel.classList.contains('visible') : false,
    },

    item4_prevNext_panelOpen: {
      panelExists: !!panel,
      panelVisible: panel ? panel.classList.contains('visible') : false,
      panelClassList: panel ? Array.from(panel.classList) : null,

      prev_inPanel: nodeInfo(prevEl, '#properties-panel .do-ui-previous'),
      next_inPanel: nodeInfo(nextEl, '#properties-panel .do-ui-next'),

      prev_allOccurrences: Array.from(prevAny).map((el, i) => nodeInfo(el, 'prev_' + i)),
      next_allOccurrences: Array.from(nextAny).map((el, i) => nodeInfo(el, 'next_' + i)),
    },

    panelHeader: {
      title: headerTitle ? (headerTitle.textContent || '').trim() : null,
      type: headerType ? (headerType.textContent || '').trim() : null,
      actionsDiv: actionsDiv ? {
        found: true,
        classList: Array.from(actionsDiv.classList),
        childCount: actionsDiv.children.length,
        children: actionsChildren,
      } : { found: false },
      tabs,
    },

    panelFooter: {
      controls: footerControls,
    },
  };

  console.log('[Script B] — element selected result:');
  console.log(JSON.stringify(report, null, 2));
  return report;
})();
