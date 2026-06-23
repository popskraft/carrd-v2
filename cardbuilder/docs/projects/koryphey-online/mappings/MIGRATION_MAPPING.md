# MIGRATION_MAPPING.md

## Source / Target

- Source (Site 2): `https://carrd.co/dashboard/4544177104830762/build`
- Target (Site 1): `https://carrd.co/dashboard/8089177104819774/build`

## Scan Summary

- Site 1: `265` components, `5` control markers, `16` styles, `44` without style.
- Site 2: `306` components, `6` control markers, `19` styles, `65` without style.

## Section Anchors

- Site 1:
  - Header End: `control04`
  - Footer Start: `control02`
  - Suggested insert point: after `control04`, before `container06`
- Site 2:
  - Header End: `control06`
  - Footer Start: `control07`

## Style Compatibility

Common styles:
- `(none)`, `style1`, `style2`, `style3`, `style4`, `style5`, `style6`, `style7`, `style8`, `style9`, `style10`, `style11`, `style12`, `style14`, `style15`

Only Site 1:
- `style17`

Only Site 2:
- `style13`, `style18`, `style19`, `style21`

## Recommended Transfer Scope (Phase 1)

Transfer all content blocks from Site 2 between Header/ Footer with approved exclusions.

Priority add candidates (likely missing or materially different in Site 1):
1. `container20` (`style18`) - offer for future first-graders
2. `container31` (`style19`) - "Как поступить" step block
3. `container11` (`style18`) - schedule + documents block
4. `container40` (`style18`) - "Почему нас выбирают" long proof block
5. `container46` (`style15`) - structural helper block used near carousel/video area

Approved exclusions:
- all `form` elements (for current scope: `form01`)
- full sections `#order` and `#thankyou`
- technical embeds in transfer zone (`embed08`, `embed07`)

## Style Handling Proposal

- For common style names, keep the same style token when copying.
- For any style absent in Site 1 (`style13`, `style18`, `style19`, `style21`), assign default container style `Main`.

## Operational Constraint

- Agent must not execute Save/Publish. Operator performs final save/publish manually.

## Execution Artifacts

- Transfer manifest (machine): `SITE2_TO_SITE1_TRANSFER_MANIFEST.tsv`
- Transfer manifest (readable): `SITE2_TO_SITE1_TRANSFER_MANIFEST.md`
