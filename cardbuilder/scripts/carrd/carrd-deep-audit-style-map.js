/*
Carrd Deep Audit + Style Map
Purpose:
- Build full snapshot of builder UI and canvas components.
- Build element -> style mapping for all component wrappers.

How to run:
1) Open Carrd builder URL in browser.
2) Open DevTools Console.
3) Paste script and run.
4) Wait until completion log appears and JSON file downloads.

Optional runtime config:
window.__CarrdDeepAuditConfig = {
  waitMs: 260,              // delay after each element select
  maxElements: 9999,        // cap for scan
  includePanelTabStats: false
};
*/
(async function carrdDeepAuditStyleMap() {
  const cfg = Object.assign(
    {
      waitMs: 260,
      maxElements: 9999,
      includePanelTabStats: false,
    },
    window.__CarrdDeepAuditConfig || {}
  );

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function textOf(el) {
    if (!el) return "";
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function normalizeStyleName(v) {
    if (!v) return null;
    const s = String(v).replace(/\s+/g, " ").trim();
    if (!s || s.toLowerCase() === "(none)" || s.toLowerCase() === "none") return null;
    return s;
  }

  function isVisible(el) {
    if (!el) return false;
    return !!(el.offsetParent || el.getClientRects().length);
  }

  function uniqueSelector(el) {
    if (!el || !el.tagName) return "";
    if (el.id) return "#" + el.id;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 7) {
      let part = node.tagName.toLowerCase();
      const dataId = node.getAttribute("data-id");
      const dataAction = node.getAttribute("data-action");
      if (dataId) {
        part += '[data-id="' + dataId + '"]';
      } else if (dataAction) {
        part += '[data-action="' + dataAction + '"]';
      } else if (node.classList && node.classList.length > 0) {
        part += "." + Array.from(node.classList).slice(0, 2).join(".");
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  function styleFromComponentClass(wrapper) {
    if (!wrapper) return null;
    const componentRoot = wrapper.querySelector(":scope > .component > div");
    if (!componentRoot) return null;
    const classes = Array.from(componentRoot.classList || []);
    for (const cls of classes) {
      if (cls.startsWith("--style-")) return normalizeStyleName(cls.replace(/^--style-/, ""));
      if (cls.startsWith("style-")) return normalizeStyleName(cls.replace(/^style-/, ""));
    }
    return null;
  }

  function readStyleFromDropdown(panel) {
    if (!panel) return null;
    const dropdown = panel.querySelector(".style-dropdown");
    if (!dropdown) return null;

    const explicit = dropdown.querySelector(
      ".item.active, .option.active, [aria-selected='true'], option:checked"
    );
    if (explicit) {
      return normalizeStyleName(textOf(explicit));
    }

    const valueNode = dropdown.querySelector(
      ".value, .current, .label, .selected, .button, .title"
    );
    if (valueNode) {
      return normalizeStyleName(textOf(valueNode));
    }

    const select = dropdown.querySelector("select");
    if (select && select.options && select.selectedIndex >= 0) {
      return normalizeStyleName(select.options[select.selectedIndex].textContent);
    }

    return normalizeStyleName(textOf(dropdown));
  }

  function panelTabStats(panel) {
    if (!panel) return null;
    const tabs = Array.from(panel.querySelectorAll("header li"));
    const result = [];
    for (let i = 0; i < tabs.length; i++) {
      const li = tabs[i];
      li.click();
      result.push({
        index: i,
        name: textOf(li),
        active: li.classList.contains("active"),
        fieldCount: panel.querySelectorAll(
          "form section.active input, form section.active select, form section.active textarea, form section.active [contenteditable='true']"
        ).length,
      });
    }
    return result;
  }

  function collectMenuActions() {
    const menu = document.querySelector("#menu");
    if (!menu) return { exists: false, actions: [] };
    const actions = Array.from(menu.querySelectorAll("[data-action]")).map((el) => ({
      action: el.getAttribute("data-action"),
      label: textOf(el.querySelector(".label")) || textOf(el).slice(0, 80),
      visible: isVisible(el),
      selector: uniqueSelector(el),
    }));
    return {
      exists: true,
      className: menu.className || "",
      actions,
      uniqueActions: Array.from(new Set(actions.map((a) => a.action))).sort(),
    };
  }

  function collectControls() {
    return Array.from(
      document.querySelectorAll('#canvas .component-wrapper[data-type="control"][data-id]')
    ).map((el, index) => ({
      index,
      dataId: el.getAttribute("data-id"),
      text: textOf(el).slice(0, 120),
      selector: uniqueSelector(el),
    }));
  }

  function getParentDataId(wrapper) {
    if (!wrapper) return null;
    const parent = wrapper.parentElement
      ? wrapper.parentElement.closest(".component-wrapper[data-id]")
      : null;
    return parent ? parent.getAttribute("data-id") : null;
  }

  function inferInsertAnchors(topLevelItems, controls) {
    const controlByText = {};
    controls.forEach((c) => {
      const key = c.text.toLowerCase();
      controlByText[key] = c.dataId;
    });

    const headerEnd =
      controls.find((c) => c.text.toLowerCase().includes("header end")) || null;
    const footerStart =
      controls.find((c) => c.text.toLowerCase().includes("footer start")) || null;

    const headerEndIndex = headerEnd
      ? topLevelItems.findIndex((i) => i.dataId === headerEnd.dataId)
      : -1;
    const suggestedInsertAfter = headerEnd ? headerEnd.dataId : null;
    const suggestedInsertBefore =
      headerEndIndex >= 0 && topLevelItems[headerEndIndex + 1]
        ? topLevelItems[headerEndIndex + 1].dataId
        : null;

    return {
      headerEndDataId: headerEnd ? headerEnd.dataId : null,
      footerStartDataId: footerStart ? footerStart.dataId : null,
      suggestedInsertAfter,
      suggestedInsertBefore,
      controlByText,
    };
  }

  const wrappers = Array.from(
    document.querySelectorAll("#canvas .component-wrapper[data-id][data-type]")
  ).slice(0, cfg.maxElements);

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      url: location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      config: cfg,
    },
    root: {
      bodyId: document.body ? document.body.id || "" : "",
      bodyClass: document.body ? document.body.className || "" : "",
      hasCanvas: !!document.querySelector("#canvas"),
      hasMenu: !!document.querySelector("#menu"),
      hasUiWrapper: !!document.querySelector(".ui-wrapper"),
    },
    menu: collectMenuActions(),
    controls: collectControls(),
    components: {
      total: wrappers.length,
      byType: {},
      items: [],
    },
    styleMap: {
      byStyle: {},
      noStyleCount: 0,
    },
  };

  console.log("[Deep Audit] started. elements:", wrappers.length);

  for (let i = 0; i < wrappers.length; i++) {
    const wrapper = wrappers[i];
    const dataId = wrapper.getAttribute("data-id");
    const dataType = wrapper.getAttribute("data-type");
    report.components.byType[dataType] = (report.components.byType[dataType] || 0) + 1;

    const clickTarget = wrapper.querySelector(":scope > .component") || wrapper;
    try {
      wrapper.scrollIntoView({ block: "center", inline: "nearest" });
      clickTarget.click();
    } catch (e) {
      // Keep scanning even if this element cannot be selected.
    }
    await sleep(cfg.waitMs);

    const panel = document.querySelector("#properties-panel");
    const panelVisible = !!(panel && panel.classList.contains("visible"));
    const styleClass = styleFromComponentClass(wrapper);
    const stylePanel = panelVisible ? readStyleFromDropdown(panel) : null;
    const finalStyle = stylePanel || styleClass || null;
    const styleKey = finalStyle || "(none)";

    if (!report.styleMap.byStyle[styleKey]) {
      report.styleMap.byStyle[styleKey] = [];
    }
    report.styleMap.byStyle[styleKey].push(dataId);
    if (!finalStyle) report.styleMap.noStyleCount += 1;

    const item = {
      index: i,
      dataId,
      dataType,
      parentDataId: getParentDataId(wrapper),
      className: wrapper.className || "",
      textSample: textOf(wrapper).slice(0, 180),
      selector: uniqueSelector(wrapper),
      styleFromClass: styleClass,
      styleFromPanel: stylePanel,
      styleFinal: finalStyle,
      panel: {
        visible: panelVisible,
        title: panelVisible ? textOf(panel.querySelector(".title")) : "",
      },
    };

    if (cfg.includePanelTabStats && panelVisible) {
      item.panel.tabs = panelTabStats(panel);
    }

    report.components.items.push(item);

    if ((i + 1) % 25 === 0 || i === wrappers.length - 1) {
      console.log("[Deep Audit] progress:", i + 1, "/", wrappers.length);
    }
  }

  const topLevelItems = report.components.items.filter((x) => !x.parentDataId);
  report.topLevel = {
    count: topLevelItems.length,
    items: topLevelItems.map((x) => ({
      dataId: x.dataId,
      dataType: x.dataType,
      style: x.styleFinal,
      textSample: x.textSample,
    })),
  };

  report.anchors = inferInsertAnchors(report.topLevel.items, report.controls);

  const fileName =
    "carrd-deep-snapshot-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
    a.remove();
  }, 1000);

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(json);
    }
  } catch (e) {
    // Ignore clipboard permissions errors.
  }

  console.log("[Deep Audit] done:", fileName);
  console.log("[Deep Audit] summary:", {
    url: report.meta.url,
    components: report.components.total,
    types: report.components.byType,
    styles: Object.keys(report.styleMap.byStyle).length,
    noStyleCount: report.styleMap.noStyleCount,
    suggestedInsertAfter: report.anchors.suggestedInsertAfter,
    suggestedInsertBefore: report.anchors.suggestedInsertBefore,
  });

  return report;
})();
