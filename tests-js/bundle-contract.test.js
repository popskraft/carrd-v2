const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createDom,
  loadScript,
  click,
  triggerDomReady,
  mockViewport,
  mockResizeObserver,
  mockMutationObserver,
  useFakeTimers
} = require('./helpers');

const dist = (...parts) => path.resolve(__dirname, '..', 'dist', ...parts);

test('required dist artifacts exist for every published plugin', () => {
  const topLevelFiles = [
    'README.md',
    'CHANGELOG.md',
    'theme-design-system.html',
    'theme-design-tokens.css',
    'theme-ui.css',
    'theme-core-v2.min.css',
    'theme-core-v2.min.js'
  ];

  topLevelFiles.forEach(file => {
    assert.ok(fs.existsSync(dist(file)), `${file} should exist in dist/`);
  });

  const publishedPlugins = {
    'accordeon-v2': { css: true, js: true },
    'cards-v2': { css: true, js: true },
    'cookie-banner-v2': { css: true, js: true },
    'faq-v2': { css: true, js: true },
    'floating-cta-v2': { css: true, js: true },
    'grid-cluster-v2': { css: true, js: true },
    'header-nav-v2': { css: true, js: true },
    'modal-v2': { css: true, js: true },
    'no-loadwaiting-v2': { css: false, js: true, jsPlacement: 'head' },
    'shopping-cart-v2': { css: true, js: true },
    'slider-v2': { css: true, js: true },
    'switcher-v2': { css: true, js: true },
    'typography-v2': { css: true, js: true }
  };

  Object.entries(publishedPlugins).forEach(([plugin, assets]) => {
    assert.ok(fs.existsSync(dist(plugin, 'README.md')), `${plugin}/README.md should exist`);
    assert.ok(
      fs.existsSync(dist(plugin, `${plugin}-embed.html`)),
      `${plugin}/${plugin}-embed.html should exist`
    );
    if (assets.css) {
      assert.ok(fs.existsSync(dist(plugin, `${plugin}.min.css`)), `${plugin}.min.css should exist`);
    }
    if (assets.js) {
      assert.ok(fs.existsSync(dist(plugin, `${plugin}.min.js`)), `${plugin}.min.js should exist`);
    }
    assert.ok(
      fs.existsSync(dist(plugin, `${plugin}-cdn.html`)),
      `${plugin}-cdn.html should exist`
    );
  });
});

test('large inline plugins publish Carrd-safe split embeds', () => {
  for (const plugin of ['shopping-cart-v2', 'slider-v2']) {
    const pluginDir = dist(plugin);
    const manifest = fs.readFileSync(path.join(pluginDir, `${plugin}-embed.html`), 'utf8');
    const partOne = fs.readFileSync(path.join(pluginDir, `${plugin}-embed-part1.html`), 'utf8');
    const partTwo = fs.readFileSync(path.join(pluginDir, `${plugin}-embed-part2.html`), 'utf8');

    assert.match(manifest, /Split install required in Carrd/);
    assert.ok(Buffer.byteLength(partOne) < 16000, `${plugin} part 1 exceeds Carrd limit`);
    assert.ok(Buffer.byteLength(partTwo) < 16000, `${plugin} part 2 exceeds Carrd limit`);
  }
});

test('slider split embeds assemble and initialize in Carrd order', () => {
  const dom = createDom('<div class="slider">A</div><div class="slider">B</div>');
  const readScript = file => {
    const html = fs.readFileSync(dist('slider-v2', file), 'utf8');
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, `${file} should contain a script`);
    return match[1];
  };

  dom.window.eval(readScript('slider-v2-embed-part1.html'));
  assert.equal(dom.window.CarrdSliderV2, undefined);
  dom.window.eval(readScript('slider-v2-embed-part2.html'));
  triggerDomReady(dom);

  assert.ok(dom.window.CarrdSliderV2);
  assert.equal(dom.window.document.querySelectorAll('.theme-slider-wrapper').length, 1);
});

test('per-plugin CDN snippets point to standalone jsDelivr assets', () => {
  const publishedPlugins = {
    'accordeon-v2': { css: true, js: true },
    'cards-v2': { css: true, js: true },
    'cookie-banner-v2': { css: true, js: true },
    'faq-v2': { css: true, js: true },
    'floating-cta-v2': { css: true, js: true },
    'grid-cluster-v2': { css: true, js: true },
    'header-nav-v2': { css: true, js: true },
    'modal-v2': { css: true, js: true },
    'no-loadwaiting-v2': { css: false, js: true, jsPlacement: 'head' },
    'shopping-cart-v2': { css: true, js: true },
    'slider-v2': { css: true, js: true },
    'switcher-v2': { css: true, js: true },
    'typography-v2': { css: true, js: true }
  };

  Object.entries(publishedPlugins).forEach(([plugin, assets]) => {
    const pluginBase = `https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/${plugin}`;
    const cdn = fs.readFileSync(dist(plugin, `${plugin}-cdn.html`), 'utf-8');

    if (assets.css) {
      assert.ok(cdn.includes(`href="${pluginBase}/${plugin}.min.css"`));
      assert.ok(cdn.includes('<!-- Head -->'));
    }

    if (assets.js) {
      assert.ok(cdn.includes(`src="${pluginBase}/${plugin}.min.js"`));
      const placementLabel = assets.jsPlacement === 'head' ? '<!-- Head -->' : '<!-- Body End -->';
      assert.ok(cdn.includes(placementLabel));
    }
    assert.ok(!cdn.includes('theme-core-v2.min.js'));
    assert.ok(!cdn.includes('theme-core-v2.min.css'));
  });
});

