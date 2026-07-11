import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { selectScenarios, transformHtml } from './core.mjs';
import { generateMatrix, summarizeMatrix } from './matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = path.join(root, 'carrd-source');
const manifestPath = path.join(root, 'cardbuilder/projects/main-template/data/scenarios/local-plugin-lab.json');
const artifactRoot = path.join(root, '_temp/local-plugin-lab');
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mime = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function parseArgs() {
  const args = process.argv.slice(2);
  const ids = [];
  let list = false;
  let mode = 'all';
  let workers = Math.max(1, Number.parseInt(process.env.LAB_WORKERS || '6', 10));
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--scenario') ids.push(...String(args[++i] || '').split(',').filter(Boolean));
    else if (args[i] === '--list') list = true;
    else if (args[i] === '--base-only') mode = 'base';
    else if (args[i] === '--matrix-only') mode = 'matrix';
    else if (args[i] === '--workers') workers = Math.max(1, Number.parseInt(args[++i] || '1', 10));
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  return { ids, list, mode, workers };
}

async function loadChromium() {
  try {
    return (await import('playwright-core')).chromium;
  } catch (error) {
    const bundled = path.join(root, 'cardbuilder/projects/faktura/automation/node_modules/playwright-core/index.mjs');
    try { return (await import(`file://${bundled}`)).chromium; }
    catch { throw new Error(`playwright-core is unavailable. Run pnpm install in cardbuilder/projects/faktura/automation. Original error: ${error.message}`); }
  }
}

function safeFile(base, relative) {
  const resolved = path.resolve(base, relative);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) throw new Error('Unsafe path');
  return resolved;
}

async function serveFile(response, base, relative) {
  try {
    const filename = safeFile(base, relative);
    response.writeHead(200, { 'content-type': mime[path.extname(filename)] || 'application/octet-stream' });
    response.end(await readFile(filename));
  } catch {
    response.writeHead(404).end('Not found');
  }
}

function startServer(htmlById) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname.startsWith('/assets/')) return serveFile(response, path.join(sourceRoot, 'assets'), url.pathname.slice(8));
    if (url.pathname.startsWith('/dist/')) return serveFile(response, path.join(root, 'dist'), url.pathname.slice(6));
    const match = url.pathname.match(/^\/scenario\/([a-z0-9-]+)$/);
    if (match && htmlById.has(match[1])) {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return response.end(htmlById.get(match[1]).html);
    }
    response.writeHead(404).end('Not found');
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function assertCondition(page, assertion) {
  if (assertion.type === 'visible') {
    const actual = await page.locator(assertion.selector).isVisible();
    const expected = assertion.value ?? true;
    if (actual !== expected) throw new Error(`visible assertion failed: ${JSON.stringify({ ...assertion, actual })}`);
    return { ...assertion, actual, pass: true };
  }
  const result = await page.evaluate(item => {
    const nodes = [...document.querySelectorAll(item.selector || 'html')];
    if (item.type === 'count') return { pass: nodes.length === item.value, actual: nodes.length };
    if (item.type === 'attribute') {
      const actual = nodes[0]?.getAttribute(item.attribute) ?? null;
      return { pass: actual === String(item.value), actual };
    }
    if (item.type === 'class') {
      const actual = !!nodes[0]?.classList.contains(item.value);
      return { pass: actual === (item.expected ?? true), actual };
    }
    if (item.type === 'global') {
      const actual = item.path.split('.').reduce((value, key) => value?.[key], window);
      return { pass: item.value === undefined ? actual !== undefined : actual === item.value, actual: typeof actual };
    }
    return { pass: false, actual: `unsupported assertion: ${item.type}` };
  }, assertion);
  if (!result.pass) throw new Error(`${assertion.type} assertion failed: ${JSON.stringify({ ...assertion, actual: result.actual })}`);
  return { ...assertion, actual: result.actual, pass: true };
}

