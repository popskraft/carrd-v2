import { JSDOM } from 'jsdom';

const DATA_ATTRIBUTE = /^data-[a-z0-9_-]+$/;

export function validateScenario(scenario) {
  if (!scenario || typeof scenario !== 'object') throw new Error('Scenario must be an object');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(scenario.id || '')) throw new Error('Scenario id must be kebab-case');
  for (const mutation of scenario.mutations || []) {
    if (!mutation.selector) throw new Error(`${scenario.id}: mutation selector is required`);
    if (!DATA_ATTRIBUTE.test(mutation.attribute || '')) {
      throw new Error(`${scenario.id}: only data-* attributes may be mutated`);
    }
    if (!['set', 'remove'].includes(mutation.operation || 'set')) {
      throw new Error(`${scenario.id}: unsupported mutation operation`);
    }
  }
  return scenario;
}

export function transformHtml(source, scenario, localAssetPrefix = '/dist') {
  validateScenario(scenario);
  const dom = new JSDOM(source);
  const { document } = dom.window;
  const readback = [];

  const base = document.createElement('base');
  base.href = '/';
  document.head.prepend(base);

  for (const fixture of scenario.fixtures || []) {
    const target = document.querySelector(fixture.selector);
    if (!target) throw new Error(`${scenario.id}: fixture target not found: ${fixture.selector}`);
    target.insertAdjacentHTML(fixture.position || 'beforeend', fixture.html);
  }

  for (const mutation of scenario.mutations || []) {
    const nodes = [...document.querySelectorAll(mutation.selector)];
    const expected = mutation.expectedMatches ?? 1;
    if (nodes.length !== expected) {
      throw new Error(`${scenario.id}: ${mutation.selector} matched ${nodes.length}, expected ${expected}`);
    }
    for (const node of nodes) {
      const before = node.getAttribute(mutation.attribute);
      if ((mutation.operation || 'set') === 'remove') node.removeAttribute(mutation.attribute);
      else node.setAttribute(mutation.attribute, String(mutation.value ?? ''));
      readback.push({ selector: mutation.selector, attribute: mutation.attribute, before, after: node.getAttribute(mutation.attribute) });
    }
  }

  for (const script of document.querySelectorAll('script[src]')) {
    const src = script.getAttribute('src') || '';
    const match = src.match(/^https:\/\/cdn\.jsdelivr\.net\/gh\/popskraft\/carrd-v2@[^/]+\/dist\/(.+)$/);
    if (match) script.setAttribute('src', `${localAssetPrefix}/${match[1]}`);
  }

  if (scenario.pluginOptions) {
    const options = document.createElement('script');
    options.setAttribute('data-local-plugin-lab', 'options');
    options.textContent = `window.CarrdPluginOptions=Object.assign({},window.CarrdPluginOptions||{},${JSON.stringify(scenario.pluginOptions)});`;
    document.head.prepend(options);
  }

  return { html: dom.serialize(), readback };
}

export function selectScenarios(manifest, ids = []) {
  const scenarios = (manifest.scenarios || []).map(validateScenario);
  if (!ids.length) return scenarios;
  const selected = scenarios.filter(item => ids.includes(item.id));
  const missing = ids.filter(id => !selected.some(item => item.id === id));
  if (missing.length) throw new Error(`Unknown scenarios: ${missing.join(', ')}`);
  return selected;
}
