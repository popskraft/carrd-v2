const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.resolve(__dirname, '..', 'src');
const TOKENS_FILE = path.join(SRC, 'theme-design-tokens.css');
const COMPAT_FILE = path.join(SRC, 'theme-compat.css');
const UI_FILE = path.join(SRC, 'theme-ui.css');
const LEGACY_MINI_PREFIX = ['--', 'mini-'].join('');
const LEGACY_TOKEN_DENYLIST = [
  '--theme-color-primary-dark',
  '--theme-color-primary-light',
  '--theme-color-headlines',
  '--theme-color-bg',
  '--theme-color-danger',
  '--theme-color-success',
  '--theme-btn-primary-bg',
  '--theme-btn-primary-hover-bg',
  '--theme-btn-text',
  '--theme-link-hover-color',
];

const CORE_PREFIXES = [
  '--theme-color-',
  '--theme-focus-',
  '--theme-overlay-',
  '--theme-font-',
  '--theme-line-height-',
  '--theme-button-',
  '--theme-link-',
  '--theme-nav-',
  '--theme-ui-',
];

const PLUGIN_PREFIXES = {
  accordeon: ['--theme-accordeon-'],
  cards: ['--theme-card-'],
  faq: ['--theme-faq-'],
  'floating-cta': ['--theme-floating-cta-'],
  'grid-cluster': ['--theme-grid-'],
  'header-nav': ['--theme-header-nav-'],
  modal: ['--theme-modal-'],
  'shopping-cart': ['--theme-shopcart-'],
  slider: ['--theme-slider-'],
  stacker: ['--theme-stacker-'],
  switcher: ['--theme-switcher-'],
  typography: ['--theme-typography-'],
};

const RUNTIME_INJECTED_TOKENS = {
  'grid-cluster': new Set(['--theme-grid-desktop-template']),
};

const COMPAT_MAPPINGS = {
  '--theme-color-primary-focus': 'var(--theme-color-primary-hover)',
  '--theme-color-dark': 'var(--theme-color-primary-dark, #222222)',
  '--theme-color-heading': 'var(--theme-color-headlines, var(--theme-color-primary-dark, #222222))',
  '--theme-color-surface': 'var(--theme-color-bg, #FFFFFF)',
  '--theme-color-surface-muted': 'var(--theme-card-bg-default, var(--theme-color-primary-light, #F8F8F8))',
  '--theme-focus-ring-color': 'var(--theme-color-primary-focus, var(--theme-color-primary-hover, #AD3624))',
  '--theme-button-primary-bg': 'var(--theme-btn-primary-bg, var(--theme-color-primary, #EF4444))',
  '--theme-button-primary-bg-hover': 'var(--theme-btn-primary-hover-bg, var(--theme-color-primary-hover, #AD3624))',
  '--theme-button-primary-text': 'var(--theme-btn-text, #FFFFFF)',
  '--theme-link-color-hover': 'var(--theme-link-hover-color, var(--theme-color-primary-hover, #AD3624))',
  '--theme-nav-color': 'var(--theme-color-headlines, var(--theme-color-primary-dark, #222222))',
  '--theme-color-success': 'var(--theme-color-brand-green, #10B981)',
  '--theme-shopcart-danger': 'var(--theme-color-danger, var(--theme-color-brand-red, #EF4444))',
};

function read(file) {
  return fs.readFileSync(file, 'utf-8');
}

function getPluginCssFiles() {
  return fs.readdirSync(SRC, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => ({
      plugin: entry.name,
      path: path.join(SRC, entry.name, `${entry.name}.css`),
    }))
    .filter(entry => fs.existsSync(entry.path));
}

