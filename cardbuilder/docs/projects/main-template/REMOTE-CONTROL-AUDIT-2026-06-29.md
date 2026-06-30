# Carrd Remote Control Audit — 2026-06-29

## Purpose

Record current evidence for deterministic remote control of Builder `4155176224428477`.

## Observed Facts

- CDP endpoint `127.0.0.1:9222` is reachable and authenticated.
- Builder URL, `window.app.builder`, `site.components`, and `ui.propertiesPanel` are available.
- Reconnect test: `20/20` independent CDP reads passed in `6s`.
- Live canvas contains `96` elements across `11` types.
- Properties Panel opened for `96/96` element IDs; every `shownId` matched the requested ID.
- Live types: `text`, `container`, `image`, `links`, `buttons`, `control`, `list`, `divider`, `form`, `icons`, `embed`.
- Page, Background, Sections, and Publish panels open through current Builder action APIs.
- The site was not changed or published; Builder dirty state remained false.

## Drift

- Canonical tabs snapshot from 2026-04-16 contains `88` elements; live state contains `96`.
- Added IDs: `buttons05-07`, `container17-21`, `embed14`, `icons01`, `text35-42`.
- Removed IDs: `control01`, `embed03-07`, `embed09-11`, `embed13`.
- `icons` is a newly represented live type.
- `npm run check:tabs-drift` is not defined in the root package.
- The direct drift checker skips because only one tabs snapshot exists.
- Previous readiness logic checked artifact existence but not scan age and incorrectly returned `safe-to-edit: true`.

## Coverage Gaps

- Add menu exposes `video`, `audio`, `gallery`, `timer`, `slideshow`, `widget`, and `table`; the initial template had no instances of these types.
- Operator-approved draft fixtures now cover `video01`, `gallery01`, `slideshow01`, and `table01` at the root `main` level.
- `audio`, `widget`, and `timer` are intentionally excluded from the current fixture scope.
- No generic governed content-patch command exists for all component types. Current deterministic writes are operation-specific.
- `admincarrd` publishes exported ZIP sites; it does not control the live Carrd Builder.
- No Carrd MCP server exists. MCP should remain a thin adapter over a validated control core, not the first implementation layer.

## Current Readiness

| Flag | Value | Evidence |
|---|---|---|
| connected | yes | CDP status and reconnect test |
| authenticated | yes | Builder runtime loaded at target dashboard URL |
| builder-ready | yes | Builder, components, UI panel, and action APIs available |
| state-mapped | partial | all 96 live elements mapped; 7 Add-menu types absent |
| docs-sync-status | drift | live element set differs from stored snapshots/docs |
| safe-to-edit | no | stale evidence and incomplete element-type fixture coverage |

## Draft Fixture Pass

- Status: unsaved/unpublished Builder draft; operator save/publish remains pending.
- Component total after fixture creation: `100`.
- `video01`: YouTube embed with controls and privacy mode; valid Big Buck Bunny URL.
- `gallery01`: two reused site assets, captions, alt text, lightbox, two-column layout.
- `slideshow01`: two reused site assets, crossfade transition, minimal navigation.
- `table01`: four headings and four structured fixture rows in grid mode.
- All four fixtures are direct children of `#canvas .--site-main > .--inner` and have no component-wrapper parent.
- Full tab scan: `100/100` elements opened with matching `shownId`.
- Field counts: video `81`, gallery `96`, slideshow `61`, table `105` unique named fields across their tabs.
- No `audio`, `widget`, or `timer` components were created.

## Done

- Read-only live audit is reproducible.
- Existing live elements are addressable.
- Remaining blockers are explicit and require controlled fixture creation plus refreshed snapshots.
