# Faktura — legacy `[data-*]` alias sync report

Date: 2026-06-24 (Builder draft write)
Writer: `cardbuilder/projects/faktura/automation/sync-v2-embeds.mjs --write`
Builder: `https://carrd.co/dashboard/4778178033233108/build`
Policy: `savePublishPolicy=operator-only` — draft written, **publish pending operator**.

## Scope
Only the alias-fix set, mapped by stable embed IDs. Service embeds
(embed01 JIVO, embed11 Calibri, embed12 Metrika) and faktura-custom theme
embeds (embed14 Theme Core CSS, embed10 Theme JS Custom) were **not touched**.

| Embed | Title (live) | Source | hash == dist | Note |
|---|---|---|---|---|
| embed02 | Cookie Banner | dist/cookie-banner-v2/cookie-banner-v2-embed.html | ✅ | alias `[data-cookie]` carried |
| embed03 | FAQ | dist/faq-v2/faq-v2-embed.html | ✅ | scope `:is([data-faq-v2],.FAQContainer)`×14 → `:is([data-faq-v2],[data-faq],.FAQContainer)`×14 |
| embed07 | Modal | dist/modal-v2/modal-v2-embed.html | ✅ | alias `[data-modal]` carried |

## Evidence
- Before-backup: `raw-imports/2026-06-23T20-53-12-638Z-alias-sync-before/embed{02,03,07}-before.html`
- Dry-run: `diffs/alias-sync-dryrun.json`
- Write + readback: `diffs/alias-sync-write-result.json` (3/3 `matchesExpected=true`)
- Post-write state: Publish button `.alert` (dirty) — staged for operator.

## Published & verified (2026-06-24)
Operator pressed Publish. Live verify on `https://faktura-dev.crd.co/`:
- FAQ: 14× `:is([data-faq-v2],[data-faq],.FAQContainer)`, 0× old `:is([data-faq-v2],.FAQContainer)`
- Modal: 8× `:is([data-modal-v2],[data-modal])`
- Cookie: 3× `[data-cookie]`

Status: **RESOLVED** (Q008 closed, ROADMAP #26 done).
