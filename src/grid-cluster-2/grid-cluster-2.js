(function() {
  'use strict';

  const options = (window.CarrdPluginOptions && window.CarrdPluginOptions.gridCluster2) || {};
  const ATTRIBUTES = {
    group: 'data-grid-2',
    columns: 'data-grid-2-cols',
    columnsSmall: 'data-grid-2-cols-sm',
    columnsLarge: 'data-grid-2-cols-lg',
    span: 'data-grid-2-span',
    spanSmall: 'data-grid-2-span-sm',
    spanLarge: 'data-grid-2-span-lg',
    gap: 'data-grid-2-gap',
    gapMobile: 'data-grid-2-gap-mobile',
    justify: 'data-grid-2-justify'
  };
  const WRAPPER_CLASS = 'theme-grid-2';
  const JUSTIFY_CLASS = 'theme-grid-2--justify';

  /** Return a supported track count, or null for invalid input. */
  function parseUnit(value) {
    const unit = Number(value);
    return Number.isInteger(unit) && unit >= 1 && unit <= 6 ? unit : null;
  }

  /** Treat plain numbers as rem values and preserve explicit CSS lengths. */
  function parseGap(value) {
    const normalized = (value || '').trim();
    if (!normalized) return null;
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? `${numeric}rem` : normalized;
  }

  function getGroupName(element) {
    return (element.getAttribute(ATTRIBUTES.group) || '').trim();
  }

  function readSpan(element, attribute, columns, fallback) {
    const span = parseUnit(element.getAttribute(attribute)) || fallback;
    return Math.min(span, columns);
  }

  function applyLayout(wrapper, cluster) {
    const first = cluster[0];
    const columns = parseUnit(first.getAttribute(ATTRIBUTES.columns)) || 1;
    const columnsSmall = parseUnit(first.getAttribute(ATTRIBUTES.columnsSmall)) || 1;
    const columnsLarge = parseUnit(first.getAttribute(ATTRIBUTES.columnsLarge)) || columns;

    wrapper.style.setProperty('--grid-2-cols', columns);
    wrapper.style.setProperty('--grid-2-cols-sm', columnsSmall);
    wrapper.style.setProperty('--grid-2-cols-lg', columnsLarge);

    cluster.forEach(item => {
      const span = readSpan(item, ATTRIBUTES.span, columns, 1);
      const spanSmall = readSpan(item, ATTRIBUTES.spanSmall, columnsSmall, 1);
      const spanLarge = readSpan(item, ATTRIBUTES.spanLarge, columnsLarge, span);

      item.style.setProperty('--grid-2-span', span);
      item.style.setProperty('--grid-2-span-sm', spanSmall);
      item.style.setProperty('--grid-2-span-lg', spanLarge);
    });
  }

  function wrapCluster(cluster) {
    const first = cluster[0];
    const wrapper = document.createElement('div');
    wrapper.className = first.getAttribute(ATTRIBUTES.justify) === 'true'
      ? `${WRAPPER_CLASS} ${JUSTIFY_CLASS}`
      : WRAPPER_CLASS;

    first.parentNode.insertBefore(wrapper, first);
    cluster.forEach(item => wrapper.appendChild(item));
    applyLayout(wrapper, cluster);

    const gap = parseGap(first.getAttribute(ATTRIBUTES.gap));
    const gapMobile = parseGap(first.getAttribute(ATTRIBUTES.gapMobile));
    if (gap) wrapper.style.setProperty('--grid-2-gap-override', gap);
    if (gapMobile) wrapper.style.setProperty('--grid-2-gap-mobile-override', gapMobile);
  }

  function init() {
    if (options.enabled === false) return;

    document.querySelectorAll(`[${ATTRIBUTES.group}]`).forEach(block => {
      if (block.dataset.grid2Initialized === 'true') return;

      const name = getGroupName(block);
      if (!name) return;

      const cluster = [block];
      let sibling = block.nextElementSibling;
      while (sibling && getGroupName(sibling) === name) {
        cluster.push(sibling);
        sibling = sibling.nextElementSibling;
      }

      cluster.forEach(item => item.dataset.grid2Initialized = 'true');
      wrapCluster(cluster);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
