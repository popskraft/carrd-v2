const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady, useFakeTimers } = require('./helpers');

test('cards creates theme-card-item wrappers with data-cards-color', () => {
  const dom = createDom(
    '<div data-cards="cards" data-cards-color="#112233">' +
      '<div class="inner">' +
        '<div><p>One</p></div>' +
        '<div><p>Two</p></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const cardItems = doc.querySelectorAll('.theme-card-item');
  assert.equal(cardItems.length, 2);
  assert.equal(doc.querySelector('[data-cards="cards"]').getAttribute('data-cards-initialized'), 'true');
  assert.equal(cardItems[0].textContent.trim(), 'One');
  assert.equal(cardItems[1].textContent.trim(), 'Two');
});

test('cards initializes from data-cards marker', () => {
  const dom = createDom(
    '<div data-cards="pricing" data-cards-color="#112233">' +
      '<div class="inner">' +
        '<div><p>One</p></div>' +
        '<div><p>Two</p></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('.theme-card-item').length, 2);
  assert.equal(doc.querySelector('[data-cards="pricing"]').getAttribute('data-cards-initialized'), 'true');
});

test('cards inherits padding from container styles before legacy data-padding', () => {
  const dom = createDom(
    '<div data-cards="cards" data-cards-padding="1rem">' +
      '<div class="wrapper">' +
        '<div class="inner" style="padding: 24px 32px;">' +
          '<div><p>One</p></div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const container = dom.window.document.querySelector('[data-cards="cards"]');
  const inner = container.querySelector('.wrapper > .inner');
  assert.equal(container.style.getPropertyValue('--theme-card-padding'), '24px 32px 24px 32px');
  assert.equal(container.style.getPropertyValue('--theme-card-padding-mobile'), '');
  assert.equal(container.style.getPropertyValue('padding'), '0px');
  assert.equal(inner.style.getPropertyValue('padding'), '0px');
  assert.equal(inner.style.getPropertyPriority('padding'), 'important');
});

test('cards falls back to root container padding when no wrapper inner padding exists', () => {
  const dom = createDom(
    '<div data-cards="cards" data-cards-padding="1rem" style="padding: 24px 32px;">' +
      '<div class="inner">' +
        '<div><p>One</p></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const container = dom.window.document.querySelector('[data-cards="cards"]');
  assert.equal(container.style.getPropertyValue('--theme-card-padding'), '24px 32px 24px 32px');
  assert.equal(container.style.getPropertyValue('--theme-card-padding-mobile'), '');
  assert.equal(container.style.getPropertyValue('padding'), '0px');
});

test('cards keeps legacy generic color attributes as fallback', () => {
  const dom = createDom(
    '<div data-cards="pricing" data-color="#112233">' +
      '<div class="inner">' +
        '<div><p>One</p></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-card-item').length, 1);
});

test('cards keeps legacy data-padding as fallback when container padding is zero', () => {
  const dom = createDom(
    '<div data-cards="cards" data-padding="2 3" data-padding-mobile="1" style="padding: 0;">' +
      '<div class="inner">' +
        '<div><p>One</p></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const container = dom.window.document.querySelector('[data-cards="cards"]');
  assert.equal(container.style.getPropertyValue('--theme-card-padding'), '2rem 3rem');
  assert.equal(container.style.getPropertyValue('--theme-card-padding-mobile'), '1rem');
  assert.equal(container.style.getPropertyValue('padding'), '0px');
});

test('cards re-syncs inherited padding on resize', () => {
  const dom = createDom(
    '<div data-cards="cards" style="padding: 24px 32px;">' +
      '<div class="inner">' +
        '<div><p>One</p></div>' +
      '</div>' +
    '</div>'
  );
  const timers = useFakeTimers(dom);

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const container = dom.window.document.querySelector('[data-cards="cards"]');
  container.style.padding = '12px 16px 20px 8px';
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  timers.flush();

  assert.equal(container.style.getPropertyValue('--theme-card-padding'), '12px 16px 20px 8px');
  assert.equal(container.style.getPropertyValue('padding'), '0px');
  timers.restore();
});

test('cards does not re-wrap if theme-card-item already exists', () => {
  const dom = createDom(
    '<div data-cards="cards">' +
      '<div class="inner">' +
        '<div><div class="theme-card-item"><p>Already</p></div></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const cardItems = doc.querySelectorAll('.theme-card-item');
  assert.equal(cardItems.length, 1);
});

test('cards does not re-wrap if legacy card-item already exists', () => {
  const dom = createDom(
    '<div data-cards="cards">' +
      '<div class="inner">' +
        '<div><div class="card-item"><p>Legacy</p></div></div>' +
      '</div>' +
    '</div>'
  );

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const cardItems = doc.querySelectorAll('.theme-card-item');
  assert.equal(cardItems.length, 0);
});

test('cards respects enabled:false', () => {
  const dom = createDom(
    '<div data-cards="cards"><div class="inner"><div><p>X</p></div></div></div>'
  );
  dom.window.CarrdPluginOptions = { cards: { enabled: false } };

  loadScript(dom, 'src/cards/cards.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-card-item').length, 0);
});
