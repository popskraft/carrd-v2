# Template-Instance Scan Report

## Meta

- Template id: `main-template`
- Builder URL: `https://carrd.co/dashboard/4155176224428477/build`
- Published URL: `https://mini.crd.co/`
- Refresh date: `2026-07-07`
- Refresh mode: `read-only operational truth refresh`

## Inputs

- `template-instance-builder-scan.json`
- `template-instance-element-tabs-map-2026-07-07.json`
- `published-site-plugin-scan.json`
- `live-plugin-inventory.json`
- `template-vs-repo-plugin-sync.json`
- `mcp-targets.json`

## Builder Summary

- Total components: `106`
- Component types: `container=25`, `image=11`, `links=2`, `buttons=7`, `control=3`, `text=46`, `list=1`, `divider=3`, `form=1`, `icons=1`, `embed=6`
- Embed elements: `6`
- Tabs map status: `refreshed`
- Deterministic MCP target map status: `re-synced`

## Runtime Contract Summary

- Builder draft embed contract:
  - `embed08` — `no-loadwaiting` CDN script in `Head`
  - `embed03` — `theme-design-tokens` inline `Head` embed
  - `embed14` — critical mobile header CSS + `theme-runtime.min.css` in `Head`
  - `embed02` — `theme-runtime.min.js` in `Body End`
  - `embed04` — `shopping-cart` CDN CSS + JS in `Body End`
  - `embed05` — `cookie-banner` CDN CSS + JS in `Body End`
- Published asset contract:
  - scripts: `no-loadwaiting`, `theme-runtime`, `shopping-cart`, `cookie-banner`
  - styles: `theme-runtime`, `shopping-cart`, `cookie-banner`
  - mutable `@main` references: `0`
  - legacy `data-*-v2` markers: `0`

## Live Plugin Inventory

- Bundled via `theme-runtime`: `accordeon`, `cards`, `faq`, `floating-cta`, `grid-cluster`, `header-nav`, `modal`, `slider`, `stacker`, `switcher`, `typography`
- Added separately: `no-loadwaiting`, `shopping-cart`, `cookie-banner`
- Published runtime globals observed: `CarrdAccordeon`, `CarrdCookieBanner`, `CarrdModal`, `CarrdShoppingCart`, `CarrdSlider`, `CarrdStacker`, `CarrdSwitcher`, `CarrdTypography`
- Direct published markup markers observed:
  - `cards=1`
  - `faq=1`
  - `gridCluster=5`
  - `headerNav=2`
  - `modal=1`
  - `noLoadwaiting=1`
  - `slider=7`
  - `stacker=3`
  - `switcher=10`
  - `cookieBanner=1`
- Provisioned without direct page markers in this scan:
  - `accordeon`
  - `floating-cta`
  - `shopping-cart`
  - `typography`

## Repo Sync Result

- Repo plugin roots with current live runtime coverage: `14/14`
- `src/` vs `dist/`: no missing plugin distributives detected
- Bundle/add-on sync status on `mini.crd.co`: `match`
- Current sync model: bundle-aware runtime contract, not legacy per-embed plugin-title matching

## Drift Summary

- Resolved during this refresh:
  - tabs snapshot drift between `96` and `106` elements
  - stale published inventory that still described inline `v0.1.15` assets
  - stale MCP target metadata that still carried `data-switcher-v2-mode=cluster`
  - tab-resolution bug where MCP sync could pick the published tab before the Builder tab
- Current live structure remap:
  - the `2026-07-11` live top-level container map is now reflected in `cardbuilder/projects/main-template/data/inventories/container-registry.json`
  - this report still describes the historical `2026-07-07` scan snapshot and should be read as historical context, not the current structural map
- Remaining note:
  - `template-instance-dom-audit.json` and `template-instance-style-map.json` were not re-captured in this pass

## Final Assessment

- Template-instance operational truth: `current`
- Builder draft vs published runtime contract: `aligned`
- Ready for deterministic read/write tooling: `yes, for the refreshed target map and current runtime contract`
- Current evidence owners:
  - `cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-07-07.json`
  - `cardbuilder/projects/main-template/data/inventories/published-site-plugin-scan.json`
  - `cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json`
  - `cardbuilder/projects/main-template/data/diffs/template-vs-repo-plugin-sync.json`
  - `cardbuilder/projects/main-template/data/manifests/mcp-targets.json`
