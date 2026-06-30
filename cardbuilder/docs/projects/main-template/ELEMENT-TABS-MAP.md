---
id: ELEMENT_TABS_MAP
version: 2
status: active
last_updated: 2026-06-29
scan_date: 2026-06-29T10:55:32.601Z
template_url: https://carrd.co/dashboard/4155176224428477/build
source_snapshot: /Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-06-29.json
---

# Element Tabs Map (Flexible)

## Purpose

Provide a live `template-instance` map of Properties Panel tabs per element.
This map is intentionally flexible: different element types can expose different tab sets.

## Scan Result (Live Builder)

- Builder URL: `https://carrd.co/dashboard/4155176224428477/build`
- Total scanned elements: `96`
- Scan mode: `read-only` (`propertiesPanel.showById`, no publish/save)
- Unique tab labels found:
  - `Text`, `Container`, `Image`, `Links`, `Buttons`, `Control`, `Divider`, `Embed`, `List`, `Form`, `Fields`, `Button`, `Icons`, `Appearance`, `Animation`, `Settings`

## Content / Appearance / Animation / Settings Check

- `Appearance`: found
- `Animation`: found
- `Settings`: found
- Literal `Content` label: not found in this template instance

Important:
- the first tab is type-specific (`Text`, `Container`, `Image`, etc.) and acts as the content/config tab for that element type.
- this confirms your point: not every element has the same 4-tab set.

## Pattern Map (All Elements)

- `Text / Appearance / Animation / Settings` -> `42`
- `Container / Appearance / Animation / Settings` -> `21`
- `Image / Appearance / Animation / Settings` -> `11`
- `Buttons / Appearance / Animation / Settings` -> `7`
- `Embed / Settings` -> `4`
- `Control / Settings` -> `3`
- `Divider / Animation / Settings` -> `3`
- `Links / Appearance / Animation / Settings` -> `2`
- `List / Appearance / Animation / Settings` -> `1`
- `Form / Fields / Button / Appearance / Animation / Settings` -> `1`
- `Icons / Appearance / Animation / Settings` -> `1`

## Type Map (Flexible Lookup)

- `container` (21): `Container | Appearance | Animation | Settings`
- `image` (11): `Image | Appearance | Animation | Settings`
- `links` (2): `Links | Appearance | Animation | Settings`
- `buttons` (7): `Buttons | Appearance | Animation | Settings`
- `control` (3): `Control | Settings`
- `text` (42): `Text | Appearance | Animation | Settings`
- `list` (1): `List | Appearance | Animation | Settings`
- `divider` (3): `Divider | Animation | Settings`
- `form` (1): `Form | Fields | Button | Appearance | Animation | Settings`
- `icons` (1): `Icons | Appearance | Animation | Settings`
- `embed` (4): `Embed | Settings`

## Full Per-Element Map

The full `id -> type -> tabs` map for all 96 elements is stored in:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-06-29.json](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/snapshots/template-instance-element-tabs-map-2026-06-29.json)

Use `.value.rows` as the canonical per-element registry for this scan.

## Refresh Procedure

When tabs may have changed:

1. Run:
   - `node cardbuilder/scripts/carrd/cdp-eval.mjs --url-includes "/dashboard/4155176224428477/build" --js-file cardbuilder/scripts/carrd/cdp-tab-map-scan.js`
2. Save a new snapshot under:
   - `cardbuilder/projects/main-template/data/snapshots/`
3. Update this file frontmatter:
   - `last_updated`, `scan_date`, `source_snapshot`
4. Run drift auto-check:
   - `npm run check:tabs-drift --silent`

## Notes

- This is `template-instance` truth, not global `builder-static` canon.
- Do not hardcode "always 4 tabs" in automation logic.
- Prefer runtime detection from the active panel tabs for resilient scripts.