test('header-nav CDN snippet includes no-flash critical CSS in Head', () => {
  const cdn = fs.readFileSync(dist('header-nav-v2', 'header-nav-v2-cdn.html'), 'utf-8');

  assert.ok(cdn.includes('<!-- Head -->'));
  assert.ok(cdn.includes('<style>'));
  assert.ok(
    cdn.includes(
      '#header:not(.is-nav-open) .header-mobile-el-collapsing'
    )
  );
  assert.ok(cdn.indexOf('<style>') < cdn.indexOf('header-nav-v2.min.css'));
});

test('header-nav toggle is stacked above floating CTA by default', () => {
  const headerCss = fs.readFileSync(dist('header-nav-v2', 'header-nav-v2.min.css'), 'utf-8');
  const floatingCss = fs.readFileSync(dist('floating-cta-v2', 'floating-cta-v2.min.css'), 'utf-8');

  assert.ok(headerCss.includes('z-index:var(--theme-header-nav-toggle-z-index,100000)'));
  assert.ok(floatingCss.includes('z-index:var(--theme-floating-cta-z-index,99999)'));
});

test('each published standalone plugin dist contains only its own namespace', () => {
  const namespaceMap = {
    'accordeon-v2': { must: ['CarrdAccordeonV2', 'theme-accordeon'], mustNot: ['theme-switcher', 'theme-faq'] },
    'cards-v2': { must: ['theme-card-item'], mustNot: ['theme-grid', 'theme-faq', 'CarrdSliderV2'] },
    'grid-cluster-v2': { must: ['theme-grid'], mustNot: ['theme-card-item', 'theme-columns-grid'] },
    'cookie-banner-v2': { must: ['theme-cookie-banner'], mustNot: ['theme-grid', 'theme-card-item'] },
    'faq-v2': { must: ['theme-faq'], mustNot: ['theme-grid', 'theme-card-item', 'CarrdSliderV2'] },
    'floating-cta-v2': { must: ['theme-floating-cta'], mustNot: ['theme-header-nav', 'theme-shopcart'] },
    'header-nav-v2': { must: ['theme-header-nav'], mustNot: ['theme-grid', 'theme-card-item'] },
    'slider-v2': { must: ['CarrdSliderV2', 'theme-slider'], mustNot: ['theme-faq', 'theme-card-item'] },
    'modal-v2': { must: ['CarrdModalV2', 'theme-modal'], mustNot: ['CarrdSliderV2', 'theme-faq'] },
    'no-loadwaiting-v2': { must: ['early-animate-override failed:'], mustNot: ['CarrdSliderV2', 'theme-faq'] },
    'shopping-cart-v2': { must: ['CarrdShoppingCartV2', 'theme-shopcart'], mustNot: ['CarrdSliderV2', 'theme-faq'] },
    'switcher-v2': { must: ['CarrdSwitcherV2', 'theme-switcher'], mustNot: ['CarrdSliderV2', 'theme-faq'] },
    'typography-v2': { must: ['CarrdTypographyV2', 'theme-typography'], mustNot: ['CarrdSliderV2', 'theme-faq'] },
  };

  Object.entries(namespaceMap).forEach(([plugin, { must, mustNot }]) => {
    const jsPath = dist(plugin, `${plugin}.min.js`);
    assert.ok(fs.existsSync(jsPath), `${plugin}.min.js should exist`);
    const js = fs.readFileSync(jsPath, 'utf-8');

    must.forEach(marker => {
      assert.ok(js.includes(marker), `${plugin}.min.js should contain "${marker}"`);
    });

    mustNot.forEach(marker => {
      assert.ok(!js.includes(marker), `${plugin}.min.js should NOT contain "${marker}"`);
    });
  });
});

test('excluded dist outputs are not published', () => {
  assert.ok(!fs.existsSync(dist('columns')), 'dist/columns should not be published');
  assert.ok(!fs.existsSync(dist('custom-themes')), 'dist/custom-themes should not be published');
  assert.ok(!fs.existsSync(dist('theme-config.js')), 'dist/theme-config.js should not be published');
});

