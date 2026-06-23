# Template-Instance Scan Report

## Meta

- Template id: `main-template`
- Builder URL: `https://carrd.co/dashboard/4155176224428477/build`
- Published URL: `https://mini.crd.co/`
- Scan date: `2026-04-06` (post-publish refresh)
- Operator: `user + codex workflow`

## Inputs

- `template-instance-builder-scan.json`
- `template-instance-dom-audit.json`
- `template-instance-style-map.json`
- `published-site-plugin-scan.json`
- `live-plugin-inventory.json`
- `template-vs-repo-plugin-sync.json`

## Builder Snapshot Summary

- Total components: `80`
- Component types: `{'container': 15, 'image': 10, 'links': 2, 'control': 4, 'text': 32, 'list': 1, 'buttons': 3, 'divider': 3, 'form': 1, 'embed': 8}`
- Component types: `{'container': 15, 'image': 10, 'links': 2, 'control': 4, 'text': 32, 'list': 1, 'buttons': 3, 'divider': 3, 'form': 1, 'embed': 9}`
- Top-level controls: `4`
- Anchors: `8`
- Embeds: `9`

## Style and Structure Summary

- Top-level ordering: `32` top-level items captured
- Style families in use: `['(none)', 'style1', 'style2', 'style3', 'style4', 'style5', 'style6', 'style7']`
- Controls and anchors map summary: `{'scrollpoint04 / section04': 'control04', '#shopping-cart': 'control03', '(#exclude-section-bellow-the-line)': 'control01', 'scrollpoint02 / section02': 'control02'}`
- Notable hidden sections or control boundaries: `section04`, `#shopping-cart`, `exclude-section-bellow-the-line`, `section02`

## Live Plugin Inventory

| Plugin | Builder evidence | Published evidence | Confidence | Notes |
|--------|------------------|-------------------|------------|-------|
| cards | yes | yes | high | builder:embed-title `embed05`; published style/script pair |
| columns | no | no | low | legacy plugin intentionally removed from live baseline |
| cookie-banner | no | no | low |  |
| faq | yes | yes | high | builder:embed-title `embed01`; published style/script pair |
| grid-cluster | yes | yes | high | builder:embed-title `embed09`; published style/script pair |
| header-nav | no | no | low |  |
| modal | yes | yes | high | builder:embed-title `embed07`; published style/script/global |
| no-loadwaiting | yes | yes | high | builder:embed-title `embed08`; published script |
| shopping-cart | yes | yes | high | builder:embed-title `embed03` + `embed04`; published style/script/global |
| slider | yes | yes | high | builder:embed-title `embed06`; published style/script/global |
| typography | no | no | low | not installed as a dedicated live plugin layer |

## Repo Sync Result

| Plugin | In `src` | In `dist` | Detected live | Mismatch type | Recommended action |
|--------|----------|-----------|---------------|---------------|--------------------|
| cards | yes | yes | yes | none | none |
| columns | yes | yes | no | repo-only | keep absent; legacy plugin intentionally removed from live baseline |
| cookie-banner | yes | yes | no | repo-only | optional or intentionally absent |
| faq | yes | yes | yes | none | none |
| grid-cluster | yes | yes | yes | none | none |
| header-nav | yes | yes | no | repo-only | optional or intentionally absent until stabilized and selected |
| modal | yes | yes | yes | none | none |
| no-loadwaiting | yes | yes | yes | none | none |
| shopping-cart | yes | yes | yes | none | none |
| slider | yes | yes | yes | none | none |
| typography | yes | yes | no | repo-only | optional or intentionally absent |

## Drift Summary

- Live-only plugins: `[]`
- Repo-only plugins: `['columns', 'cookie-banner', 'header-nav', 'typography']`
- Builder/published mismatch: `none detected for the active live plugin set after post-publish rescan`
- Structural mismatches: `live template contains 80 builder components with 9 embeds and style families ['(none)', 'style1', 'style2', 'style3', 'style4', 'style5', 'style6', 'style7']`

## Final Assessment

- Template-instance scan completeness: `post-publish raw scans + inventory + sync diff complete`
- Ready for plugin sync work: `yes`
- Follow-up required: `only optional plugin/product-scope decisions remain`
- Current decision-oriented follow-up doc: `PLUGIN-SYNC-REVIEW.md`
- Owner-approved sync direction now realized: `grid-cluster` is live, `columns` is removed from the universal template baseline, and the target block/grid pair is `cards + grid-cluster`
