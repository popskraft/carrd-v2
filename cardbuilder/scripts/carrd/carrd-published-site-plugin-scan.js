/*
Carrd Published Site Plugin Scan
Usage:
  1) Open the published site URL in a browser tab.
  2) Open DevTools Console.
  3) Paste this script and run.
  4) Download the JSON output.

Purpose:
  - Capture project-scoped published-site evidence for plugin assets and runtime globals.
  - Support sync comparison between the live template, /src, and /dist.
*/
(function carrdPublishedSitePluginScan() {
  const PLUGIN_NAMES = [
    "cards",
    "columns",
    "cookie-banner",
    "faq",
    "grid-cluster",
    "header-nav",
    "modal",
    "no-loadwaiting",
    "shopping-cart",
    "slider",
    "stacker",
    "typography",
  ];

  function textOf(el) {
    if (!el) return "";
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function pluginMatches(text) {
    const normalized = String(text || "").toLowerCase();
    return PLUGIN_NAMES.filter((plugin) => {
      return (
        normalized.includes(`${plugin}.min.js`) ||
        normalized.includes(`${plugin}.min.css`) ||
        normalized.includes(`theme-${plugin}`) ||
        normalized.includes(plugin)
      );
    });
  }

  const scripts = Array.from(document.querySelectorAll("script[src]")).map((el) => {
    const src = el.getAttribute("src") || "";
    return {
      src,
      matchedPlugins: pluginMatches(src),
    };
  });

  const stylesheets = Array.from(
    document.querySelectorAll('link[rel="stylesheet"][href]')
  ).map((el) => {
    const href = el.getAttribute("href") || "";
    return {
      href,
      matchedPlugins: pluginMatches(href),
    };
  });

  const inlineEmbeds = Array.from(document.querySelectorAll("script:not([src]), style")).map(
    (el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      textSample: textOf(el).slice(0, 300),
      matchedPlugins: pluginMatches(el.textContent || ""),
    })
  );

  const globals = Object.keys(window)
    .filter((key) => /plugin|cart|modal|slider|faq|typography/i.test(key))
    .sort();

  const bodyClasses = Array.from(document.body?.classList || []);
  const matchedBodyClasses = bodyClasses.filter((cls) => pluginMatches(cls).length > 0);

  const report = {
    meta: {
      domain: "template-instance",
      generatedAt: new Date().toISOString(),
      url: location.href,
      title: document.title,
    },
    assets: {
      scripts,
      stylesheets,
      inlineEmbeds,
    },
    runtime: {
      candidateGlobals: globals,
      bodyClasses,
      matchedBodyClasses,
    },
    pluginSummary: PLUGIN_NAMES.map((plugin) => ({
      plugin,
      scriptHits: scripts.filter((x) => x.matchedPlugins.includes(plugin)).map((x) => x.src),
      styleHits: stylesheets
        .filter((x) => x.matchedPlugins.includes(plugin))
        .map((x) => x.href),
      inlineHits: inlineEmbeds
        .filter((x) => x.matchedPlugins.includes(plugin))
        .map((x) => `${x.tag}:${x.index}`),
      globalHits: globals.filter((key) =>
        key.toLowerCase().includes(plugin.replace(/-/g, ""))
      ),
      bodyClassHits: matchedBodyClasses.filter((cls) => cls.includes(plugin)),
    })),
  };

  const fileName =
    "carrd-published-plugin-scan-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).catch(function () {});
    }
  } catch (e) {
    // Ignore clipboard errors.
  }

  console.log("[Published Site Plugin Scan] saved file:", fileName);
  console.log("[Published Site Plugin Scan] summary:", {
    scriptAssets: report.assets.scripts.length,
    stylesheetAssets: report.assets.stylesheets.length,
    globals: report.runtime.candidateGlobals.length,
    detectedPlugins: report.pluginSummary.filter((x) => {
      return (
        x.scriptHits.length ||
        x.styleHits.length ||
        x.inlineHits.length ||
        x.globalHits.length ||
        x.bodyClassHits.length
      );
    }).map((x) => x.plugin),
  });

  return report;
})();
