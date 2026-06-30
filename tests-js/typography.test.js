const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady, setPluginOptions } = require('./helpers');

test('typography parses markdown-like syntax into plugin-scoped elements', () => {
  const dom = createDom(
    '<div class="txt"><div class="inner">' +
      '<span class="p"># Title</span>' +
      '<span class="p">- One<br>- Two</span>' +
      '<span class="p">---</span>' +
    '</div></div>'
  );

  loadScript(dom, 'src/typography/typography.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-typography-h1').length, 1);
  assert.equal(doc.querySelectorAll('.theme-typography-ul .theme-typography-li').length, 2);
  assert.equal(doc.querySelectorAll('.theme-typography-hr').length, 1);
});

test('typography exposes API and does not double-initialize', () => {
  const dom = createDom('<div class="txt"><span class="p">## Header</span></div>');
  loadScript(dom, 'src/typography/typography.js');

  triggerDomReady(dom);
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.ok(dom.window.CarrdTypography);
  assert.equal(typeof dom.window.CarrdTypography.process, 'function');
  assert.equal(doc.querySelectorAll('.theme-typography-h2').length, 1);
  assert.equal(doc.querySelector('.txt').dataset.typographyInitialized, 'true');
});

test('typography preserves default nested classes when partial overrides are provided', () => {
  const dom = createDom('<div class="txt"><span class="p"># Header</span><span class="p">- Item</span></div>');
  setPluginOptions(dom, {
    typography: {
      headingClasses: { h1: 'custom-h1' }
    }
  });

  loadScript(dom, 'src/typography/typography.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.custom-h1').length, 1);
  assert.equal(doc.querySelectorAll('.theme-typography-li').length, 1);
});
