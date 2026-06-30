const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDom, loadScript, triggerDomReady, setPluginOptions, click, useFakeTimers } = require('./helpers');

function faqHtml() {
  return (
    '<div data-faq="main">' +
      '<hr class="divider-component">' +
      '<h2>Question 1</h2>' +
      '<p>Answer 1</p>' +
      '<hr class="divider-component">' +
      '<h2>Question 2</h2>' +
      '<p>Answer 2</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );
}

test('faq initializes, applies classes and aria attributes', () => {
  const dom = createDom(faqHtml());
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const questions = doc.querySelectorAll('.theme-faq-question');
  const triggers = doc.querySelectorAll('.theme-faq-trigger');
  const answers = doc.querySelectorAll('.theme-faq-answer');

  assert.equal(questions.length, 2);
  assert.equal(triggers.length, 2);
  assert.equal(answers.length, 2);
  assert.equal(questions[0].tagName, 'H2');
  assert.equal(triggers[0].tagName, 'BUTTON');
  assert.equal(triggers[0].getAttribute('aria-expanded'), 'false');
  assert.equal(answers[0].getAttribute('aria-hidden'), 'true');
});

test('faq toggles by click and enforces single-open accordion', () => {
  const dom = createDom(faqHtml());
  const timers = useFakeTimers(dom);
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  const doc = dom.window.document;
  const [q1, q2] = doc.querySelectorAll('.theme-faq-question');
  const [t1, t2] = doc.querySelectorAll('.theme-faq-trigger');
  const [a1, a2] = doc.querySelectorAll('.theme-faq-answer');

  click(dom, t1);
  assert.ok(q1.classList.contains('is-open'));
  assert.ok(a1.classList.contains('is-open'));
  assert.equal(t1.getAttribute('aria-expanded'), 'true');
  assert.equal(a1.style.maxHeight, '');
  timers.flush();
  assert.match(a1.style.maxHeight, /px$/);

  click(dom, t2);
  assert.ok(q2.classList.contains('is-open'));
  assert.ok(a2.classList.contains('is-open'));
  assert.ok(q1.classList.contains('is-closed'));
  assert.ok(a1.classList.contains('is-closed'));
  timers.restore();
});

test('faq supports data-faq-allow-multiple per container', () => {
  const dom = createDom(
    '<div data-faq="main" data-faq-allow-multiple="true">' +
      '<hr class="divider-component">' +
      '<h2>Question 1</h2>' +
      '<p>Answer 1</p>' +
      '<hr class="divider-component">' +
      '<h2>Question 2</h2>' +
      '<p>Answer 2</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  const [t1, t2] = dom.window.document.querySelectorAll('.theme-faq-trigger');
  const [a1, a2] = dom.window.document.querySelectorAll('.theme-faq-answer');

  click(dom, t1);
  click(dom, t2);

  assert.ok(a1.classList.contains('is-open'));
  assert.ok(a2.classList.contains('is-open'));
});

test('faq no longer initializes from legacy .FAQContainer markup', () => {
  const dom = createDom(
    '<div class="FAQContainer">' +
      '<hr class="divider-component">' +
      '<h2>Question</h2>' +
      '<p>Answer</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-faq-question').length, 0);
});

test('faq keeps accordion state isolated per container', () => {
  const dom = createDom(faqHtml() + faqHtml());
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  const containers = dom.window.document.querySelectorAll('[data-faq]');
  const firstTrigger = containers[0].querySelector('.theme-faq-trigger');
  const secondTrigger = containers[1].querySelector('.theme-faq-trigger');
  const secondAnswer = containers[1].querySelector('.theme-faq-answer');

  click(dom, firstTrigger);
  click(dom, secondTrigger);

  assert.ok(secondAnswer.classList.contains('is-open'));
});

test('faq supports data-faq-default-open per container', () => {
  const dom = createDom(
    '<div data-faq="main" data-faq-default-open="true">' +
      '<hr class="divider-component">' +
      '<h2>Question 1</h2>' +
      '<p>Answer 1</p>' +
      '<hr class="divider-component">' +
      '<h2>Question 2</h2>' +
      '<p>Answer 2</p>' +
      '<hr class="divider-component">' +
    '</div>'
  );
  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  const questions = dom.window.document.querySelectorAll('.theme-faq-question');
  const triggers = dom.window.document.querySelectorAll('.theme-faq-trigger');
  const answers = dom.window.document.querySelectorAll('.theme-faq-answer');

  assert.ok(questions[0].classList.contains('is-open'));
  assert.ok(triggers[0].classList.contains('is-open'));
  assert.ok(answers[0].classList.contains('is-open'));
  assert.ok(questions[1].classList.contains('is-closed'));
});

test('faq honors custom divider selectors end-to-end', () => {
  const dom = createDom(
    '<div data-faq="main">' +
      '<hr class="faq-divider">' +
      '<h2>Question</h2>' +
      '<p>Answer</p>' +
      '<hr class="faq-divider">' +
    '</div>'
  );
  setPluginOptions(dom, {
    faq: {
      dividerSelector: 'hr.faq-divider'
    }
  });

  loadScript(dom, 'src/faq/faq.js');
  triggerDomReady(dom);

  assert.equal(dom.window.document.querySelectorAll('.theme-faq-question').length, 1);
});

test('faq does not double-bind on repeated init', () => {
  const dom = createDom(faqHtml());
  loadScript(dom, 'src/faq/faq.js');

  triggerDomReady(dom);
  triggerDomReady(dom);

  const doc = dom.window.document;
  const questions = doc.querySelectorAll('.theme-faq-question');
  const triggers = doc.querySelectorAll('.theme-faq-trigger');
  const answers = doc.querySelectorAll('.theme-faq-answer');

  assert.ok(questions[0].classList.contains('is-closed'));
  assert.ok(triggers[0].classList.contains('is-closed'));
  assert.ok(answers[0].classList.contains('is-closed'));
  assert.equal(questions[0].dataset.faqBound, 'true');
  assert.equal(doc.querySelectorAll('.theme-faq-question').length, 2);
});
