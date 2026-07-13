# Template-Instance Scan Report

## Meta

- Template id: `main-template`
- Builder URL: `https://carrd.co/dashboard/4155176224428477/build`
- Published URL: `https://mini.crd.co/`
- Refresh date: `2026-07-13`
- Refresh mode: `read-only canonical remap after full MBX reinstall`

## Inputs

- `template-instance-builder-scan.json`
- `template-instance-element-tabs-map-2026-07-13.json`
- `template-instance-dom-audit.json`
- `template-instance-style-map.json`
- `published-site-plugin-scan.json`
- `live-plugin-inventory.json`
- `template-vs-repo-plugin-sync.json`
- `mcp-targets.json`

## Builder Summary

- Total components: `122`
- Component types: `container=27`, `image=10`, `links=2`, `buttons=7`, `control=3`, `text=49`, `list=1`, `divider=3`, `form=1`, `icons=1`, `embed=18`
- Embed elements: `18`
- Tabs map status: `refreshed`
- Deterministic MCP target map status: `re-synced`

## Runtime Contract Summary

- Builder draft embed contract:
  - `embed01` — `No Loadwaiting (HEAD)`
  - `embed02` — `Theme Design System (HEAD)`
  - `embed03` — site-owned `Theme Customizing (HEAD)` slot with placeholder `<!-- Custom code here -->`
  - `embed04..10` — `Accordeon`, `Cookie Banner`, `Faq`, `Floating Cta`, `Grid Cluster`, `Header Nav`, `Modal`
  - `embed11/12` — `Shopping Cart 1/2`, `Shopping Cart 2/2`
  - `embed13/14` — `Slider 1/2`, `Slider 2/2`
  - `embed15..17` — `Stacker`, `Switcher`, `Typography`
  - `embed18` — `Design Palette`
- Published asset contract:
  - still historical and not re-approved as canonical in this pass
  - save/publish boundary remains unproven
  - published evidence is retained only as drift context, not as a PASS signal

## Live Plugin Inventory

- Builder draft embeds that normalized to current `dist`: `embed01`, `embed04..11`, `embed13..18`
- Formatting-only drift still observed against raw `dist` text:
  - `embed02` — Carrd/MBX removed CSS indentation from `theme-design-system.html`
  - `embed12` — Carrd/MBX collapsed indentation inside the `shopping-cart` part 2 template literal
- Builder draft contract note:
  - `cards` is intentionally absent from the current Builder draft and `data-cards=*` markup is no longer present
- Site-owned custom layer:
  - `embed03` is reserved as a custom `Head` slot and must not be auto-overwritten from `dist`

## Repo Sync Result

- Repo plugin roots with current Builder draft coverage: `14/16` repo plugins are installed in the draft, plus `theme-design-system` and the site-owned `embed03` customization slot
- `src/` vs `dist/`: no missing plugin distributives detected
- Current intentional absences:
  - `cards` is not installed in the current Builder draft
- Current sync model:
  - per-embed inline contract for the Builder draft
  - historical published scan kept only as context

## Drift Summary

- Resolved during this refresh:
  - stale `106/6` tabs snapshot and builder scan
  - stale MCP target sync metadata
  - stale live inventory that still described the pre-reinstall contract
  - wrong `refresh-builder-plugins.mjs` mapping that still treated `embed03/04` as legacy Shopping Cart JS/CSS
- Remaining blockers:
  - `check:tabs-drift` still reports drift because the previous baseline was `2026-07-07`
  - full persistence matrix is still incomplete: stable-container custom `data-*` and safe custom `id` are proven, but a real modal product attr (`data-modal-close-on-overlay=off` on `container12`) persisted in Builder and did not appear in published HTML on `2026-07-13`
  - embed edits and broader structural persistence are not yet proven

## Final Assessment

- Template-instance operational truth: `current for Builder draft only`
- Builder draft vs published runtime contract: `partially proven with a real product-attr publish failure`
- Ready for deterministic read/write tooling: `yes for controlled persistence probes on safe targets; no PASS yet for real product attrs, embed-level, or general structural apply/persistence`
- Current evidence owners:
  - `cardbuilder/projects/main-template/data/snapshots/template-instance-builder-scan.json`
  - `cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-07-13.json`
  - `cardbuilder/projects/main-template/data/snapshots/template-instance-dom-audit.json`
  - `cardbuilder/projects/main-template/data/style-maps/template-instance-style-map.json`
  - `cardbuilder/projects/main-template/data/inventories/published-site-plugin-scan.json`
  - `cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json`
  - `cardbuilder/projects/main-template/data/diffs/template-vs-repo-plugin-sync.json`
  - `cardbuilder/projects/main-template/data/manifests/mcp-targets.json`
