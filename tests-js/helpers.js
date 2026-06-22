const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, ResourceLoader } = require('jsdom');

class TestResourceLoader extends ResourceLoader {
  fetch(url, options) {
    if (url.startsWith('https://example.test/assets/')) {
      return Promise.resolve(Buffer.from(''));
    }
    return super.fetch(url, options);
  }
}

function installBrowserMocks(dom) {
  const raf = (callback) => dom.window.setTimeout(() => callback(Date.now()), 0);
  const caf = (id) => dom.window.clearTimeout(id);
  dom.window.requestAnimationFrame = raf;
  dom.window.cancelAnimationFrame = caf;
  dom.window.globalThis.requestAnimationFrame = raf;
  dom.window.globalThis.cancelAnimationFrame = caf;
}

function createDom(html = '') {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: new TestResourceLoader(),
    url: 'https://example.test/'
  });
  installBrowserMocks(dom);
  return dom;
}

function setPluginOptions(dom, options = {}) {
  dom.window.CarrdPluginOptionsV2 = options;
}

function loadScript(dom, relativePath) {
  const scriptPath = path.resolve(__dirname, '..', relativePath);
  const code = fs.readFileSync(scriptPath, 'utf-8');
  dom.window.eval(code);
}

function triggerDomReady(dom) {
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
}

function click(dom, element) {
  element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function keydown(dom, element, key, opts = {}) {
  element.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...opts
    })
  );
}

function mockViewport(dom, width) {
  Object.defineProperty(dom.window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true
  });
}

function mockResizeObserver(dom) {
  class ResizeObserverMock {
    constructor(cb) {
      this.cb = cb;
      this.targets = new Set();
    }
    observe(target) {
      this.targets.add(target);
    }
    unobserve(target) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
    }
    trigger(entries = null) {
      const payload =
        entries ||
        Array.from(this.targets).map(target => ({
          target
        }));
      this.cb(payload);
    }
  }

  dom.window.ResizeObserver = ResizeObserverMock;
  return ResizeObserverMock;
}

function mockMutationObserver(dom) {
  const observers = [];
  class MutationObserverMock {
    constructor(cb) {
      this.cb = cb;
      this.observing = false;
      observers.push(this);
    }
    observe() {
      this.observing = true;
    }
    disconnect() {
      this.observing = false;
    }
    trigger(records = []) {
      if (this.observing) this.cb(records);
    }
  }

  dom.window.MutationObserver = MutationObserverMock;
  return {
    MutationObserverMock,
    observers
  };
}

function useFakeTimers(dom) {
  const queue = [];
  let nextId = 1;
  const ids = new Map();

  const originalSetTimeout = dom.window.setTimeout;
  const originalClearTimeout = dom.window.clearTimeout;
  const originalSetInterval = dom.window.setInterval;
  const originalClearInterval = dom.window.clearInterval;
  const originalRaf = dom.window.requestAnimationFrame;
  const originalCancelRaf = dom.window.cancelAnimationFrame;

  dom.window.setTimeout = (fn) => {
    const id = nextId++;
    queue.push({ id, fn, type: 'timeout' });
    ids.set(id, true);
    return id;
  };

  dom.window.clearTimeout = (id) => {
    ids.delete(id);
  };

  dom.window.setInterval = (fn) => {
    const id = nextId++;
    queue.push({ id, fn, type: 'interval' });
    ids.set(id, true);
    return id;
  };

  dom.window.clearInterval = (id) => {
    ids.delete(id);
  };

  dom.window.requestAnimationFrame = (fn) => dom.window.setTimeout(() => fn(Date.now()), 0);
  dom.window.cancelAnimationFrame = (id) => dom.window.clearTimeout(id);
  dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;
  dom.window.globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame;

  const flush = (limit = 1000) => {
    let count = 0;
    while (queue.length && count < limit) {
      const task = queue.shift();
      count += 1;
      if (!ids.has(task.id)) continue;
      task.fn();
      if (task.type === 'interval' && ids.has(task.id)) {
        queue.push(task);
      } else {
        ids.delete(task.id);
      }
    }
  };

  const restore = () => {
    dom.window.setTimeout = originalSetTimeout;
    dom.window.clearTimeout = originalClearTimeout;
    dom.window.setInterval = originalSetInterval;
    dom.window.clearInterval = originalClearInterval;
    dom.window.requestAnimationFrame = originalRaf;
    dom.window.cancelAnimationFrame = originalCancelRaf;
    dom.window.globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;
    dom.window.globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame;
  };

  return { flush, restore };
}

module.exports = {
  createDom,
  installBrowserMocks,
  loadScript,
  setPluginOptions,
  triggerDomReady,
  click,
  keydown,
  mockViewport,
  mockResizeObserver,
  mockMutationObserver,
  useFakeTimers
};