function extractVarRefs(content) {
  return new Set([...content.matchAll(/var\(\s*(--theme-[\w-]+)/g)].map(match => match[1]));
}

function extractDefinitions(content) {
  return new Set([...content.matchAll(/(--theme-[\w-]+)\s*:/g)].map(match => match[1]));
}

function extractDeclarations(content) {
  return new Map([...content.matchAll(/(--theme-[\w-]+)\s*:\s*([^;]+);/g)]
    .map(match => [match[1], match[2].trim()]));
}

function isCoreToken(token) {
  return CORE_PREFIXES.some(prefix => token.startsWith(prefix));
}

test('global token layer defines only shared core namespaces', () => {
  const violations = [...extractDefinitions(read(TOKENS_FILE))]
    .filter(token => !isCoreToken(token));
  assert.deepEqual(violations, [], `Plugin tokens leaked into theme-design-tokens.css:\n${violations.join('\n')}`);
});

test('plugin token references resolve to their local owner or the global layer', () => {
  const globalDefinitions = extractDefinitions(read(TOKENS_FILE));
  const missing = [];
  const foreign = [];

  getPluginCssFiles().forEach(({ plugin, path: cssPath }) => {
    const content = read(cssPath);
    const localDefinitions = extractDefinitions(content);
    const allowedPrefixes = PLUGIN_PREFIXES[plugin] || [];
    const injected = RUNTIME_INJECTED_TOKENS[plugin] || new Set();

    extractVarRefs(content).forEach(token => {
      if (isCoreToken(token)) {
        if (!globalDefinitions.has(token)) missing.push(`${plugin}: ${token}`);
        return;
      }

      const belongsToPlugin = allowedPrefixes.some(prefix => token.startsWith(prefix));
      if (!belongsToPlugin) {
        foreign.push(`${plugin}: ${token}`);
      } else if (!localDefinitions.has(token) && !injected.has(token)) {
        missing.push(`${plugin}: ${token}`);
      }
    });
  });

  extractVarRefs(read(UI_FILE)).forEach(token => {
    if (!globalDefinitions.has(token)) missing.push(`theme-ui: ${token}`);
  });

  assert.deepEqual(foreign, [], `Foreign plugin token references:\n${foreign.join('\n')}`);
  assert.deepEqual(missing, [], `Token references without canonical owners:\n${missing.join('\n')}`);
});

test('each plugin defines only its own tokens in a low-specificity defaults block', () => {
  const violations = [];

  getPluginCssFiles().forEach(({ plugin, path: cssPath }) => {
    const content = read(cssPath);
    const definitions = extractDefinitions(content);
    if (definitions.size === 0) return;

    const allowedPrefixes = PLUGIN_PREFIXES[plugin] || [];
    const defaultsBlock = content.match(/^\s*:where\(:root\)\s*\{([\s\S]*?)\}/);
    if (!defaultsBlock) {
      violations.push(`${plugin}: missing leading :where(:root) defaults block`);
      return;
    }

    const blockDefinitions = extractDefinitions(defaultsBlock[1]);
    definitions.forEach(token => {
      if (!allowedPrefixes.some(prefix => token.startsWith(prefix))) {
        violations.push(`${plugin}: foreign definition ${token}`);
      }
      if (!blockDefinitions.has(token)) {
        violations.push(`${plugin}: ${token} is outside the defaults block`);
      }
    });
  });

  assert.deepEqual(violations, [], violations.join('\n'));
});

test('active CSS uses mandatory theme tokens without fallback arguments', () => {
  const files = [TOKENS_FILE, UI_FILE, ...getPluginCssFiles().map(entry => entry.path)];
  const violations = [];

  files.forEach(file => {
    const content = read(file);
    for (const match of content.matchAll(/var\(\s*(--theme-[\w-]+)\s*,/g)) {
      violations.push(`${path.relative(SRC, file)}: ${match[1]}`);
    }
  });

  assert.deepEqual(violations, [], `Theme-token fallbacks remain in active CSS:\n${violations.join('\n')}`);
});

test('theme-ui remains global-only and contains no plugin selectors or token definitions', () => {
  const content = read(UI_FILE);
  assert.equal(extractDefinitions(content).size, 0, 'theme-ui.css should not define tokens');

  Object.keys(PLUGIN_PREFIXES).forEach(plugin => {
    const classPrefix = `.theme-${plugin === 'shopping-cart' ? 'shopcart' : plugin}`;
    assert.ok(!content.includes(classPrefix), `theme-ui.css should not own ${classPrefix} selectors`);
  });
});

test('legacy token names are isolated to the compatibility bridge', () => {
  const activeFiles = [TOKENS_FILE, UI_FILE, ...getPluginCssFiles().map(entry => entry.path)];
  const violations = [];

  LEGACY_TOKEN_DENYLIST.forEach(token => {
    activeFiles.forEach(file => {
      if (read(file).includes(token)) violations.push(`${path.relative(SRC, file)}: ${token}`);
    });
  });

  assert.deepEqual(violations, [], `Legacy tokens leaked into canonical source:\n${violations.join('\n')}`);
});

test('compatibility bridge preserves every approved mapping exactly', () => {
  const actual = extractDeclarations(read(COMPAT_FILE));
  assert.deepEqual(Object.fromEntries(actual), COMPAT_MAPPINGS);
});

test('no legacy mini token prefix exists in plugin CSS or JS', () => {
  const violations = [];

  fs.readdirSync(SRC, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .forEach(entry => {
      ['css', 'js'].forEach(extension => {
        const file = path.join(SRC, entry.name, `${entry.name}.${extension}`);
        if (fs.existsSync(file) && read(file).includes(LEGACY_MINI_PREFIX)) {
          violations.push(path.relative(SRC, file));
        }
      });
    });

  assert.deepEqual(violations, [], `Legacy mini tokens found:\n${violations.join('\n')}`);
});

test('semantic link tokens have consumers and palette primitives remain public authoring API', () => {
  const ui = read(UI_FILE);
  const tokens = read(TOKENS_FILE);
  assert.ok(ui.includes('var(--theme-link-color)'), 'theme-link-color should be consumed');
  assert.ok(ui.includes('var(--theme-link-color-hover)'), 'theme-link-color-hover should be consumed');
  assert.ok(tokens.includes('/* 1. Named colors */'), 'named colors should remain an explicit public palette');
});
