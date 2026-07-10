const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDom, loadScript, triggerDomReady } = require('./helpers');

const SCRIPT = 'src/grid-cluster-2/grid-cluster-2.js';

function initialize(html, options = null) {
  const dom = createDom(html);
  if (options) dom.window.CarrdPluginOptions = options;
  loadScript(dom, SCRIPT);
  triggerDomReady(dom);
  return dom;
}

test('grid-cluster-2 supports equal grids from two through six columns', () => {
  const groups = [2, 3, 4, 5, 6].map(columns => (
    `<section>` +
      `<div data-grid-2="grid${columns}" data-grid-2-cols="${columns}" data-grid-2-span="1">A</div>` +
      `<div data-grid-2="grid${columns}" data-grid-2-span="1">B</div>` +
    `</section>`
  )).join('');
  const dom = initialize(groups);
  const wrappers = dom.window.document.querySelectorAll('.theme-grid-2');

  assert.equal(wrappers.length, 5);
  wrappers.forEach((wrapper, index) => {
    assert.equal(wrapper.style.getPropertyValue('--grid-2-cols'), String(index + 2));
    assert.equal(wrapper.style.getPropertyValue('--grid-2-cols-sm'), '1');
    assert.equal(wrapper.style.getPropertyValue('--grid-2-cols-lg'), String(index + 2));
    Array.from(wrapper.children).forEach(item => {
      assert.equal(item.style.getPropertyValue('--grid-2-span'), '1');
      assert.equal(item.style.getPropertyValue('--grid-2-span-sm'), '1');
      assert.equal(item.style.getPropertyValue('--grid-2-span-lg'), '1');
    });
  });
});

test('grid-cluster-2 applies independent small, default, and large layouts', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div data-grid-2="features" data-grid-2-cols="2" data-grid-2-cols-sm="2" data-grid-2-cols-lg="6" data-grid-2-span="1" data-grid-2-span-sm="1" data-grid-2-span-lg="4">A</div>' +
      '<div data-grid-2="features" data-grid-2-span="1" data-grid-2-span-sm="1" data-grid-2-span-lg="1">B</div>' +
      '<div data-grid-2="features" data-grid-2-span="1" data-grid-2-span-sm="1" data-grid-2-span-lg="1">C</div>' +
    '</div>'
  );
  const wrapper = dom.window.document.querySelector('.theme-grid-2');
  const items = Array.from(wrapper.children);

  assert.equal(wrapper.style.getPropertyValue('--grid-2-cols'), '2');
  assert.equal(wrapper.style.getPropertyValue('--grid-2-cols-sm'), '2');
  assert.equal(wrapper.style.getPropertyValue('--grid-2-cols-lg'), '6');
  assert.deepEqual(items.map(item => item.style.getPropertyValue('--grid-2-span-lg')), ['4', '1', '1']);
});

test('grid-cluster-2 clamps oversized spans and safely defaults invalid values', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div data-grid-2="safe" data-grid-2-cols="4" data-grid-2-cols-sm="bad" data-grid-2-cols-lg="0" data-grid-2-span="6" data-grid-2-span-sm="bad" data-grid-2-span-lg="6">A</div>' +
      '<div data-grid-2="safe">B</div>' +
    '</div>'
  );
  const wrapper = dom.window.document.querySelector('.theme-grid-2');
  const [first, second] = wrapper.children;

  assert.equal(wrapper.style.getPropertyValue('--grid-2-cols'), '4');
  assert.equal(wrapper.style.getPropertyValue('--grid-2-cols-sm'), '1');
  assert.equal(wrapper.style.getPropertyValue('--grid-2-cols-lg'), '4');
  assert.equal(first.style.getPropertyValue('--grid-2-span'), '4');
  assert.equal(first.style.getPropertyValue('--grid-2-span-sm'), '1');
  assert.equal(first.style.getPropertyValue('--grid-2-span-lg'), '4');
  assert.equal(second.style.getPropertyValue('--grid-2-span'), '1');
  assert.equal(second.style.getPropertyValue('--grid-2-span-lg'), '1');
});

test('grid-cluster-2 keeps groups contiguous, named, and idempotent', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div data-grid-2="alpha" data-grid-2-cols="2">A</div>' +
      '<div data-grid-2="alpha">B</div>' +
      '<p>break</p>' +
      '<div data-grid-2="alpha">C</div>' +
      '<div data-grid-2="">ignored</div>' +
    '</div>'
  );
  const doc = dom.window.document;

  assert.equal(doc.querySelectorAll('.theme-grid-2').length, 2);
  assert.equal(doc.querySelector('.theme-grid-2').children.length, 2);
  assert.equal(doc.querySelector('[data-grid-2=""]').dataset.grid2Initialized, undefined);

  loadScript(dom, SCRIPT);
  triggerDomReady(dom);
  assert.equal(doc.querySelectorAll('.theme-grid-2').length, 2);
});

