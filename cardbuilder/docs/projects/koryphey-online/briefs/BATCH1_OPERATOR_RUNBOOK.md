# BATCH1_OPERATOR_RUNBOOK.md

## Scope

Target blocks from Source Site 2 to Target Site 1 (in this exact order):
1. `container01`
2. `container03`
3. `container20`
4. `container42`
5. `container24`
6. `divider19`
7. `container16`
8. `divider18`
9. `container39`
10. `container32`

Insert zone in Target:
- after `Header End` (`control04`)
- before current first block `container06`

## Hard Rules

- Do not transfer form blocks.
- Do not transfer `#order` / `#thankyou` sections.
- If style from source is missing in target, set style to `Main`.
- Do not click Save/Publish.

## Operator Steps

1. Open both builder tabs:
- Source: `https://carrd.co/dashboard/4544177104830762/build`
- Target: `https://carrd.co/dashboard/8089177104819774/build`

2. In Target, confirm anchor position:
- find `control04` (`Header End`)
- identify first content block after it (`container06`)

3. For each block in scope:
- In Source, select block by `data-id`
- Clone/copy content structure
- In Target, create or duplicate nearest matching block type
- Move block to insertion zone after `control04` (preserve order 1..10)
- Transfer content fields (Content tab)
- Transfer style token:
  - if token exists in target, keep it
  - if token does not exist, assign `Main`
- Quick visual check in canvas
- Record operation in `logs/MIGRATION_LOG.md`

4. After all 10 blocks:
- Verify Desktop view
- Toggle Mobile view and verify
- Mark checklist in `checklists/VALIDATION_CHECKLIST.md`

## Logging Template (per block)

- Source ID:
- Target ID:
- Action: create/update/move
- Style applied:
- Status: ok/fix-needed
- Note:
