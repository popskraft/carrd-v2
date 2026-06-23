(function() {
  'use strict';

  const DEFAULTS = {
    dividerSelector: 'hr.divider-component',
    allowMultipleOpen: false,
    defaultOpen: false,
    headerTags: ['H1', 'H2', 'H3']
  };
  const CONTAINER_SELECTOR = '[data-faq-v2], .FAQContainer';
  const safeNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

  const externalOptions = (typeof window !== 'undefined' &&
    window.CarrdPluginOptionsV2 &&
    window.CarrdPluginOptionsV2.faq) || {};
  const CONFIG = { ...DEFAULTS, ...externalOptions };
  const HEADER_TAGS = new Set(CONFIG.headerTags);
  const CLASSES = {
    question: 'theme-faq-question',
    trigger: 'theme-faq-trigger',
    answer: 'theme-faq-answer',
    open: 'is-open',
    closed: 'is-closed'
  };

  let answerIdCounter = 0;
  const openAnswersByContainer = new Map();
  let answerResizeObserver = null;
  const requestFrame = window.requestAnimationFrame || (cb => setTimeout(cb, 16));
  let resizeHandle = null;
  let listenersBound = false;

  function getOpenAnswers(container) {
    let answers = openAnswersByContainer.get(container);
    if (!answers) {
      answers = new Set();
      openAnswersByContainer.set(container, answers);
    }
    return answers;
  }

  function forEachOpenAnswer(callback) {
    openAnswersByContainer.forEach(answers => {
      answers.forEach(answer => callback(answer, answers));
    });
  }

  const scheduleOpenAnswerSync = () => {
    if (resizeHandle !== null) return;
    resizeHandle = requestFrame(() => {
      forEachOpenAnswer(answer => adjustHeight(answer));
      resizeHandle = null;
    });
  };

  function init() {
    const containers = Array.from(document.querySelectorAll(CONTAINER_SELECTOR)).filter(isFaqContainer);
    if (!containers.length) return;

    if (!answerResizeObserver && typeof ResizeObserver !== 'undefined') {
      answerResizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          forEachOpenAnswer(answer => {
            if (answer === entry.target) {
              adjustHeight(answer);
            }
          });
        });
      });
    }

    containers.forEach(container => {
      if (container.dataset.faqInitialized === 'true') return;
      container.dataset.faqInitialized = 'true';
      const containerConfig = getContainerConfig(container);
      let firstQuestion = containerConfig.defaultOpen;

      const dividers = Array.from(container.querySelectorAll(CONFIG.dividerSelector)).filter(
        divider => divider.closest(CONTAINER_SELECTOR) === container
      );
      if (!dividers.length) return;

      dividers.forEach(startDivider => {
        const endDivider = findNextDivider(startDivider);

        const header = findHeaderBetween(startDivider, endDivider);
        if (!header || header.dataset.faqBound === 'true') {
          return;
        }

        const answerWrapper =
          header.nextElementSibling && header.nextElementSibling.classList.contains(CLASSES.answer)
            ? header.nextElementSibling
            : wrapAnswerContent(header, endDivider);

        if (!answerWrapper) {
          return;
        }

        const shouldOpenByDefault = firstQuestion;
        prepareToggle(header, answerWrapper, shouldOpenByDefault);
        firstQuestion = false;
      });
    });

    if (!listenersBound) {
      listenersBound = true;
      window.addEventListener('resize', scheduleOpenAnswerSync);
      window.addEventListener('orientationchange', scheduleOpenAnswerSync);
    }
  }

  function findNextDivider(divider) {
    let node = divider.nextElementSibling;
    while (node) {
      if (isDivider(node)) {
        return node;
      }
      node = node.nextElementSibling;
    }
    return null;
  }

  function findHeaderBetween(startDivider, endDivider) {
    let node = startDivider.nextElementSibling;
    let firstParagraph = null;

    while (node && node !== endDivider) {
      if (isHeader(node)) {
        return node;
      }
      if (!firstParagraph && node.nodeType === 1 && node.tagName === 'P') {
        firstParagraph = node;
      }
      node = node.nextElementSibling;
    }

    if (!endDivider) {
      while (node) {
        if (isHeader(node)) {
          return node;
        }
        if (!firstParagraph && node.nodeType === 1 && node.tagName === 'P') {
          firstParagraph = node;
        }
        node = node.nextElementSibling;
      }
    }

    return firstParagraph;
  }

  function wrapAnswerContent(header, endDivider) {
    let node = header.nextSibling;
    const wrapper = document.createElement('div');
    wrapper.className = CLASSES.answer;
    let hasContent = false;

    while (node && node !== endDivider) {
      const next = node.nextSibling;
      wrapper.appendChild(node);
      hasContent = true;
      node = next;
    }

    if (!hasContent) {
      return null;
    }

    if (endDivider && endDivider.parentNode) {
      header.parentNode.insertBefore(wrapper, endDivider);
    } else {
      header.parentNode.appendChild(wrapper);
    }
    return wrapper;
  }

  function prepareToggle(header, answer, openByDefault = false) {
    const container = header.closest(CONTAINER_SELECTOR);
    const openAnswers = getOpenAnswers(container);

    header.classList.add(CLASSES.question);
    header.dataset.faqBound = 'true';

    const trigger = ensureTriggerButton(header);

    if (!answer.id) {
      answerIdCounter += 1;
      answer.id = `faq-answer-${answerIdCounter}`;
    }
    trigger.setAttribute('aria-controls', answer.id);

    if (answerResizeObserver) {
      answerResizeObserver.observe(answer);
    }

    if (openByDefault) {
      header.classList.add(CLASSES.open);
      header.classList.remove(CLASSES.closed);
      trigger.classList.add(CLASSES.open);
      trigger.classList.remove(CLASSES.closed);
      answer.classList.add(CLASSES.open);
      answer.classList.remove(CLASSES.closed);
      trigger.setAttribute('aria-expanded', 'true');
      answer.setAttribute('aria-hidden', 'false');
      openAnswers.add(answer);
      requestFrame(() => adjustHeight(answer));
    } else {
      header.classList.add(CLASSES.closed);
      header.classList.remove(CLASSES.open);
      trigger.classList.add(CLASSES.closed);
      trigger.classList.remove(CLASSES.open);
      answer.classList.add(CLASSES.closed);
      answer.classList.remove(CLASSES.open);
      trigger.setAttribute('aria-expanded', 'false');
      answer.setAttribute('aria-hidden', 'true');
    }

    const toggle = () => toggleAnswer(header, answer);

    trigger.addEventListener('click', toggle);
  }

  function toggleAnswer(header, answer) {
    const container = header.closest(CONTAINER_SELECTOR);
    const containerConfig = getContainerConfig(container);
    const openAnswers = getOpenAnswers(container);
    const willOpen = !header.classList.contains(CLASSES.open);

    if (willOpen && !containerConfig.allowMultipleOpen) {
      Array.from(openAnswers).forEach(openAnswer => {
        if (openAnswer !== answer) {
          const openTrigger = document.querySelector(`.${CLASSES.trigger}[aria-controls="${openAnswer.id}"]`);
          if (openTrigger) {
            openTrigger.classList.remove(CLASSES.open);
            openTrigger.classList.add(CLASSES.closed);
            openTrigger.setAttribute('aria-expanded', 'false');
            const openHeader = openTrigger.closest(`.${CLASSES.question}`);
            if (openHeader) {
              openHeader.classList.remove(CLASSES.open);
              openHeader.classList.add(CLASSES.closed);
            }
          }
          openAnswer.classList.remove(CLASSES.open);
          openAnswer.classList.add(CLASSES.closed);
          openAnswer.setAttribute('aria-hidden', 'true');
          openAnswer.style.maxHeight = '0px';
          openAnswers.delete(openAnswer);
        }
      });
    }

    header.classList.toggle(CLASSES.open, willOpen);
    header.classList.toggle(CLASSES.closed, !willOpen);
    const trigger = header.querySelector(`.${CLASSES.trigger}`);
    if (trigger) {
      trigger.classList.toggle(CLASSES.open, willOpen);
      trigger.classList.toggle(CLASSES.closed, !willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    }
    answer.classList.toggle(CLASSES.open, willOpen);
    answer.classList.toggle(CLASSES.closed, !willOpen);
    answer.setAttribute('aria-hidden', String(!willOpen));

    if (willOpen) {
      openAnswers.add(answer);
      requestFrame(() => adjustHeight(answer));
      scheduleOpenAnswerSync();
    } else {
      openAnswers.delete(answer);
      answer.style.maxHeight = '0px';
    }
  }

  function adjustHeight(answer) {
    answer.style.maxHeight = `${answer.scrollHeight}px`;
  }

  function ensureTriggerButton(header) {
    const existingTrigger = header.querySelector(`:scope > .${CLASSES.trigger}`);
    if (existingTrigger) {
      return existingTrigger;
    }

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = CLASSES.trigger;
    trigger.setAttribute('aria-expanded', 'false');

    while (header.firstChild) {
      trigger.appendChild(header.firstChild);
    }

    header.appendChild(trigger);
    return trigger;
  }

  function isHeader(node) {
    return node && node.nodeType === 1 && HEADER_TAGS.has(node.tagName);
  }

  function isDivider(node) {
    return !!(node && node.nodeType === 1 && node.matches && node.matches(CONFIG.dividerSelector));
  }

  function parseBooleanAttr(value) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }

    return null;
  }

  function getContainerConfig(container) {
    return {
      allowMultipleOpen:
        parseBooleanAttr(container.getAttribute('data-faq-v2-allow-multiple')) ??
        CONFIG.allowMultipleOpen === true,
      defaultOpen:
        parseBooleanAttr(container.getAttribute('data-faq-v2-default-open')) ??
        CONFIG.defaultOpen === true
    };
  }

  function isFaqContainer(container) {
    if (!container || container.nodeType !== 1) {
      return false;
    }
    if (!container.hasAttribute('data-faq-v2')) {
      return container.classList.contains('FAQContainer');
    }

    const name = (container.getAttribute('data-faq-v2') || '').trim();
    return safeNamePattern.test(name);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