test('grid-cluster-2 applies canonical gaps and justify mode', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div class="container-component" data-grid-2="layout" data-grid-2-cols="2" data-grid-2-gap="1.5" data-grid-2-gap-mobile="calc(1rem + 2px)" data-grid-2-justify="true">A</div>' +
      '<div class="container-component" data-grid-2="layout">B</div>' +
    '</div>'
  );
  const wrapper = dom.window.document.querySelector('.theme-grid-2');

  assert.ok(wrapper.classList.contains('theme-grid-2--justify'));
  assert.equal(wrapper.style.getPropertyValue('--grid-2-gap-override'), '1.5rem');
  assert.equal(wrapper.style.getPropertyValue('--grid-2-gap-mobile-override'), 'calc(1rem + 2px)');
});

test('grid-cluster-2 respects its isolated enabled option', () => {
  const disabled = initialize(
    '<div data-grid-2="disabled" data-grid-2-cols="2">A</div>',
    { gridCluster2: { enabled: false } }
  );
  const v1Only = initialize(
    '<div data-grid-2="enabled" data-grid-2-cols="2">A</div>',
    { gridCluster: { enabled: false } }
  );

  assert.equal(disabled.window.document.querySelectorAll('.theme-grid-2').length, 0);
  assert.equal(v1Only.window.document.querySelectorAll('.theme-grid-2').length, 1);
});

test('grid-cluster-2 can run beside the canonical grid-cluster without marker collisions', () => {
  const dom = createDom(
    '<div id="root">' +
      '<div data-grid="stable" data-grid-columns="2">V1 A</div>' +
      '<div data-grid="stable">V1 B</div>' +
      '<p>break</p>' +
      '<div data-grid-2="experimental" data-grid-2-cols="3" data-grid-2-span="1">V2 A</div>' +
      '<div data-grid-2="experimental" data-grid-2-span="1">V2 B</div>' +
    '</div>'
  );

  loadScript(dom, 'src/grid-cluster/grid-cluster.js');
  loadScript(dom, SCRIPT);
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-grid').length, 1);
  assert.equal(dom.window.document.querySelectorAll('.theme-grid-2').length, 1);
  assert.equal(dom.window.document.querySelector('.theme-grid-2').children.length, 2);
});

test('grid-cluster-2 remains outside the stable theme bundle', () => {
  const config = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '..', 'bundle.config.json'),
    'utf8'
  ));
  const runtimeJs = fs.readFileSync(
    path.resolve(__dirname, '..', 'dist/theme-runtime.min.js'),
    'utf8'
  );

  assert.ok(!config.cdn_bundle.plugins.includes('grid-cluster-2'));
  assert.ok(!runtimeJs.includes('data-grid-2'));
  assert.ok(!runtimeJs.includes('gridCluster2'));
});

test('grid-cluster-2 publishes an inline test embed without a stale CDN install path', () => {
  const pluginDir = path.resolve(__dirname, '..', 'dist/grid-cluster-2');
  const readme = fs.readFileSync(path.join(pluginDir, 'README.md'), 'utf8');

  assert.ok(fs.existsSync(path.join(pluginDir, 'grid-cluster-2-embed.html')));
  assert.ok(!fs.existsSync(path.join(pluginDir, 'grid-cluster-2-cdn.html')));
  assert.match(readme, /Inline Embed \(required for testing\)/);
  assert.doesNotMatch(readme, /CDN Individual|Bundle Add-on/);
});

test('grid-cluster-2 CSS owns dynamic tracks, spans, breakpoints, and image containment', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '..', 'src/grid-cluster-2/grid-cluster-2.css'),
    'utf8'
  );

  assert.match(css, /repeat\(var\(--grid-2-cols-sm, 1\), minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(min-width: 737px\)/);
  assert.match(css, /@media \(min-width: 1280px\)/);
  assert.match(css, /grid-column:\s*span var\(--grid-2-span-lg/);
  assert.match(css, /\.theme-grid-2 \.image-component > \.frame\s*\{\s*max-width:\s*100%;/m);
  assert.doesNotMatch(css, /theme-grid--desktop-widths|data-grid-width|w-20/);
});
