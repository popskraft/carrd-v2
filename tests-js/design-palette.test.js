const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, setPluginOptions, triggerDomReady } = require('./helpers');

function themeStyle() {
  return `
    <style>
    :root {
      --theme-color-brand-red: #EF4444;
      --theme-color-brand-green: rgb(16, 185, 129);
      --theme-color-brand-1: var(--theme-color-brand-red);
      --theme-color-primary: var(--theme-color-brand-1);
      --theme-color-heading: #222222;
      --theme-color-text: #666666;
      --theme-color-surface: #FFFFFF;
      --theme-color-border: #EFEFEF;
      --theme-font-family: Arial, sans-serif;
    }
    </style>
  `;
}

test('design palette renders configured token swatches into a visible target', () => {
  const dom = createDom(`${themeStyle()}<div data-design-palette></div>`);
  setPluginOptions(dom, {
    designPalette: {
      title: 'Project colors',
      tokens: ['--theme-color-primary', '--theme-color-brand-green']
    }
  });

  loadScript(dom, 'src/design-palette/design-palette.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelector('.theme-design-palette__title').textContent, 'Project colors');
  assert.deepEqual(
    Array.from(doc.querySelectorAll('.theme-design-palette__token')).map(node => node.textContent),
    ['--theme-color-primary', '--theme-color-brand-green']
  );
  assert.deepEqual(
    Array.from(doc.querySelectorAll('.theme-design-palette__value')).map(node => node.textContent),
    ['#EF4444', '#10B981']
  );
});

test('design palette skips unresolved tokens by default', () => {
  const dom = createDom(`${themeStyle()}<div data-design-palette></div>`);
  setPluginOptions(dom, {
    designPalette: {
      tokens: ['--theme-color-primary', '--theme-color-missing']
    }
  });

  loadScript(dom, 'src/design-palette/design-palette.js');
  triggerDomReady(dom);

  assert.deepEqual(
    Array.from(dom.window.document.querySelectorAll('.theme-design-palette__token')).map(node => node.textContent),
    ['--theme-color-primary']
  );
});

test('design palette exposes refresh API and custom grouped tokens', () => {
  const dom = createDom(`${themeStyle()}<div data-design-palette></div>`);
  setPluginOptions(dom, {
    designPalette: {
      tokens: [
        {
          title: 'Brand',
          tokens: ['--theme-color-primary']
        }
      ]
    }
  });

  loadScript(dom, 'src/design-palette/design-palette.js');
  triggerDomReady(dom);

  dom.window.document.documentElement.style.setProperty('--theme-color-brand-red', '#111111');
  dom.window.CarrdDesignPalette.refresh();

  assert.equal(dom.window.CarrdDesignPalette.getTokens()[0].title, 'Brand');
  assert.equal(
    dom.window.document.querySelector('.theme-design-palette__value').textContent,
    '#111111'
  );
});
