const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createDom,
  loadScript,
  triggerDomReady,
  mockViewport,
  mockResizeObserver,
  mockMutationObserver,
  useFakeTimers
} = require('./helpers');

const dist = (...parts) => path.resolve(__dirname, '..', 'dist', ...parts);

test('required dist artifacts exist for every published plugin (embed-only contract)', () => {
  const topLevelFiles = [
    'README.md',
    'CHANGELOG.md',
    'theme-design-system.html',
    'theme-design-tokens.css',
    'theme-design-tokens-embed.html',
    'theme-ui.css',
    'theme-ui-embed.html'
  ];

  topLevelFiles.forEach(file => {
    assert.ok(fs.existsSync(dist(file)), `${file} should exist in dist/`);
  });

  const forbiddenTopLevelFiles = [
    'theme-runtime.min.css',
    'theme-runtime.min.js',
    'theme-runtime-cdn.html',
    'theme-core.min.css',
    'theme-core.min.js',
    'theme-core-cdn.html',
    'theme-ui-runtime.css'
  ];

  forbiddenTopLevelFiles.forEach(file => {
    assert.ok(!fs.existsSync(dist(file)), `${file} must not be published (embed-only distribution)`);
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
      !fs.existsSync(dist(plugin, `${plugin}-cdn.html`)),
      `${plugin}-cdn.html must not be published (embed-only distribution)`
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

test('header-nav embed includes no-flash critical CSS ahead of script', () => {
  const embed = fs.readFileSync(dist('header-nav', 'header-nav-embed.html'), 'utf-8');

  assert.ok(embed.includes('<style>'));
  assert.ok(
    embed.includes(
      '#header:not(.is-nav-open) :is(.header-mobile-hide,.header-mobile-el-collapsing)'
    )
  );
  assert.ok(embed.indexOf('<style>') < embed.indexOf('<script>'));
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

test('README documents the single inline-embed install path', () => {
  const readme = fs.readFileSync(path.resolve(__dirname, '..', 'README.md'), 'utf-8');
  assert.ok(readme.includes('theme-design-system.html'));
  assert.ok(!readme.includes('cdn.jsdelivr.net'), 'README must not reference jsDelivr/CDN delivery');
});

test('no dist artifact references jsDelivr CDN', () => {
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(walk(full));
      } else {
        files.push(full);
      }
    }
    return files;
  };

  const htmlFiles = walk(dist()).filter(file => file.endsWith('.html'));
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    assert.ok(!content.includes('cdn.jsdelivr.net'), `${file} must not reference jsDelivr CDN`);
  });
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
      '<header id="header"><div class="container-component"><div class="wrapper"><div class="inner"><div>Brand</div><div class="header-mobile-hide"><a href="#a">A</a></div></div></div></div></header>',
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
