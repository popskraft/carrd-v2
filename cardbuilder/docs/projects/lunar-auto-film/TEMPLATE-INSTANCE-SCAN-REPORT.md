# Template-Instance Scan Report

## Meta

- Template id: `lunar-auto-film`
- Builder URL: `https://carrd.co/dashboard/6380178126096476/build`
- Published URL: `unknown`
- Scan date: `2026-06-17`
- Scope: `builder-side bootstrap`

## Inputs

- `template-instance-builder-scan.json`
- `template-instance-dom-audit.json`
- `template-instance-style-map.json`
- `template-instance-element-tabs-map-2026-06-17.json`
- `live-plugin-inventory.json`
- `template-vs-repo-plugin-sync.json`

## Builder Snapshot Summary

- Total components: `186`
- Component types: `container 34`, `text 59`, `buttons 23`, `image 20`, `divider 14`, `table 10`, `embed 9`, `control 8`, `list 5`, `links 2`, `gallery 1`, `form 1`
- Top-level items: `54`
- Controls: `8`
- Anchors: `16`
- Embeds: `9`

## Style And Structure Summary

- Style families: `(none)`, `style1`, `style2`, `style3`, `style4`, `style5`, `style6`, `style8`, `style9`, `style10`, `style11`, `style12`, `style13`, `style17`
- Elements without assigned style family: `36`
- Menu actions captured in DOM audit: `41`
- Sections/control rows captured in DOM audit: `8`

## Element Tabs Summary

- Total scanned elements: `186`
- Unique tab labels: `Animation`, `Appearance`, `Button`, `Buttons`, `Container`, `Control`, `Divider`, `Embed`, `Fields`, `Form`, `Gallery`, `Image`, `Links`, `List`, `Settings`, `Table`, `Text`
- New element families versus old `main-template` baseline: `Gallery`, `Table`
- Dominant patterns:
  - `Text | Appearance | Animation | Settings`: `59`
  - `Container | Appearance | Animation | Settings`: `34`
  - `Buttons | Appearance | Animation | Settings`: `23`
  - `Image | Appearance | Animation | Settings`: `20`
  - `Divider | Animation | Settings`: `14`
  - `Table | Appearance | Animation | Settings`: `10`
  - `Embed | Settings`: `9`

## Live Plugin Inventory

Strong builder evidence:

- `accordeon` via `embed05 Accordeon`
- `faq` via `embed02 FAQ`
- `floating-cta` via `embed07 Floating CTA`
- `no-loadwaiting` via `embed03 No-loadwaiting`
- `slider` via `embed04 JS Stop Slider On Start`

Weak-only signals, not trusted as installed plugin proof:

- `columns`
- `header-nav`
- `modal`
- `typography`

## Repo Sync Result

Direct mismatches against repo plugin surfaces:

- `cards`: exists in `src` and `dist`, not detected live
- `cookie-banner`: exists in `src` and `dist`, not detected live
- `grid-cluster`: exists in `src` and `dist`, not detected live
- `header-nav-v2`: exists in `src`, missing from `dist`
- `shopping-cart`: exists in `src` and `dist`, not detected live
- `switcher`: exists in `src` and `dist`, not detected live

## Limits

- Published-site scan is not included yet because the published URL is not confirmed in canon.
- Plugin inventory is builder-only for now.
- This package is safe for draft-side Carrd work, not for builder-vs-published sync claims.

## Final Assessment

- Site package bootstrap: `complete`
- Builder-side template-instance baseline: `complete`
- Published-sync baseline: `pending`
- Ready for draft-side work in Carrd Builder: `yes`
- Ready for published-state audit or rollout validation: `not yet`