async function runAction(page, action) {
  const locator = action.selector ? page.locator(action.selector).nth(action.nth ?? 0) : null;
  if (action.type === 'click') return locator.click();
  if (action.type === 'press') return locator.press(action.key);
  if (action.type === 'wait') return page.waitForTimeout(action.ms);
  if (action.type === 'scroll') return page.evaluate(y => window.scrollTo(0, y), action.y);
  if (action.type === 'api') return page.evaluate(({ path: apiPath, args }) => {
    const parts = apiPath.split('.'); const method = parts.pop();
    const owner = parts.reduce((value, key) => value?.[key], window);
    if (!owner || typeof owner[method] !== 'function') throw new Error(`API not found: ${apiPath}`);
    return owner[method](...(args || []));
  }, action);
  throw new Error(`Unsupported action: ${action.type}`);
}

async function runScenario(browser, baseUrl, scenario, transformed) {
  const consoleMessages = []; const pageErrors = []; const networkFailures = [];
  const context = await browser.newContext({ viewport: scenario.viewport || { width: 1440, height: 900 }, reducedMotion: scenario.reducedMotion || 'no-preference' });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol)) {
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('console', message => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => networkFailures.push({ url: request.url(), error: request.failure()?.errorText }));
  const startedAt = new Date().toISOString();
  const assertions = [];
  let error = null;
  try {
    await page.goto(`${baseUrl}/scenario/${scenario.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(scenario.settleMs ?? 100);
    for (const action of scenario.actions || []) await runAction(page, action);
    for (const assertion of scenario.assertions || []) assertions.push(await assertCondition(page, assertion));
    const runtimeErrors = await page.evaluate(() => window.CarrdPluginRuntimeErrors || []);
    if (pageErrors.length || runtimeErrors.length) throw new Error(`Browser errors: ${JSON.stringify({ pageErrors, runtimeErrors })}`);
  } catch (caught) { error = caught.stack || caught.message; }
  const dir = path.join(artifactRoot, scenario.id);
  await mkdir(dir, { recursive: true });
  if (error || !scenario.matrix) await page.screenshot({ path: path.join(dir, 'final.png'), fullPage: true });
  const result = { id: scenario.id, pass: !error, matrix: scenario.matrix || null, startedAt, finishedAt: new Date().toISOString(), mutations: transformed.readback, assertions, consoleMessages, pageErrors, networkFailures, error };
  await writeFile(path.join(dir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  await context.close();
  return result;
}

const { ids, list, mode, workers } = parseArgs();
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const matrixContractPath = path.join(root, manifest.matrixContract);
const matrixContract = JSON.parse(await readFile(matrixContractPath, 'utf8'));
const generated = generateMatrix(matrixContract);
const available = mode === 'base' ? manifest.scenarios : mode === 'matrix' ? generated : [...manifest.scenarios, ...generated];
const scenarios = selectScenarios({ scenarios: available }, ids);
if (list) { scenarios.forEach(item => console.log(`${item.id}\t${item.title}`)); process.exit(0); }
const source = await readFile(path.join(sourceRoot, 'index.html'), 'utf8');
const transformed = new Map(scenarios.map(item => [item.id, transformHtml(source, item)]));
const server = await startServer(transformed);
const { port } = server.address();
const chromium = await loadChromium();
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const results = new Array(scenarios.length);
try {
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < scenarios.length) {
      const index = nextIndex; nextIndex += 1;
      const scenario = scenarios[index];
      const result = await runScenario(browser, `http://127.0.0.1:${port}`, scenario, transformed.get(scenario.id));
      results[index] = result;
      if (!scenario.matrix || !result.pass) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${scenario.id}${result.error ? ` — ${result.error.split('\n')[0]}` : ''}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(workers, scenarios.length) }, worker));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
await mkdir(artifactRoot, { recursive: true });
await writeFile(path.join(artifactRoot, 'summary.json'), `${JSON.stringify(results, null, 2)}\n`);
const matrixResults = results.filter(item => item.matrix);
if (matrixResults.length) {
  const coverage = { ...summarizeMatrix(scenarios.filter(item => item.matrix)), passed: matrixResults.filter(item => item.pass).length, failed: matrixResults.filter(item => !item.pass).length };
  await writeFile(path.join(artifactRoot, 'matrix-coverage.json'), `${JSON.stringify(coverage, null, 2)}\n`);
  console.log(`MATRIX ${coverage.passed}/${coverage.total} passed; ${Object.entries(coverage.plugins).map(([plugin, count]) => `${plugin}:${count}`).join(', ')}`);
}
if (results.some(item => !item.pass)) process.exitCode = 1;
