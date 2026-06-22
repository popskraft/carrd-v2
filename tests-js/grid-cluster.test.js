const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDom, loadScript, triggerDomReady } = require('./helpers');

test('grid-cluster wraps consecutive grid blocks into theme-grid wrapper', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div class="grid-2 w-20">A</div>' +
      '<div class="grid-2 w-80">B</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const wrapper = doc.querySelector('.theme-grid.grid-2.theme-grid--desktop-widths');
  assert.ok(wrapper, 'wrapper with theme-grid classes should exist');
  assert.equal(wrapper.children.length, 2);
  assert.equal(
    wrapper.style.getPropertyValue('--theme-grid-desktop-template'),
    '20% 80%'
  );
});

test('grid-cluster wraps consecutive data-grid-v2 blocks with data-driven options', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div data-grid-v2="features" data-grid-v2-columns="3" data-grid-v2-sm="1" data-grid-v2-lg="2" data-grid-v2-width="30%" data-grid-v2-gap="2">A</div>' +
      '<div data-grid-v2="features" data-grid-v2-width="70%">B</div>' +
      '<div data-grid-v2="features">C</div>' +
      '<div data-grid-v2="reviews" data-grid-v2-columns="2">D</div>' +
      '<div data-grid-v2="reviews">E</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const wrappers = dom.window.document.querySelectorAll('.theme-grid');
  assert.equal(wrappers.length, 2);
  assert.ok(wrappers[0].classList.contains('grid-3'));
  assert.ok(wrappers[0].classList.contains('grid-sm-1'));
  assert.ok(wrappers[0].classList.contains('grid-lg-2'));
  assert.equal(wrappers[0].style.getPropertyValue('--gap-override'), '2rem');
  assert.equal(
    wrappers[0].style.getPropertyValue('--theme-grid-desktop-template'),
    '30% 70%'
  );
  assert.ok(wrappers[1].classList.contains('grid-2'));
});

test('grid-cluster keeps legacy data-gap attributes as fallback', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div data-grid-v2="features" data-gap="2">A</div>' +
      '<div data-grid-v2="features">B</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-grid');
  assert.equal(wrapper.style.getPropertyValue('--gap-override'), '2rem');
});

test('grid-cluster marks blocks as initialized', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div class="grid-3">A</div>' +
      '<div class="grid-3">B</div>' +
      '<div class="grid-3">C</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const items = doc.querySelectorAll('.theme-grid > .grid-3');
  assert.equal(items.length, 3, 'should have 3 grid items inside wrapper');
  items.forEach(el => {
    assert.equal(el.dataset.gridInitialized, 'true');
  });
});

test('grid-cluster does not use any columns-prefixed class names', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div class="grid-2">A</div>' +
      '<div class="grid-2">B</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const classes = Array.from(el.classList);
    classes.forEach(cls => {
      assert.ok(
        !cls.includes('columns'),
        `Found class "${cls}" containing "columns" -- grid-cluster must not use columns-prefixed names`
      );
    });
  });
});

test('grid-cluster respects enabled:false', () => {
  const dom = createDom(
    '<div id="root"><div class="grid-2">A</div><div class="grid-2">B</div></div>'
  );
  dom.window.CarrdPluginOptionsV2 = { gridCluster: { enabled: false } };

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-grid').length, 0);
});

test('grid-cluster css preserves justify inner width behavior through the scoped helper class', () => {
  const gridCss = fs.readFileSync(
    path.resolve(__dirname, '..', 'src/grid-cluster-v2/grid-cluster-v2.css'),
    'utf-8'
  );

  assert.match(
    gridCss,
    /\.container-component\.theme-grid-justify\s+\.inner\s*\{\s*width:\s*100%;/m
  );
});

test('grid-cluster css applies gap overrides to both row and column gaps', () => {
  const gridCss = fs.readFileSync(
    path.resolve(__dirname, '..', 'src/grid-cluster-v2/grid-cluster-v2.css'),
    'utf-8'
  );

  assert.match(
    gridCss,
    /--local-row-gap:\s*var\(--gap-override,\s*var\(--theme-grid-row-gap,\s*1rem\)\);/m
  );
  assert.match(
    gridCss,
    /--local-row-gap:\s*var\(--gap-mobile-override,\s*var\(--gap-override,\s*var\(--theme-grid-row-gap,\s*1rem\)\)\);/m
  );
  assert.match(
    gridCss,
    /--local-row-gap:\s*var\(--gap-override,\s*var\(--theme-grid-row-gap-desktop,\s*2rem\)\);/m
  );
});

test('grid-cluster keeps default width classes when partial overrides are provided', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div class="grid-2 w-20">A</div>' +
      '<div class="grid-2 w-80">B</div>' +
    '</div>'
  );
  dom.window.CarrdPluginOptionsV2 = {
    gridCluster: {
      widthClasses: {
        'w-20': '22%'
      }
    }
  };

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-grid');
  assert.equal(wrapper.style.getPropertyValue('--theme-grid-desktop-template'), '22% 80%');
});

test('grid-cluster promotes responsive helper classes from cluster items to wrapper', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div class="grid-4 grid-sm-2 grid-md-3 grid-lg-5">A</div>' +
      '<div class="grid-4">B</div>' +
      '<div class="grid-4">C</div>' +
      '<div class="grid-4">D</div>' +
      '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-grid');
  assert.ok(wrapper.classList.contains('grid-sm-2'));
  assert.ok(wrapper.classList.contains('grid-md-3'));
  assert.ok(wrapper.classList.contains('grid-lg-5'));
});

test('grid-cluster uses grid-lg column count for desktop width helpers', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div class="grid-4 grid-lg-5 w-20">A</div>' +
      '<div class="grid-4 w-20">B</div>' +
      '<div class="grid-4 w-20">C</div>' +
      '<div class="grid-4 w-20">D</div>' +
      '<div class="grid-4 w-20">E</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster-v2/grid-cluster-v2.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-grid');
  assert.equal(
    wrapper.style.getPropertyValue('--theme-grid-desktop-template'),
    '20% 20% 20% 20% 20%'
  );
});
