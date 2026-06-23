#!/usr/bin/env node

import fs from "node:fs";

function parseArgs(argv) {
  const args = {
    port: process.env.CARRD_DEBUG_PORT || "9222",
    titleIncludes: "",
    urlIncludes: "",
    js: "",
    jsFile: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--port" && next) {
      args.port = next;
      i += 1;
    } else if (arg === "--title-includes" && next) {
      args.titleIncludes = next;
      i += 1;
    } else if (arg === "--url-includes" && next) {
      args.urlIncludes = next;
      i += 1;
    } else if (arg === "--js" && next) {
      args.js = next;
      i += 1;
    } else if (arg === "--js-file" && next) {
      args.jsFile = next;
      i += 1;
    }
  }

  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function getTabs(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) {
    fail(`Failed to read debug tabs: ${response.status}`);
  }
  return response.json();
}

function pickTab(tabs, titleIncludes, urlIncludes) {
  const pages = tabs.filter((tab) => tab.type === "page");
  const matches = pages.filter((tab) => {
    const titleOk = !titleIncludes || String(tab.title || "").includes(titleIncludes);
    const urlOk = !urlIncludes || String(tab.url || "").includes(urlIncludes);
    return titleOk && urlOk;
  });

  if (matches.length === 0) {
    fail("No matching debug tab found.");
  }

  return matches[0];
}

async function evaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {}
      fn(value);
    };

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          id: nextId++,
          method: "Page.bringToFront",
          params: {},
        })
      );

      ws.send(
        JSON.stringify({
          id: nextId++,
          method: "Runtime.evaluate",
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true,
          },
        })
      );
    });

    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.method) {
        return;
      }

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const script = args.jsFile
    ? fs.readFileSync(args.jsFile, "utf8")
    : args.js;

  if (!script) {
    fail("Pass --js or --js-file.");
  }

  const tabs = await getTabs(args.port);
  const tab = pickTab(tabs, args.titleIncludes, args.urlIncludes);
  const value = await evaluate(tab.webSocketDebuggerUrl, script);

  console.log(
    JSON.stringify(
      {
        tab: {
          id: tab.id,
          title: tab.title,
          url: tab.url,
        },
        value,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
