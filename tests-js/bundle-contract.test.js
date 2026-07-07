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
const VERSION = fs.readFileSync(path.resolve(__dirname, '..', 'VERSION'), 'utf-8').trim();

test('required dist artifacts exist for every published plugin', () => {
  const topLevelFiles = [
    'README.md',
    'CHANGELOG.md',
    'theme-design-system.html',
    'theme-design-tokens.css',
    'theme-design-tokens-embed.html',
    'theme-ui.css',
    'theme-ui-runtime.css',
    'theme-runtime.min.css',
    'theme-runtime.min.js',
    'theme-core.min.css',
    'theme-core.min.js'
  ];

  topLevelFiles.forEach(file => {
    assert.ok(fs.existsSync(dist(file)), `${file} should exist in dist/`);
  });

  const publishedPlugins = {
    'accordeon': { css: true, js: true },
    'cards': { css: true, js: true },
    'cookie-banner': { css: true, js: true },
    'faq': { css: true, js: true },
    'floating-cta': { css: true, js: true },
    'grid-cluster': { css: true, js: true },
    'header-nav': { css: true, js: true },
    'modal': { css: true, js: true },
    'no-loadwaiting': { css: false, js: true, jsPlacement: 'head' },
    'shopping-cart': { css: true, js: true },
    'slider': { css: true, js: true },
    'switcher': { css: true, js: true },
    'typography': { css: true, js: true }
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
  for (const plugin of ['shopping-cart', 'slider']) {
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
  const dom = createDom('<div data-slider>A</div><div data-slider>B</div>');
  const readScript = file => {
    const html = fs.readFileSync(dist('slider', file), 'utf8');
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(match, `${file} should contain a script`);
    return match[1];
  };

  dom.window.eval(readScript('slider-embed-part1.html'));
  assert.equal(dom.window.CarrdSlider, undefined);
  dom.window.eval(readScript('slider-embed-part2.html'));
  triggerDomReady(dom);

  assert.ok(dom.window.CarrdSlider);
  assert.equal(dom.window.document.querySelectorAll('.theme-slider-wrapper').length, 1);
});

test('per-plugin CDN snippets point to standalone jsDelivr assets', () => {
  const publishedPlugins = {
    'accordeon': { css: true, js: true },
    'cards': { css: true, js: true },
    'cookie-banner': { css: true, js: true },
    'faq': { css: true, js: true },
    'floating-cta': { css: true, js: true },
    'grid-cluster': { css: true, js: true },
    'header-nav': { css: true, js: true },
    'modal': { css: true, js: true },
    'no-loadwaiting': { css: false, js: true, jsPlacement: 'head' },
    'shopping-cart': { css: true, js: true },
    'slider': { css: true, js: true },
    'switcher': { css: true, js: true },
    'typography': { css: true, js: true }
  };

  Object.entries(publishedPlugins).forEach(([plugin, assets]) => {
    const pluginBase = `https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@${VERSION}/dist/${plugin}`;
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
    assert.ok(!cdn.includes('theme-core.min.js'));
    assert.ok(!cdn.includes('theme-core.min.css'));
  });
});

test('header-nav CDN snippet includes no-flash critical CSS in Head', () => {
  const cdn = fs.readFileSync(dist('header-nav', 'header-nav-cdn.html'), 'utf-8');

  assert.ok(cdn.includes('<!-- Head -->'));
  assert.ok(cdn.includes('<style>'));
  assert.ok(
    cdn.includes(
      '#header:not(.is-nav-open) .header-mobile-el-collapsing'
    )
  );
  assert.ok(cdn.indexOf('<style>') < cdn.indexOf('header-nav.min.css'));
});

test('header-nav toggle is stacked above floating CTA by default', () => {
  const headerCss = fs.readFileSync(dist('header-nav', 'header-nav.min.css'), 'utf-8');
  const floatingCss = fs.readFileSync(dist('floating-cta', 'floating-cta.min.css'), 'utf-8');

  assert.ok(headerCss.includes('--theme-header-nav-toggle-z-index:100000'));
  assert.ok(headerCss.includes('z-index:var(--theme-header-nav-toggle-z-index)'));
  assert.ok(floatingCss.includes('--theme-floating-cta-z-index:99999'));
  assert.ok(floatingCss.includes('z-index:var(--theme-floating-cta-z-index)'));
});

test('each published standalone plugin dist contains only its own namespace', () => {
  const namespaceMap = {
    'accordeon': { must: ['CarrdAccordeon', 'theme-accordeon'], mustNot: ['theme-switcher', 'theme-faq'] },
    'cards': { must: ['theme-card-item'], mustNot: ['theme-grid', 'theme-faq', 'CarrdSlider'] },
    'grid-cluster': { must: ['theme-grid'], mustNot: ['theme-card-item', 'theme-columns-grid'] },
    'cookie-banner': { must: ['theme-cookie-banner'], mustNot: ['theme-grid', 'theme-card-item'] },
    'faq': { must: ['theme-faq'], mustNot: ['theme-grid', 'theme-card-item', 'CarrdSlider'] },
    'floating-cta': { must: ['theme-floating-cta'], mustNot: ['theme-header-nav', 'theme-shopcart'] },
    'header-nav': { must: ['theme-header-nav'], mustNot: ['theme-grid', 'theme-card-item'] },
    'slider': { must: ['CarrdSlider', 'theme-slider'], mustNot: ['theme-faq', 'theme-card-item'] },
    'modal': { must: ['CarrdModal', 'theme-modal'], mustNot: ['CarrdSlider', 'theme-faq'] },
    'no-loadwaiting': { must: ['early-animate-override failed:'], mustNot: ['CarrdSlider', 'theme-faq'] },
    'shopping-cart': { must: ['CarrdShoppingCart', 'theme-shopcart'], mustNot: ['CarrdSlider', 'theme-faq'] },
    'switcher': { must: ['CarrdSwitcher', 'theme-switcher'], mustNot: ['CarrdSlider', 'theme-faq'] },
    'typography': { must: ['CarrdTypography', 'theme-typography'], mustNot: ['CarrdSlider', 'theme-faq'] },
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

test('theme-runtime CDN bundle includes selected plugin defaults but no global or add-on token definitions', () => {
  const jsPath = dist('theme-runtime.min.js');
  const cssPath = dist('theme-runtime.min.css');

  assert.ok(fs.existsSync(jsPath), 'theme-runtime.min.js should exist');
  assert.ok(fs.existsSync(cssPath), 'theme-runtime.min.css should exist');

  const js = fs.readFileSync(jsPath, 'utf-8');
  const css = fs.readFileSync(cssPath, 'utf-8');

  [
    'window.CarrdPluginOptions',
    'CarrdAccordeon',
    'CarrdSlider',
    'CarrdModal',
    'CarrdTypography',
    'CarrdSwitcher',
    'theme-header-nav',
    'theme-floating-cta'
  ].forEach(marker => {
    assert.ok(js.includes(marker), `theme-runtime.min.js should contain "${marker}"`);
  });

  [
    '.bg-primary',
    '.theme-modal-close',
    '.theme-accordeon-toggle',
    '.theme-slider-nav',
    '.theme-faq-question',
    '.theme-card-item',
    '.theme-header-nav-toggle',
    '.theme-switcher-button'
  ].forEach(marker => {
    assert.ok(css.includes(marker), `theme-runtime.min.css should contain "${marker}"`);
  });

  const tokenDefs = [...css.matchAll(/(--theme-[\w-]+)\s*:/g)].map(match => match[1]);
  const globalPrefixes = [
    '--theme-color-', '--theme-focus-', '--theme-overlay-', '--theme-font-',
    '--theme-line-height-', '--theme-button-', '--theme-link-', '--theme-nav-', '--theme-ui-',
  ];
  assert.ok(tokenDefs.includes('--theme-accordeon-toggle-duration'));
  assert.ok(tokenDefs.includes('--theme-slider-arrow-size'));
  assert.ok(tokenDefs.includes('--theme-modal-close-size'));
  assert.ok(!tokenDefs.some(token => globalPrefixes.some(prefix => token.startsWith(prefix))), 'runtime should not define global tokens');
  assert.ok(!tokenDefs.some(token => token.startsWith('--theme-shopcart-')), 'runtime should not define add-on tokens');
});

test('theme-core compatibility bundle keeps token defaults and legacy bridge definitions', () => {
  const css = fs.readFileSync(dist('theme-core.min.css'), 'utf-8');
  assert.match(css, /:root\{[^}]*--theme-color-primary:/, 'theme-core.min.css should ship token defaults');
  assert.match(css, /--theme-color-heading:var\(--theme-color-headlines,/, 'theme-core.min.css should ship the legacy token bridge');
  assert.match(css, /--theme-slider-arrow-size:/, 'theme-core.min.css should include bundled plugin defaults');
});

test('theme-runtime CDN bundle initializes clean data contracts by default', () => {
  const dom = createDom(
    '<a id="acc" href="#data-accordeon-ppf" role="button">Toggle</a>' +
    '<div data-accordeon="ppf">Panel</div>' +
    '<div data-cards><div class="wrapper"><div class="inner"><div>A</div><div>B</div></div></div></div>' +
    '<div data-faq="main"><hr class="divider-component"><h2>Q1</h2><p>A1</p><hr class="divider-component"></div>' +
    '<button data-modal-open="contact">Open modal</button>' +
    '<div data-modal="contact" class="container-component"><div class="wrapper"><div class="inner"><h2>Contact</h2></div></div></div>' +
    '<div data-slider="gallery">Slide 1</div><div data-slider="gallery">Slide 2</div>'
  );
  const timers = useFakeTimers(dom);
  mockViewport(dom, 1280);
  mockResizeObserver(dom);
  mockMutationObserver(dom);
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

  loadScript(dom, 'dist/theme-runtime.min.js');
  triggerDomReady(dom);
  timers.flush();

  const doc = dom.window.document;
  assert.equal(doc.querySelector('[data-accordeon="ppf"]').hidden, true);
  click(dom, doc.getElementById('acc'));
  timers.flush();
  assert.equal(doc.querySelector('[data-accordeon="ppf"]').hidden, false);
  assert.equal(doc.querySelectorAll('.theme-card-item').length, 2);
  assert.equal(doc.querySelectorAll('.theme-faq-question').length, 1);
  assert.equal(doc.querySelectorAll('.theme-slider-wrapper').length, 1);
  assert.equal(doc.querySelector('[data-modal="contact"]').dataset.modalInitialized, 'true');

  timers.restore();
});

test('README recommends version-pinned runtime bundle and full token embed', () => {
  const readme = fs.readFileSync(path.resolve(__dirname, '..', 'README.md'), 'utf-8');
  assert.ok(readme.includes('dist/theme-runtime-cdn.html'));
  assert.ok(readme.includes('dist/theme-design-tokens-embed.html'));
  const mutableRuntimeCss = ['https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main', '/dist/theme-runtime.min.css'].join('');
  assert.ok(!readme.includes(mutableRuntimeCss));
});

test('main-template migration automation uses version-pinned runtime assets', () => {
  const automation = fs.readFileSync(
    path.resolve(__dirname, '..', 'cardbuilder/projects/main-template/automation/migrate-clean-runtime.mjs'),
    'utf-8'
  );
  assert.ok(automation.includes('theme-runtime.min.css'));
  assert.ok(automation.includes('theme-runtime.min.js'));
  assert.match(automation, /carrd-v2@\$\{VERSION\}\/dist\/theme-runtime\.min\.css/);
  assert.match(automation, /carrd-v2@\$\{VERSION\}\/dist\/theme-runtime\.min\.js/);
  assert.ok(!automation.includes(['@main', '/dist/theme-runtime.min.css'].join('')));
  assert.ok(!automation.includes(['@main', '/dist/theme-runtime.min.js'].join('')));
  assert.ok(!automation.includes('@main/dist/theme-core.min.css'));
  assert.ok(!automation.includes('@main/dist/theme-core.min.js'));
});

test('canonical install surfaces never reference compatibility-only theme-ui.css', () => {
  const files = [
    path.resolve(__dirname, '..', 'README.md'),
    dist('theme-runtime-cdn.html'),
    ...fs.readdirSync(dist())
      .filter(name => fs.statSync(dist(name)).isDirectory())
      .flatMap(name => {
        const directory = dist(name);
        return fs.readdirSync(directory)
          .filter(file => file.endsWith('-cdn.html'))
          .map(file => path.join(directory, file));
      }),
  ];

  files.forEach(file => {
    assert.ok(!fs.readFileSync(file, 'utf-8').includes('/dist/theme-ui.css'), `${file} should not reference compatibility theme-ui.css`);
  });
  assert.match(fs.readFileSync(dist('theme-ui.css'), 'utf-8'), /Compatibility-only artifact/);
});

test('published dist scripts execute in a jsdom smoke harness', () => {
  const fixtures = {
    'accordeon':
      '<a href="#data-accordeon-ppf" role="button">Toggle</a><div data-accordeon="ppf">Panel</div>',
    'cards':
      '<div data-cards="cards"><div class="wrapper"><div class="inner"><div>A</div><div>B</div></div></div></div>',
    'cookie-banner':
      '<div data-cookie="consent"><a role="button">Accept</a></div>',
    'faq':
      '<div data-faq="main">' +
        '<hr class="divider-component"><h2>Q1</h2><p>A1</p>' +
        '<hr class="divider-component">' +
      '</div>',
    'floating-cta':
      '<div><ul id="site-header-cta" class="buttons-component"><li><a href="#contact">CTA</a></li></ul></div><div id="contact"></div>',
    'grid-cluster':
      '<div data-grid="features">A</div><div data-grid="features">B</div>',
    'header-nav':
      '<header id="header"><div class="container-component"><div class="wrapper"><div class="inner"><div>Brand</div><div class="header-mobile-el-collapsing"><a href="#a">A</a></div></div></div></div></header>',
    'modal':
      '<div data-modal="smoke" class="container-component"><div class="wrapper"><div class="inner">Modal</div></div></div>',
    'no-loadwaiting': '<div id="loader"></div>',
    'shopping-cart': '<div></div>',
    'slider': '<div data-slider>Slide 1</div>',
    'switcher':
      '<section><ul data-switcher="switcher"><li><a href="#" role="button">One</a></li><li><a href="#" role="button">Two</a></li></ul><p class="switcher-1">One</p><p class="switcher-2">Two</p></section>',
    'typography': '<div class="txt"><span class="p"># Title</span></div>'
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
