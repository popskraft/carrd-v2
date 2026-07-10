const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDom, loadScript, triggerDomReady } = require('./helpers');

const SCRIPT = 'src/grid-cluster/grid-cluster.js';

function initialize(html, options = null) {
  const dom = createDom(html);
  if (options) dom.window.CarrdPluginOptions = options;
  loadScript(dom, SCRIPT);
  triggerDomReady(dom);
  return dom;
}

test('grid-cluster supports equal grids from two through six columns', () => {
  const groups = [2, 3, 4, 5, 6].map(columns => (
    `<section>` +
      `<div data-grid="grid${columns}" data-grid-cols="${columns}" data-grid-span="1">A</div>` +
      `<div data-grid="grid${columns}" data-grid-span="1">B</div>` +
    `</section>`
  )).join('');
  const dom = initialize(groups);
  const wrappers = dom.window.document.querySelectorAll('.theme-grid');

  assert.equal(wrappers.length, 5);
  wrappers.forEach((wrapper, index) => {
    assert.equal(wrapper.style.getPropertyValue('--grid-cols'), String(index + 2));
    assert.equal(wrapper.style.getPropertyValue('--grid-cols-sm'), '1');
    assert.equal(wrapper.style.getPropertyValue('--grid-cols-lg'), String(index + 2));
    Array.from(wrapper.children).forEach(item => {
      assert.equal(item.style.getPropertyValue('--grid-span'), '1');
      assert.equal(item.style.getPropertyValue('--grid-span-sm'), '1');
      assert.equal(item.style.getPropertyValue('--grid-span-lg'), '1');
    });
  });
});

test('grid-cluster applies independent small, default, and large layouts', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div data-grid="features" data-grid-cols="2" data-grid-cols-sm="2" data-grid-cols-lg="6" data-grid-span="1" data-grid-span-sm="1" data-grid-span-lg="4">A</div>' +
      '<div data-grid="features" data-grid-span="1" data-grid-span-sm="1" data-grid-span-lg="1">B</div>' +
      '<div data-grid="features" data-grid-span="1" data-grid-span-sm="1" data-grid-span-lg="1">C</div>' +
    '</div>'
  );
  const wrapper = dom.window.document.querySelector('.theme-grid');
  const items = Array.from(wrapper.children);

  assert.equal(wrapper.style.getPropertyValue('--grid-cols'), '2');
  assert.equal(wrapper.style.getPropertyValue('--grid-cols-sm'), '2');
  assert.equal(wrapper.style.getPropertyValue('--grid-cols-lg'), '6');
  assert.deepEqual(items.map(item => item.style.getPropertyValue('--grid-span-lg')), ['4', '1', '1']);
});

test('grid-cluster clamps oversized spans and safely defaults invalid values', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div data-grid="safe" data-grid-cols="4" data-grid-cols-sm="bad" data-grid-cols-lg="0" data-grid-span="6" data-grid-span-sm="bad" data-grid-span-lg="6">A</div>' +
      '<div data-grid="safe">B</div>' +
    '</div>'
  );
  const wrapper = dom.window.document.querySelector('.theme-grid');
  const [first, second] = wrapper.children;

  assert.equal(wrapper.style.getPropertyValue('--grid-cols'), '4');
  assert.equal(wrapper.style.getPropertyValue('--grid-cols-sm'), '1');
  assert.equal(wrapper.style.getPropertyValue('--grid-cols-lg'), '4');
  assert.equal(first.style.getPropertyValue('--grid-span'), '4');
  assert.equal(first.style.getPropertyValue('--grid-span-sm'), '1');
  assert.equal(first.style.getPropertyValue('--grid-span-lg'), '4');
  assert.equal(second.style.getPropertyValue('--grid-span'), '1');
  assert.equal(second.style.getPropertyValue('--grid-span-lg'), '1');
});

