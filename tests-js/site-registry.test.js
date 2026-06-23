const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const modulePath = pathToFileURL(
  path.resolve(__dirname, '..', 'cardbuilder', 'scripts', 'carrd', 'site-registry.mjs')
).href;

let registryModulePromise;

function loadRegistryModule() {
  if (!registryModulePromise) {
    registryModulePromise = import(modulePath);
  }
  return registryModulePromise;
}

test('site registry loads the live site registry and validates canonical paths', async () => {
  const { loadRegistry } = await loadRegistryModule();
  const registry = loadRegistry();

  assert.equal(registry.length >= 3, true);
  assert.ok(registry.some(site => site.siteSlug === 'main-template'));
  assert.ok(registry.some(site => site.siteSlug === 'lunar-auto-film'));
  assert.ok(registry.some(site => site.siteSlug === 'faktura'));
});

test('site registry resolves the active template pointer through the registry', async () => {
  const { resolveSite, profileSnapshotDir } = await loadRegistryModule();
  const resolved = resolveSite();

  assert.equal(resolved.site.siteSlug, 'lunar-auto-film');
  assert.equal(resolved.matchedBy, 'activeTemplateId');
  assert.equal(resolved.activeTemplate.activeTemplateId, 'lunar-auto-film');
  assert.equal(
    profileSnapshotDir(resolved.profile),
    '/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/lunar-auto-film/data/snapshots'
  );
});

test('site registry resolves explicit builder URLs even when the active pointer is different', async () => {
  const { resolveSite } = await loadRegistryModule();
  const resolved = resolveSite({
    builderUrl: 'carrd.co/dashboard/4155176224428477/build'
  });

  assert.equal(resolved.site.siteSlug, 'main-template');
  assert.equal(resolved.matchedBy, 'builderUrl');
  assert.equal(resolved.profile.structure.tabsMap, '/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-04-16.json');
});

test('site registry resolves faktura as a first-class live site package', async () => {
  const { resolveSite } = await loadRegistryModule();
  const resolved = resolveSite({
    siteRef: 'faktura'
  });

  assert.equal(resolved.site.siteSlug, 'faktura');
  assert.equal(resolved.matchedBy, 'site-ref-slug');
  assert.equal(resolved.site.builderUrl, 'https://carrd.co/dashboard/4778178033233108/build');
  assert.equal(resolved.profile.status, 'automation-first');
});
