const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

/*
 * Design token consistency tests:
 * 1. All var(--theme-color-*) and var(--theme-ui-*) refs in plugin CSS
 *    must have a definition in theme-design-tokens.css.
 * 2. No legacy mini token prefixes anywhere (covered by check_legacy_consistency.sh,
 *    but verified here structurally).
 * 3. Each plugin CSS uses --theme-<plugin>-* namespace for its own variables.
 */

const SRC = path.resolve(__dirname, '..', 'src');
const TOKENS_FILE = path.join(SRC, 'theme-design-tokens.css');
const UI_FILE = path.join(SRC, 'theme-ui.css');
const LEGACY_MINI_PREFIX = ['--', 'mini-'].join('');

function getDefinedTokens() {
  const tokens = new Set();
  [TOKENS_FILE, UI_FILE].forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Match property definitions: --theme-something: value
    const re = /--(theme-[\w-]+)\s*:/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      tokens.add('--' + m[1]);
    }
  });
  return tokens;
}

function getPluginCssFiles() {
  const dirs = fs.readdirSync(SRC, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const files = [];
  dirs.forEach(dir => {
    const cssPath = path.join(SRC, dir, `${dir}.css`);
    if (fs.existsSync(cssPath)) {
      files.push({ plugin: dir, path: cssPath });
    }
  });
  return files;
}

function extractVarRefs(cssContent) {
  const refs = new Set();
  const re = /var\(\s*(--(theme-[\w-]+))/g;
  let m;
  while ((m = re.exec(cssContent)) !== null) {
    refs.add(m[1]);
  }
  return refs;
}

function extractLocalDefs(cssContent) {
  const defs = new Set();
  const re = /--(theme-[\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(cssContent)) !== null) {
    defs.add('--' + m[1]);
  }
  return defs;
}

// Core-level tokens that plugins reference via var() and must be defined centrally
const CORE_PREFIXES = ['--theme-color-', '--theme-ui-', '--theme-overlay-'];

test('all var(--theme-color-*) and var(--theme-ui-*) refs resolve to design-tokens', () => {
  const definedTokens = getDefinedTokens();
  const pluginFiles = getPluginCssFiles();
  const missing = [];

  pluginFiles.forEach(({ plugin, path: cssPath }) => {
    const content = fs.readFileSync(cssPath, 'utf-8');
    const refs = extractVarRefs(content);
    const localDefs = extractLocalDefs(content);

    refs.forEach(ref => {
      const isCore = CORE_PREFIXES.some(prefix => ref.startsWith(prefix));
      if (isCore && !definedTokens.has(ref) && !localDefs.has(ref)) {
        missing.push(`${plugin}: ${ref}`);
      }
    });
  });

  assert.equal(missing.length, 0,
    `Core token refs without definition in design-tokens:\n  ${missing.join('\n  ')}`);
});

test('no legacy mini token prefix in any plugin CSS', () => {
  const pluginFiles = getPluginCssFiles();
  const violations = [];

  pluginFiles.forEach(({ plugin, path: cssPath }) => {
    const content = fs.readFileSync(cssPath, 'utf-8');
    if (content.includes(LEGACY_MINI_PREFIX)) {
      violations.push(plugin);
    }
  });

  assert.equal(violations.length, 0,
    `Plugins using legacy mini token prefix: ${violations.join(', ')}`);
});

test('no legacy mini token prefix in any plugin JS', () => {
  const dirs = fs.readdirSync(SRC, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const violations = [];
  dirs.forEach(dir => {
    const jsPath = path.join(SRC, dir, `${dir}.js`);
    if (fs.existsSync(jsPath)) {
      const content = fs.readFileSync(jsPath, 'utf-8');
      if (content.includes(LEGACY_MINI_PREFIX)) {
        violations.push(dir);
      }
    }
  });

  assert.equal(violations.length, 0,
    `Plugins using legacy mini token prefix in JS: ${violations.join(', ')}`);
});

test('each plugin CSS uses its own --theme-<plugin>-* namespace', () => {
  // Expected namespace map: plugin dir -> allowed CSS variable prefixes
  const namespaceMap = {
    cards: ['--theme-card-'],
    'grid-cluster': ['--theme-grid-'],
    faq: ['--theme-faq-'],
    'floating-cta': ['--theme-floating-cta-'],
    slider: ['--theme-slider-'],
    'shopping-cart': ['--theme-shopcart-'],
    typography: ['--theme-typography-'],
    'header-nav': ['--theme-header-nav-'],
    modal: ['--theme-modal-'],
  };

  const pluginFiles = getPluginCssFiles();
  const violations = [];

  pluginFiles.forEach(({ plugin, path: cssPath }) => {
    if (!namespaceMap[plugin]) return; // skip cookie-banner (no theme vars)
    const allowedPrefixes = namespaceMap[plugin];
    const content = fs.readFileSync(cssPath, 'utf-8');
    const localDefs = extractLocalDefs(content);

    localDefs.forEach(def => {
      // Skip core-level tokens (--theme-color-*, etc)
      const isCore = CORE_PREFIXES.some(prefix => def.startsWith(prefix));
      if (isCore) return;

      // Skip private/local vars like --grid-columns, --local-*
      if (!def.startsWith('--theme-')) return;

      const allowed = allowedPrefixes.some(prefix => def.startsWith(prefix));
      if (!allowed) {
        violations.push(`${plugin}: ${def} (expected prefix: ${allowedPrefixes.join(' or ')})`);
      }
    });
  });

  assert.equal(violations.length, 0,
    `Namespace violations:\n  ${violations.join('\n  ')}`);
});
