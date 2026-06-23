/*
Carrd Template-Instance Scan
Usage:
  1) Open the active Carrd builder URL.
  2) Open DevTools Console.
  3) Paste this script and run.
  4) Wait for the download to complete.
  5) Save the JSON into the main-template scan package.

Purpose:
  - Capture project-scoped template-instance state from the live builder.
  - Export a safe component snapshot, control/anchor map, embed inventory,
    plugin heuristics, and top-level component summaries.
*/
(function carrdTemplateInstanceScan() {
  const ACTIVE_TEMPLATE_ID = "main-template";
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

  function safe(obj, depth = 0) {
    if (depth > 6 || obj === null || obj === undefined) return obj;
    if (typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((v) => safe(v, depth + 1));
    const res = {};
    const SKIP = new Set([
      "parent",
      "$el",
      "$canvas",
      "$wrapper",
      "site",
      "styleSheet",
      "monitoredConditionStates",
      "_animateTimeouts",
      "$mainInner",
      "intersectionObserver",
    ]);
    for (const [k, v] of Object.entries(obj)) {
      if (SKIP.has(k)) continue;
      res[k] = safe(v, depth + 1);
    }
    return res;
  }

  function textOf(el) {
    if (!el) return "";
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function uniqueSelector(el) {
    if (!el || !el.tagName) return "";
    if (el.id) return `#${el.id}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 7) {
      let part = node.tagName.toLowerCase();
      const dataId = node.getAttribute("data-id");
      const dataType = node.getAttribute("data-type");
      const dataAction = node.getAttribute("data-action");
      if (dataId) {
        part += `[data-id="${dataId}"]`;
      } else if (dataType) {
        part += `[data-type="${dataType}"]`;
      } else if (dataAction) {
        part += `[data-action="${dataAction}"]`;
      } else if (node.classList && node.classList.length) {
        part += "." + Array.from(node.classList).slice(0, 2).join(".");
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  function collectControls(components) {
    return Object.values(components)
      .filter((c) => c && c.id && c.type === "control")
      .map((c) => {
        const s = safe(c);
        return {
          id: c.id,
          mode: s.control?.mode || null,
          label:
            s.label ||
            s.control?.scrollPoint?.name ||
            s.control?.sectionBreak?.name ||
            null,
          scrollPoint: s.control?.scrollPoint?.name || null,
          sectionBreak: s.control?.sectionBreak?.name || null,
          settingsAnchor: s.settings?.anchor || null,
        };
      });
  }

  function collectAnchors(components) {
    const anchors = [];
    Object.values(components).forEach((c) => {
      if (!c || !c.id) return;
      const s = safe(c);
      const entries = [
        { source: "settings.anchor", value: s.settings?.anchor || null },
        { source: "control.scrollPoint", value: s.control?.scrollPoint?.name || null },
        { source: "control.sectionBreak", value: s.control?.sectionBreak?.name || null },
      ].filter((x) => x.value);
      entries.forEach((entry) => {
        anchors.push({
          componentId: c.id,
          componentType: c.type,
          source: entry.source,
          anchor: entry.value,
        });
      });
    });
    return anchors;
  }

  function collectWrappers() {
    return Array.from(
      document.querySelectorAll("#canvas .component-wrapper[data-id][data-type]")
    );
  }

  function getParentDataId(wrapper) {
    if (!wrapper) return null;
    const parent = wrapper.parentElement
      ? wrapper.parentElement.closest(".component-wrapper[data-id]")
      : null;
    return parent ? parent.getAttribute("data-id") : null;
  }

  function collectTopLevelItems() {
    return collectWrappers()
      .filter((el) => !getParentDataId(el))
      .map((el, index) => ({
        index,
        dataId: el.getAttribute("data-id"),
        dataType: el.getAttribute("data-type"),
        textSample: textOf(el).slice(0, 180),
        selector: uniqueSelector(el),
      }));
  }

  function collectEmbeds(components) {
    return Object.values(components)
      .filter((c) => c && c.id && c.type === "embed")
      .map((c) => {
        const s = safe(c);
        const textBlob = JSON.stringify(s);
        return {
          id: c.id,
          placement:
            s.embed?.placement ||
            s.embed?.mode ||
            s.settings?.placement ||
            null,
          textSample: textBlob.slice(0, 500),
        };
      });
  }

  function detectPluginsFromText(text) {
    const normalized = String(text || "").toLowerCase();
    return PLUGIN_NAMES.filter((name) => {
      return (
        normalized.includes(`/${name}.min.js`) ||
        normalized.includes(`/${name}.min.css`) ||
        normalized.includes(`${name}.min.js`) ||
        normalized.includes(`${name}.min.css`) ||
        normalized.includes(`window.${name}`) ||
        normalized.includes(`theme-${name}`) ||
        normalized.includes(name)
      );
    });
  }

  function collectPluginHeuristics(components) {
    const hits = new Map();

    function addHit(plugin, source, detail) {
      if (!hits.has(plugin)) hits.set(plugin, []);
      hits.get(plugin).push({ source, detail });
    }

    const htmlBlob = document.documentElement.outerHTML.toLowerCase();
    PLUGIN_NAMES.forEach((plugin) => {
      detectPluginsFromText(htmlBlob)
        .filter((x) => x === plugin)
        .forEach(() => addHit(plugin, "document-html", "matched plugin token in builder DOM"));
    });

    Object.values(components).forEach((component) => {
      if (!component || !component.id) return;
      const s = safe(component);
      const blob = JSON.stringify(s).toLowerCase();
      PLUGIN_NAMES.forEach((plugin) => {
        if (detectPluginsFromText(blob).includes(plugin)) {
          addHit(plugin, "component-safe-json", component.id);
        }
      });
    });

    const scripts = Array.from(document.querySelectorAll("script[src]")).map((el) =>
      el.getAttribute("src")
    );
    scripts.forEach((src) => {
      const normalized = String(src || "").toLowerCase();
      PLUGIN_NAMES.forEach((plugin) => {
        if (normalized.includes(`${plugin}.min.js`)) {
          addHit(plugin, "script-src", src);
        }
      });
    });

    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map((el) =>
      el.getAttribute("href")
    );
    links.forEach((href) => {
      const normalized = String(href || "").toLowerCase();
      PLUGIN_NAMES.forEach((plugin) => {
        if (normalized.includes(`${plugin}.min.css`)) {
          addHit(plugin, "stylesheet-href", href);
        }
      });
    });

    const globalCandidates = Object.keys(window).filter(
      (key) => /plugin|cart|modal|slider|faq|typography/i.test(key)
    );

    return PLUGIN_NAMES.map((plugin) => ({
      plugin,
      detected: hits.has(plugin),
      evidence: hits.get(plugin) || [],
      relatedGlobals: globalCandidates.filter((key) =>
        key.toLowerCase().includes(plugin.replace(/-/g, ""))
      ),
    }));
  }

  const builder = window.app?.builder;
  const components = builder?.site?.components || {};
  const safeComponents = {};
  Object.entries(components).forEach(([id, component]) => {
    safeComponents[id] = safe(component);
  });

  const wrappers = collectWrappers();
  const byType = {};
  wrappers.forEach((el) => {
    const dataType = el.getAttribute("data-type");
    byType[dataType] = (byType[dataType] || 0) + 1;
  });

  const report = {
    meta: {
      domain: "template-instance",
      templateId: ACTIVE_TEMPLATE_ID,
      generatedAt: new Date().toISOString(),
      builderUrl: location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
    root: {
      bodyId: document.body ? document.body.id || "" : "",
      bodyClass: document.body ? document.body.className || "" : "",
      hasCanvas: !!document.querySelector("#canvas"),
      hasMenu: !!document.querySelector("#menu"),
      hasUiWrapper: !!document.querySelector(".ui-wrapper"),
    },
    components: {
      total: wrappers.length,
      byType,
      safeById: safeComponents,
    },
    topLevel: {
      items: collectTopLevelItems(),
    },
    controls: collectControls(components),
    anchors: collectAnchors(components),
    embeds: collectEmbeds(components),
    pluginHeuristics: collectPluginHeuristics(components),
  };

  const fileName =
    "carrd-template-instance-scan-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
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

  console.log("[Template Instance Scan] saved file:", fileName);
  console.log("[Template Instance Scan] summary:", {
    components: report.components.total,
    componentTypes: report.components.byType,
    controls: report.controls.length,
    anchors: report.anchors.length,
    detectedPlugins: report.pluginHeuristics.filter((x) => x.detected).map((x) => x.plugin),
  });

  return report;
})();
