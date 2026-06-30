# Grid Cluster

## Version

- Version: `2.0.0`
- Build date (UTC): `2026-06-30`

## Installation

### CDN Bundle (recommended)

If your site already has the CDN embeds installed (`theme-core.min.css` in Head and `theme-core.min.js` in Body End), this plugin is already active — no extra steps needed.

To install CDN embeds: see the root `README.md` → **CDN Bundle** section.

### CDN Individual (single plugin)

Use this when you want jsDelivr links for selected plugins instead of the full bundle.

**Step 1 — Install shared theme header (once per site)**

In Carrd add `Embed → Code → Hidden → Head` and paste:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-design-tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-ui.css">
```

**Step 2 — Install this plugin through CDN**

1. Open `grid-cluster-cdn.html` from this folder.
2. Paste the `<!-- Head -->` part into `Hidden → Head`.
3. Paste the `<!-- Body End -->` part into `Hidden → Body End` when present.
4. Publish the page and refresh.

### Inline Embed (single plugin)

Use this when installing only selected plugins without the CDN bundle.

**Step 1 — Install theme header (once per site)**

1. Open `theme-design-system.html` from the `dist/` folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Head` and paste.

**Step 2 — Install this plugin**

1. Open `grid-cluster-embed.html` from this folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Body End` and paste.
4. Publish the page and refresh.

## How To Change Styles

If this README contains a `:root { ... }` block later, do not paste it into the plugin code block itself.

Create a separate hidden `Head` style block below `theme-design-system.html` and place the overrides there.

Example of a separate settings block:

```html
<style>
:root {
  /* Put your overrides here */
}
</style>
```

Place that style block below `theme-design-system.html`.

---

Groups consecutive Carrd containers into a responsive CSS grid. Add one `data-grid` name to each container — the plugin handles wrapping and responsive layout automatically.

No coding required. Use `data-grid` and `data-grid-columns` and the plugin does the rest.

---

## What You Do in Carrd

1. Add the **Container** elements that should form a grid row.
2. Place them one after another — no unrelated blocks between them.
3. Open each container's attributes panel and add the same group name, for example `data-grid=features`.
4. Add `data-grid-columns=3` to the first container when you want an explicit desktop column count.

All consecutive containers with the same `data-grid` value form one grid. All gap and responsive controls live on the **first container** in the cluster.

---

## How It Works in Carrd

- Consecutive containers with the same `data-grid` name are wrapped into one responsive grid.
- The first container acts as the cluster controller for columns, gaps, and responsive overrides.
- New setups should use `data-grid-gap` and `data-grid-gap-mobile` for spacing.
- Legacy helper classes and `data-gap*` remain compatibility helpers only.

---

## How To Check That It Works

1. Publish or refresh the page.
2. The containers should line up in a grid.
3. Resize to mobile and confirm the layout collapses as expected.

If it stays single-column, check that the containers are consecutive and the `data-grid` value matches exactly.

---

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed only if you need to change grid detection:

```html
<script>
window.CarrdPluginOptions = {
    gridCluster: {
        enabled: true,
        gridAttribute: 'data-grid',
        gridClasses: ['grid-2', 'grid-3', 'grid-4', 'grid-5', 'grid-6']
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptions` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `enabled` | `true` | Turns grid cluster processing on or off |
| `gridAttribute` | `data-grid` | Attribute used to detect v2 clusters |
| `gridClasses` | `['grid-2'...'grid-6']` | Legacy classes used to detect clusters |
| `widthClasses` | `{ 'w-20': '20%' ... }` | Width helpers for desktop column sizing. Custom entries merge with defaults |

---

## Advanced: Helper Classes

Add responsive controls to the **first container** in the cluster. Add width controls to the specific item that needs the width.

| Attribute | What it does |
|-------|-------------|
| `data-grid-sm=1` ... `data-grid-sm=6` | Sets mobile columns at `<=736px` |
| `data-grid-md=1` ... `data-grid-md=6` | Sets tablet / small desktop columns at `737px-1024px` |
| `data-grid-lg=1` ... `data-grid-lg=6` | Sets large desktop columns at `>=1280px` |
| `data-grid-justify=true` | Stretches the cluster edge-to-edge |
| `data-grid-width=50%` | Sets custom desktop width for one item |

Example:

```txt
data-grid-sm=2 data-grid-md=3 data-grid-columns=4 data-grid-lg=5
```

This gives 2 columns on mobile, 3 on tablet / small desktop, 4 on desktop, and 5 on large desktop.

---

## Advanced: Gap Control

Add to the **first container** in a cluster to control the gap for that cluster only:

| Attribute | What it does |
|-----------|-------------|
| `data-grid-gap=VALUE` | Row and column gap for all breakpoints. Plain number = rem, or any CSS value |
| `data-grid-gap-mobile=VALUE` | Row and column gap on mobile only (≤736px). Falls back to `data-grid-gap` if not set |

Examples:
- `data-grid-gap=1.5` → `1.5rem` row and column gap on all breakpoints
- `data-grid-gap=2 data-grid-gap-mobile=0.75` → `2rem` desktop, `0.75rem` mobile
- `data-grid-gap=0` → no gap

---

## Design

Add a **Code** embed with a `<style>` tag and override any of these variables:

```html
<style>
:root {
    --theme-grid-column-gap: 1rem;
    --theme-grid-column-gap-sm: 0.5rem;
    --theme-grid-column-gap-desktop: 1.5rem;
    --theme-grid-column-gap-desktop-large: 2rem;
    --theme-grid-row-gap: 1rem;
    --theme-grid-row-gap-desktop: 2rem;
}
</style>
```

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-grid-column-gap` | `1rem` | Column gap on mobile |
| `--theme-grid-column-gap-sm` | `0.5rem` | Column gap at small breakpoint |
| `--theme-grid-column-gap-desktop` | `1.5rem` | Column gap on desktop |
| `--theme-grid-column-gap-desktop-large` | `2rem` | Column gap on large desktop |
| `--theme-grid-row-gap` | `1rem` | Row gap on mobile |
| `--theme-grid-row-gap-desktop` | `2rem` | Row gap on desktop |

Legacy fallback: `data-gap` and `data-gap-mobile` still work on older pages.

`data-grid-gap` on a specific cluster overrides these tokens for that cluster only.
