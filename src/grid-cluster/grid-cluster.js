(function() {
  'use strict';

  const options = (window.CarrdPluginOptions && window.CarrdPluginOptions.gridCluster) || {};
  const ATTRIBUTES = {
    group: 'data-grid',
    columns: 'data-grid-cols',
    columnsSmall: 'data-grid-cols-sm',
    columnsLarge: 'data-grid-cols-lg',
    span: 'data-grid-span',
    spanSmall: 'data-grid-span-sm',
    spanLarge: 'data-grid-span-lg',
    gap: 'data-grid-gap',
    gapMobile: 'data-grid-gap-mobile',
    justify: 'data-grid-justify'
  };
  const WRAPPER_CLASS = 'theme-grid';
  const JUSTIFY_CLASS = 'theme-grid--justify';

  function parseUnit(value) {
    const unit = Number(value);
    return Number.isInteger(unit) && unit >= 1 && unit <= 6 ? unit : null;
  }

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

    wrapper.style.setProperty('--grid-cols', columns);
    wrapper.style.setProperty('--grid-cols-sm', columnsSmall);
    wrapper.style.setProperty('--grid-cols-lg', columnsLarge);

    cluster.forEach(item => {
      const span = readSpan(item, ATTRIBUTES.span, columns, 1);
      const spanSmall = readSpan(item, ATTRIBUTES.spanSmall, columnsSmall, 1);
      const spanLarge = readSpan(item, ATTRIBUTES.spanLarge, columnsLarge, span);

      item.style.setProperty('--grid-span', span);
      item.style.setProperty('--grid-span-sm', spanSmall);
      item.style.setProperty('--grid-span-lg', spanLarge);
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
    if (gap) wrapper.style.setProperty('--grid-gap-override', gap);
    if (gapMobile) wrapper.style.setProperty('--grid-gap-mobile-override', gapMobile);
  }

  function init() {
    if (options.enabled === false) return;

    document.querySelectorAll(`[${ATTRIBUTES.group}]`).forEach(block => {
      if (block.dataset.gridInitialized === 'true') return;

      const name = getGroupName(block);
      if (!name) return;

      const cluster = [block];
      let sibling = block.nextElementSibling;
      while (sibling && getGroupName(sibling) === name) {
        cluster.push(sibling);
        sibling = sibling.nextElementSibling;
      }

      cluster.forEach(item => { item.dataset.gridInitialized = 'true'; });
      wrapCluster(cluster);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
