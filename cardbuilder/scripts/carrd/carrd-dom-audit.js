/*
Carrd Builder DOM Audit
Usage:
1) Open Carrd builder page in browser.
2) Open DevTools Console.
3) Paste this script and run.
4) Download the generated JSON file.
*/
(function carrdDomAudit() {
  function textOf(el) {
    if (!el) return "";
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function uniqueSelector(el) {
    if (!el || !el.tagName) return "";
    if (el.id) return "#" + el.id;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 6) {
      let part = node.tagName.toLowerCase();
      if (node.getAttribute("data-id")) {
        part += '[data-id="' + node.getAttribute("data-id") + '"]';
      } else if (node.getAttribute("data-action")) {
        part += '[data-action="' + node.getAttribute("data-action") + '"]';
      } else {
        const cls = (node.className || "")
          .toString()
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2);
        if (cls.length) part += "." + cls.join(".");
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  function collectMenu() {
    const menu = document.querySelector("#menu");
    if (!menu) return { exists: false, actions: [] };
    const actions = Array.from(menu.querySelectorAll("[data-action]")).map(
      (el, index) => ({
        index,
        action: el.getAttribute("data-action"),
        label: textOf(el.querySelector(".label")) || textOf(el).slice(0, 60),
        visible: !!(el.offsetParent || el.getClientRects().length),
        selector: uniqueSelector(el),
      })
    );
    return {
      exists: true,
      className: menu.className || "",
      actions,
    };
  }

  function collectPropertiesPanel() {
    const panel = document.querySelector("#properties-panel");
    if (!panel) return { exists: false };
    const tabs = Array.from(panel.querySelectorAll("header li")).map((li, i) => ({
      index: i,
      text: textOf(li),
      active: li.classList.contains("active"),
    }));
    const sections = Array.from(panel.querySelectorAll("form section")).map(
      (section, i) => {
        const fields = Array.from(
          section.querySelectorAll("input, textarea, select, [contenteditable='true']")
        ).map((field) => ({
          tag: field.tagName.toLowerCase(),
          type: field.getAttribute("type") || null,
          name: field.getAttribute("name") || null,
          id: field.getAttribute("id") || null,
          className: field.className || "",
          valuePreview: (field.value || textOf(field)).slice(0, 120),
        }));
        return {
          index: i,
          active: section.classList.contains("active"),
          fieldCount: fields.length,
          fields,
        };
      }
    );
    return {
      exists: true,
      className: panel.className || "",
      visible: panel.classList.contains("visible"),
      tabs,
      sections,
    };
  }

  function collectComponents() {
    const wrappers = Array.from(
      document.querySelectorAll("#canvas .component-wrapper[data-id][data-type]")
    );
    const byType = {};
    const items = wrappers.map((el) => {
      const dataId = el.getAttribute("data-id");
      const dataType = el.getAttribute("data-type");
      byType[dataType] = (byType[dataType] || 0) + 1;

      const parentWrapper = el.parentElement
        ? el.parentElement.closest(".component-wrapper[data-id]")
        : null;

      const textSample = textOf(el).slice(0, 180);
      return {
        dataId,
        dataType,
        className: el.className || "",
        parentDataId: parentWrapper ? parentWrapper.getAttribute("data-id") : null,
        childWrapperCount: el.querySelectorAll(":scope .component-wrapper[data-id]").length,
        textSample,
        selector: uniqueSelector(el),
      };
    });

    return {
      total: wrappers.length,
      byType,
      items,
    };
  }

  function collectSections() {
    const controls = Array.from(
      document.querySelectorAll('#canvas .component-wrapper[data-type="control"][data-id]')
    );
    return controls.map((el, index) => ({
      index,
      dataId: el.getAttribute("data-id"),
      text: textOf(el).slice(0, 120),
      className: el.className || "",
      selector: uniqueSelector(el),
    }));
  }

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      url: location.href,
      title: document.title,
      userAgent: navigator.userAgent,
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
    menu: collectMenu(),
    propertiesPanel: collectPropertiesPanel(),
    sections: collectSections(),
    components: collectComponents(),
  };

  const fileName =
    "carrd-dom-audit-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
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

  console.log("[Carrd DOM Audit] saved file:", fileName);
  console.log("[Carrd DOM Audit] summary:", {
    totalComponents: report.components.total,
    componentTypes: report.components.byType,
    controls: report.sections.length,
    menuActions: report.menu.actions.length,
  });

  return report;
})();