test('theme-core-v2 CDN bundle includes shared config and selected plugin namespaces', () => {
  const jsPath = dist('theme-core-v2.min.js');
  const cssPath = dist('theme-core-v2.min.css');

  assert.ok(fs.existsSync(jsPath), 'theme-core-v2.min.js should exist');
  assert.ok(fs.existsSync(cssPath), 'theme-core-v2.min.css should exist');

  const js = fs.readFileSync(jsPath, 'utf-8');
  const css = fs.readFileSync(cssPath, 'utf-8');

  [
    'window.CarrdPluginOptionsV2',
    'CarrdAccordeonV2',
    'CarrdSliderV2',
    'CarrdModalV2',
    'CarrdTypographyV2',
    'CarrdSwitcherV2',
    'theme-header-nav',
    'theme-floating-cta'
  ].forEach(marker => {
    assert.ok(js.includes(marker), `theme-core-v2.min.js should contain "${marker}"`);
  });

  [
    '--theme-color-primary',
    '.theme-accordeon-toggle',
    '.theme-slider-nav',
    '.theme-faq-question',
    '.theme-card-item',
    '.theme-header-nav-toggle',
    '.theme-switcher-button'
  ].forEach(marker => {
    assert.ok(css.includes(marker), `theme-core-v2.min.css should contain "${marker}"`);
  });
});

test('theme-core-v2 CDN bundle initializes v2 data contracts by default', () => {
  const dom = createDom(
    '<a id="acc" href="#data-accordeon-v2-ppf" role="button">Toggle</a>' +
    '<div data-accordeon-v2="ppf">Panel</div>' +
    '<div data-cards-v2><div class="wrapper"><div class="inner"><div>A</div><div>B</div></div></div></div>' +
    '<div data-faq-v2="main"><hr class="divider-component"><h2>Q1</h2><p>A1</p><hr class="divider-component"></div>' +
    '<button data-modal-v2-open="contact">Open modal</button>' +
    '<div data-modal-v2="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>' +
    '<div data-slider-v2="gallery">Slide 1</div><div data-slider-v2="gallery">Slide 2</div>'
  );
  const timers = useFakeTimers(dom);
  mockViewport(dom, 1280);
  mockResizeObserver(dom);
  mockMutationObserver(dom);
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  loadScript(dom, 'dist/theme-core-v2.min.js');
  triggerDomReady(dom);
  timers.flush();

  const doc = dom.window.document;
  assert.equal(doc.querySelector('[data-accordeon-v2="ppf"]').hidden, true);
  click(dom, doc.getElementById('acc'));
  timers.flush();
  assert.equal(doc.querySelector('[data-accordeon-v2="ppf"]').hidden, false);
  assert.equal(doc.querySelectorAll('.theme-card-item').length, 2);
  assert.equal(doc.querySelectorAll('.theme-faq-question').length, 1);
  assert.equal(doc.querySelectorAll('.theme-slider-wrapper').length, 1);
  assert.equal(doc.querySelector('[data-modal-v2="contact"]').dataset.modalInitialized, 'true');

  timers.restore();
});

test('published dist scripts execute in a jsdom smoke harness', () => {
  const fixtures = {
    'accordeon-v2':
      '<a href="#accordeon-ppf" role="button">Toggle</a><div data-accordeon-v2="ppf">Panel</div>',
    'cards-v2':
      '<div class="cards"><div class="wrapper"><div class="inner"><div>A</div><div>B</div></div></div></div>',
    'cookie-banner-v2':
      '<div data-cookie-v2="banner"><a role="button">Accept</a></div>',
    'faq-v2':
      '<div class="FAQContainer">' +
        '<hr class="divider-component"><h2>Q1</h2><p>A1</p>' +
        '<hr class="divider-component">' +
      '</div>',
    'floating-cta-v2':
      '<div><ul id="site-header-cta" class="buttons-component"><li><a href="#contact">CTA</a></li></ul></div><div id="contact"></div>',
    'grid-cluster-v2':
      '<div class="grid-2">A</div><div class="grid-2">B</div>',
    'header-nav-v2':
      '<header id="header"><div class="container-component"><div class="wrapper"><div class="inner"><div>Brand</div><div class="header-mobile-el-collapsing"><a href="#a">A</a></div></div></div></div></header>',
    'modal-v2':
      '<div id="modalSmoke" class="container-component modal"><div class="wrapper"><div class="inner">Modal</div></div></div>',
    'no-loadwaiting-v2': '<div id="loader"></div>',
    'shopping-cart-v2': '<div></div>',
    'slider-v2': '<div class="slider">Slide 1</div>',
    'switcher-v2':
      '<section><ul data-switcher-v2="switcher"><li><a href="#" role="button">One</a></li><li><a href="#" role="button">Two</a></li></ul><p class="switcher-1">One</p><p class="switcher-2">Two</p></section>',
    'typography-v2': '<div class="txt"><span class="p"># Title</span></div>'
  };

  Object.entries(fixtures).forEach(([plugin, html]) => {
    const dom = createDom(html);
    const timers = useFakeTimers(dom);
    mockViewport(dom, 1280);
    mockResizeObserver(dom);
    mockMutationObserver(dom);
    dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

    const runtimeErrors = [];
    dom.window.addEventListener('error', event => {
      runtimeErrors.push(event.error || event.message);
    });

    assert.doesNotThrow(() => {
      loadScript(dom, `dist/${plugin}/${plugin}.min.js`);
      triggerDomReady(dom);
      timers.flush();
    }, `${plugin}.min.js should execute without throwing`);

    timers.restore();
    assert.equal(runtimeErrors.length, 0, `${plugin}.min.js should not emit runtime errors`);
  });
});
