const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const coreModule = import('../scripts/local-plugin-lab/core.mjs');
const matrixModule = import('../scripts/local-plugin-lab/matrix.mjs');
const contractPath = path.join(__dirname, '../cardbuilder/projects/main-template/data/scenarios/plugin-matrix-contract.json');

test('transformHtml changes only selected data attributes and localizes repo CDN', async () => {
  const { transformHtml } = await coreModule;
  const source = '<html><head><script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@abc/dist/x/x.min.js"></script></head><body><div id="x" data-slider="main"></div></body></html>';
  const result = transformHtml(source, { id: 'slider-case', mutations: [{ selector: '#x', attribute: 'data-slider-gap', value: 12 }] });
  assert.match(result.html, /src="\/dist\/x\/x\.min\.js"/);
  assert.match(result.html, /data-slider-gap="12"/);
  assert.deepEqual(result.readback[0], { selector: '#x', attribute: 'data-slider-gap', before: null, after: '12' });
});

test('validateScenario rejects non-data mutation', async () => {
  const { validateScenario } = await coreModule;
  assert.throws(() => validateScenario({ id: 'bad-case', mutations: [{ selector: '#x', attribute: 'class', value: 'bad' }] }), /only data-\*/);
});

test('transformHtml enforces expected selector count', async () => {
  const { transformHtml } = await coreModule;
  assert.throws(() => transformHtml('<div id="x"></div>', { id: 'count-case', mutations: [{ selector: '.missing', attribute: 'data-x', value: '1' }] }), /matched 0, expected 1/);
});

test('selectScenarios rejects unknown ids', async () => {
  const { selectScenarios } = await coreModule;
  assert.throws(() => selectScenarios({ scenarios: [{ id: 'known-case' }] }, ['missing-case']), /Unknown scenarios/);
});

test('matrix generator creates a deterministic, unique 320-scenario first wave', async () => {
  const { generateMatrix } = await matrixModule;
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  const first = generateMatrix(contract);
  const second = generateMatrix(contract);
  assert.equal(first.length, 320);
  assert.deepEqual(first.map(item => item.id), second.map(item => item.id));
  assert.equal(new Set(first.map(item => item.id)).size, first.length);
  assert.ok(first.every(item => item.assertions.length >= item.mutations.length));
});

test('matrix first wave covers every declared plugin and all value classes', async () => {
  const { generateMatrix, summarizeMatrix } = await matrixModule;
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  const summary = summarizeMatrix(generateMatrix(contract));
  assert.deepEqual(Object.keys(summary.plugins).sort(), contract.plugins.map(item => item.id).sort());
  assert.ok(summary.single > 0 && summary.pairwise > 0);
  assert.ok(summary.valid > 0 && summary.boundary > 0 && summary.invalid > 0);
});