test('grid-cluster keeps groups contiguous, named, and idempotent', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div data-grid="alpha" data-grid-cols="2">A</div>' +
      '<div data-grid="alpha">B</div>' +
      '<p>break</p>' +
      '<div data-grid="alpha">C</div>' +
      '<div data-grid="">ignored</div>' +
    '</div>'
  );
  const doc = dom.window.document;

  assert.equal(doc.querySelectorAll('.theme-grid').length, 2);
  assert.equal(doc.querySelector('.theme-grid').children.length, 2);
  assert.equal(doc.querySelector('[data-grid=""]').dataset.gridInitialized, undefined);

  loadScript(dom, SCRIPT);
  triggerDomReady(dom);
  assert.equal(doc.querySelectorAll('.theme-grid').length, 2);
});

test('grid-cluster applies canonical gaps and justify mode', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div class="container-component" data-grid="layout" data-grid-cols="2" data-grid-gap="1.5" data-grid-gap-mobile="calc(1rem + 2px)" data-grid-justify="true">A</div>' +
      '<div class="container-component" data-grid="layout">B</div>' +
    '</div>'
  );
  const wrapper = dom.window.document.querySelector('.theme-grid');

  assert.ok(wrapper.classList.contains('theme-grid--justify'));
  assert.equal(wrapper.style.getPropertyValue('--grid-gap-override'), '1.5rem');
  assert.equal(wrapper.style.getPropertyValue('--grid-gap-mobile-override'), 'calc(1rem + 2px)');
});

test('grid-cluster respects enabled:false', () => {
  const disabled = initialize(
    '<div data-grid="disabled" data-grid-cols="2">A</div>',
    { gridCluster: { enabled: false } }
  );

  assert.equal(disabled.window.document.querySelectorAll('.theme-grid').length, 0);
});

test('grid-cluster uses canonical data-grid markers and cols/span contract', () => {
  const dom = initialize(
    '<div id="root">' +
      '<div data-grid="experimental" data-grid-cols="3" data-grid-span="1">A</div>' +
      '<div data-grid="experimental" data-grid-span="2">B</div>' +
    '</div>'
  );

  const wrapper = dom.window.document.querySelector('.theme-grid');
  assert.equal(wrapper.children.length, 2);
  assert.equal(wrapper.style.getPropertyValue('--grid-cols'), '3');
});

test('grid-cluster is included in the stable theme bundle', () => {
  const config = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '..', 'bundle.config.json'),
    'utf8'
  ));
  const runtimeJs = fs.readFileSync(
    path.resolve(__dirname, '..', 'dist/theme-runtime.min.js'),
    'utf8'
  );

  assert.ok(config.cdn_bundle.plugins.includes('grid-cluster'));
  assert.ok(runtimeJs.includes('data-grid-span'));
  assert.ok(runtimeJs.includes('data-grid-cols'));
  assert.ok(!runtimeJs.includes('gridCluster2'));
});

test('grid-cluster publishes standard dist artifacts for active delivery', () => {
  const pluginDir = path.resolve(__dirname, '..', 'dist/grid-cluster');
  const readme = fs.readFileSync(path.join(pluginDir, 'README.md'), 'utf8');

  assert.ok(fs.existsSync(path.join(pluginDir, 'grid-cluster-embed.html')));
  assert.ok(fs.existsSync(path.join(pluginDir, 'grid-cluster-cdn.html')));
  assert.match(readme, /CDN Bundle \(recommended\)|CDN Individual/);
});

test('grid-cluster CSS owns dynamic tracks, spans, breakpoints, and image containment', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '..', 'src/grid-cluster/grid-cluster.css'),
    'utf8'
  );

  assert.match(css, /repeat\(var\(--grid-cols-sm, 1\), minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(min-width: 737px\)/);
  assert.match(css, /@media \(min-width: 1280px\)/);
  assert.match(css, /grid-column:\s*span var\(--grid-span-lg/);
  assert.match(css, /\.theme-grid \.image-component > \.frame\s*\{\s*max-width:\s*100%;/m);
  assert.match(css, /\.theme-grid > \[data-grid\]/);
  assert.doesNotMatch(css, /theme-grid--desktop-widths|data-grid-width|w-20|data-grid-columns|grid-sm-2/);
});
