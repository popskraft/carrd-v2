(() => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const txt = (el) =>
    (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();

  async function run() {
    const builder = window.app?.builder;
    const propertiesPanel = builder?.ui?.propertiesPanel;
    if (!builder?.site?.components) {
      return { error: "builder-not-ready" };
    }
    if (!propertiesPanel) {
      return { error: "properties-panel-not-ready" };
    }

    const wrappers = Array.from(
      document.querySelectorAll("#canvas .component-wrapper[data-id][data-type]")
    );

    const seen = new Set();
    const elements = [];
    for (const wrapper of wrappers) {
      const id = wrapper.getAttribute("data-id");
      const type = wrapper.getAttribute("data-type") || "unknown";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      elements.push({ id, type });
    }

    const rows = [];
    for (const el of elements) {
      const component = builder.get?.(el.id) || builder.site.components?.[el.id];
      if (!component) {
        rows.push({ id: el.id, type: el.type, found: false, tabs: [] });
        continue;
      }

      try {
        propertiesPanel.showById(el.id, true);
      } catch {
        rows.push({ id: el.id, type: el.type, found: false, tabs: [] });
        continue;
      }

      await sleep(140);
      const tabs = Array.from(document.querySelectorAll("#properties-panel header li"))
        .map((li) => txt(li))
        .filter(Boolean);
      rows.push({
        id: el.id,
        type: el.type,
        builderType: component.type || "unknown",
        shownId: propertiesPanel.component?.id || null,
        shownType: propertiesPanel.component?.type || null,
        found: true,
        tabs,
      });
    }

    const allTabs = Array.from(new Set(rows.flatMap((r) => r.tabs))).sort();
    const patternMap = new Map();
    const byType = {};

    for (const row of rows) {
      const key = row.tabs.join(" | ");
      if (!patternMap.has(key)) {
        patternMap.set(key, { tabs: row.tabs, count: 0, sampleIds: [] });
      }
      const pattern = patternMap.get(key);
      pattern.count += 1;
      if (pattern.sampleIds.length < 8) pattern.sampleIds.push(row.id);

      const typeKey = row.builderType || row.type;
      if (!byType[typeKey]) byType[typeKey] = { count: 0, patternCounts: {} };
      byType[typeKey].count += 1;
      byType[typeKey].patternCounts[key] = (byType[typeKey].patternCounts[key] || 0) + 1;
    }

    return {
      scannedAt: new Date().toISOString(),
      url: location.href,
      title: document.title,
      totalElements: rows.length,
      allTabs,
      hasTargetTabs: {
        Content: allTabs.includes("Content"),
        Appearance: allTabs.includes("Appearance"),
        Animation: allTabs.includes("Animation"),
        Settings: allTabs.includes("Settings"),
      },
      patterns: Array.from(patternMap.values()).sort((a, b) => b.count - a.count),
      byType,
      rows,
    };
  }

  return run();
})();
