import { normalizeUrlLike } from "../site-registry.mjs";

function fail(message) {
  throw new Error(message);
}

export async function fetchDebugTabs(port = "9222") {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) {
    fail(`Failed to read debug tabs: ${response.status}`);
  }
  return response.json();
}

export function findMatchingSiteTab(tabs, site) {
  const target = normalizeUrlLike(site?.builderUrl || "");
  const published = normalizeUrlLike(site?.publishedSiteUrl || "");

  const pages = Array.isArray(tabs) ? tabs.filter((tab) => tab.type === "page") : [];
  const builderMatches = pages.filter((tab) => {
    const tabUrl = normalizeUrlLike(tab.url || "");
    return target && tabUrl.includes(target);
  });
  if (builderMatches.length) {
    return builderMatches[0];
  }

  const publishedMatches = pages.filter((tab) => {
    const tabUrl = normalizeUrlLike(tab.url || "");
    return published && tabUrl.includes(published);
  });

  return publishedMatches[0] || null;
}

export function pickPageTab(tabs, options = {}) {
  const titleIncludes = String(options.titleIncludes || "");
  const urlIncludes = String(options.urlIncludes || "");
  const pages = Array.isArray(tabs) ? tabs.filter((tab) => tab.type === "page") : [];

  const matches = pages.filter((tab) => {
    const titleOk = !titleIncludes || String(tab.title || "").includes(titleIncludes);
    const urlOk = !urlIncludes || String(tab.url || "").includes(urlIncludes);
    return titleOk && urlOk;
  });

  return matches[0] || null;
}

export const DEFAULT_EVALUATE_TIMEOUT_MS = Number(process.env.CARRD_CDP_TIMEOUT_MS || 30_000);

export async function evaluateTab(wsUrl, expression, options = {}) {
  const timeoutMs = Number(options.timeoutMs || DEFAULT_EVALUATE_TIMEOUT_MS);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    let settled = false;
    let timeoutHandle = null;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      try {
        ws.close();
      } catch {}
      fn(value);
    };

    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        finish(reject, new Error(`CDP evaluate timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      if (typeof timeoutHandle.unref === "function") timeoutHandle.unref();
    }

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          id: nextId++,
          method: "Page.bringToFront",
          params: {}
        })
      );

      ws.send(
        JSON.stringify({
          id: nextId++,
          method: "Runtime.evaluate",
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true
          }
        })
      );
    });

    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.method) return;

      if (payload.error) {
        finish(reject, new Error(payload.error.message || "CDP request failed"));
        return;
      }

      if (payload.result && payload.result.result) {
        if (payload.result.exceptionDetails) {
          const text =
            payload.result.exceptionDetails.text ||
            payload.result.result.description ||
            "Runtime.evaluate exception";
          finish(reject, new Error(text));
          return;
        }

        finish(resolve, payload.result.result.value);
      }
    });

    ws.addEventListener("error", (event) => {
      finish(reject, new Error(event.message || "WebSocket error"));
    });

    ws.addEventListener("close", () => {
      if (!settled) {
        finish(reject, new Error("WebSocket closed before evaluation finished"));
      }
    });
  });
}
