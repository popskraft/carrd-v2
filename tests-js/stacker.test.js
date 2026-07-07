const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDom, loadScript, setPluginOptions, triggerDomReady } = require('./helpers');

function container(id, attrs = '') {
  return (
    `<div id="${id}" class="container-component" ${attrs}>` +
    '<div class="wrapper"><div class="inner"><h2>Item</h2></div></div>' +
    '</div>'
  );
}

function stackMarkup(attribute = 'data-stacker', name = 'stack') {
  return (
    '<section id="home-section"><div class="inner">' +
    container('c1', `${attribute}="${name}"`) +
    container('c2', `${attribute}="${name}"`) +
    container('c3', `${attribute}="${name}"`) +
    '</div></section>'
  );
}

test('stacker wraps a contiguous group and marks items', () => {
  const dom = createDom(stackMarkup());
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const wrappers = doc.querySelectorAll('.theme-stacker-group');
  assert.equal(wrappers.length, 1);
  assert.equal(wrappers[0].getAttribute('data-stacker-group'), 'stack');

  const items = wrappers[0].querySelectorAll(':scope > .theme-stacker-item');
  assert.equal(items.length, 3);
  assert.deepEqual(
    Array.from(items).map(item => item.id),
    ['c1', 'c2', 'c3']
  );
  assert.deepEqual(
    Array.from(items).map(item => item.style.zIndex),
    ['2', '3', '4']
  );
});

test('stacker supports legacy data-stacked alias', () => {
  const dom = createDom(stackMarkup('data-stacked'));
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const wrappers = dom.window.document.querySelectorAll('.theme-stacker-group');
  assert.equal(wrappers.length, 1);
  assert.equal(wrappers[0].children.length, 3);
});

test('stacker is idempotent on repeated init', () => {
  const dom = createDom(stackMarkup());
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);
  triggerDomReady(dom);
  dom.window.CarrdStacker.refresh();

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-stacker-group').length, 1);
  assert.equal(doc.querySelectorAll('.theme-stacker-item').length, 3);
});

test('stacker applies offset from data-stacker-offset attribute', () => {
  const dom = createDom(
    '<section><div class="inner">' +
    container('c1', 'data-stacker="stack" data-stacker-offset="80"') +
    container('c2', 'data-stacker="stack"') +
    '</div></section>'
  );
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-stacker-group');
  assert.equal(wrapper.style.getPropertyValue('--theme-stacker-offset'), '80px');
});

test('stacker applies offset from CarrdPluginOptions instances', () => {
  const dom = createDom(stackMarkup());
  setPluginOptions(dom, { stacker: { instances: { stack: { offset: '4rem' } } } });
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-stacker-group');
  assert.equal(wrapper.style.getPropertyValue('--theme-stacker-offset'), '4rem');
});

test('stacker falls back to 0px on invalid offset', () => {
  const dom = createDom(
    '<section><div class="inner">' +
    container('c1', 'data-stacker="stack" data-stacker-offset="oops;url(x)"') +
    container('c2', 'data-stacker="stack"') +
    '</div></section>'
  );
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-stacker-group');
  assert.equal(wrapper.style.getPropertyValue('--theme-stacker-offset'), '0px');
});

test('stacker leaves the offset var unset by default for :root overrides', () => {
  const dom = createDom(stackMarkup());
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const wrapper = dom.window.document.querySelector('.theme-stacker-group');
  assert.equal(wrapper.style.getPropertyValue('--theme-stacker-offset'), '');
});

test('stacker skips single-item runs and invalid names', () => {
  const dom = createDom(
    '<section><div class="inner">' +
    container('c1', 'data-stacker="stack"') +
    container('c2', 'data-stacker="1bad"') +
    container('c3', 'data-stacker=""') +
    '</div></section>'
  );
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-stacker-group').length, 0);
});

test('stacker stacks non-contiguous runs independently', () => {
  const dom = createDom(
    '<section><div class="inner">' +
    container('c1', 'data-stacker="stack"') +
    container('c2', 'data-stacker="stack"') +
    '<p id="gap">Break</p>' +
    container('c3', 'data-stacker="stack"') +
    container('c4', 'data-stacker="stack"') +
    '</div></section>'
  );
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const wrappers = doc.querySelectorAll('.theme-stacker-group');
  assert.equal(wrappers.length, 2);
  assert.equal(wrappers[0].children.length, 2);
  assert.equal(wrappers[1].children.length, 2);
  assert.ok(doc.getElementById('gap'), 'gap content is preserved');
});

test('stacker supports independent groups by name', () => {
  const dom = createDom(
    '<section><div class="inner">' +
    container('a1', 'data-stacker="alpha"') +
    container('a2', 'data-stacker="alpha"') +
    container('b1', 'data-stacker="beta"') +
    container('b2', 'data-stacker="beta"') +
    '</div></section>'
  );
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const wrappers = dom.window.document.querySelectorAll('.theme-stacker-group');
  assert.equal(wrappers.length, 2);
  assert.equal(wrappers[0].getAttribute('data-stacker-group'), 'alpha');
  assert.equal(wrappers[1].getAttribute('data-stacker-group'), 'beta');
});

test('stacker adds overflow fix to hidden-overflow ancestors', () => {
  const dom = createDom(
    '<div class="site-wrapper" style="overflow: hidden">' +
    stackMarkup() +
    '</div>'
  );
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const siteWrapper = dom.window.document.querySelector('.site-wrapper');
  assert.ok(siteWrapper.classList.contains('theme-stacker-overflow-fix'));
});

test('stacker can be disabled globally', () => {
  const dom = createDom(stackMarkup());
  setPluginOptions(dom, { stacker: { enabled: false } });
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-stacker-group').length, 0);
});

test('stacker initializes the carrd-source stacked structure', context => {
  const carrdSourcePath = path.resolve(__dirname, '..', 'carrd-source', 'index.html');
  if (!fs.existsSync(carrdSourcePath)) {
    context.skip('carrd-source reference is not included in this repository');
    return;
  }

  const html = fs.readFileSync(carrdSourcePath, 'utf-8');
  const dom = createDom(html);

  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const wrappers = doc.querySelectorAll('.theme-stacker-group');
  assert.equal(wrappers.length, 1);
  assert.equal(wrappers[0].getAttribute('data-stacker-group'), 'stack');
  assert.equal(wrappers[0].querySelectorAll(':scope > .theme-stacker-item').length, 3);
  assert.ok(doc.querySelector('.site-wrapper').classList.contains('theme-stacker-overflow-fix'));
});

test('stacker exposes unified public API', () => {
  const dom = createDom(stackMarkup());
  loadScript(dom, 'src/stacker/stacker.js');
  triggerDomReady(dom);

  assert.ok(dom.window.CarrdStacker);
  assert.equal(typeof dom.window.CarrdStacker.refresh, 'function');
  const groupMap = dom.window.CarrdStacker.getGroups();
  assert.equal(groupMap.stack.length, 1);
});
