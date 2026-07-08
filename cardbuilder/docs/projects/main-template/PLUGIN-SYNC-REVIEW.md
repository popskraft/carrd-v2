# Plugin Sync Review

Status: superseded by the `theme-runtime@2.1.0` bundle rollout and the `2026-07-07` bundle-aware inventory refresh.

## Current Decision

- `main-template` no longer uses the old per-plugin embed-title baseline as its primary sync model.
- The canonical live contract is now:
  - bundled via `theme-runtime`: `accordeon`, `cards`, `faq`, `floating-cta`, `grid-cluster`, `header-nav`, `modal`, `slider`, `stacker`, `switcher`, `typography`
  - added separately: `no-loadwaiting`, `shopping-cart`, `cookie-banner`
- Current repo/runtime sync result: no repo-only plugin gap remains for the active main-template runtime contract.

## Use Instead

- `cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json`
- `cardbuilder/projects/main-template/data/diffs/template-vs-repo-plugin-sync.json`
- `cardbuilder/docs/projects/main-template/TEMPLATE-INSTANCE-SCAN-REPORT.md`
