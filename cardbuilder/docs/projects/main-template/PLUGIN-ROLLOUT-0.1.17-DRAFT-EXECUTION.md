# Plugin Rollout 0.1.17 Draft Execution

## Status

Draft updated in Builder.
Not yet published.

## Execution Time

- Date: `2026-04-07`
- Builder target:
  - `https://carrd.co/dashboard/4155176224428477/build`

## Intent

Refresh the active Carrd Builder draft to the current `0.1.17` distributive plugin package after the template refactor and add the previously absent live plugin embeds:

- `typography`
- `header-nav`

This pass updates the draft only.
Published-site truth remains unchanged until owner review, publish, and a fresh post-publish scan.

## Inputs

- Repo version:
  - `0.1.17`
- Active registry:
  - [/Users/popskraft/Projects/carrd-v2/cardbuilder/data/active-template.json](/Users/popskraft/Projects/carrd-v2/cardbuilder/data/active-template.json)
- Rollout script:
  - [/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/refresh-builder-plugins.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/refresh-builder-plugins.mjs)
- CDP helper:
  - [/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/cdp-eval.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/cdp-eval.mjs)
- Source distributives used:
  - [/Users/popskraft/Projects/carrd-v2/dist/theme-design-system.html](/Users/popskraft/Projects/carrd-v2/dist/theme-design-system.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/no-loadwaiting/no-loadwaiting-embed.html](/Users/popskraft/Projects/carrd-v2/dist/no-loadwaiting/no-loadwaiting-embed.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.css](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.css)
  - [/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.js](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart.min.js)
  - [/Users/popskraft/Projects/carrd-v2/dist/slider/slider-embed.html](/Users/popskraft/Projects/carrd-v2/dist/slider/slider-embed.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/cards/cards-embed.html](/Users/popskraft/Projects/carrd-v2/dist/cards/cards-embed.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/grid-cluster/grid-cluster-embed.html](/Users/popskraft/Projects/carrd-v2/dist/grid-cluster/grid-cluster-embed.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/modal/modal-embed.html](/Users/popskraft/Projects/carrd-v2/dist/modal/modal-embed.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/faq/faq-embed.html](/Users/popskraft/Projects/carrd-v2/dist/faq/faq-embed.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/typography/typography-embed.html](/Users/popskraft/Projects/carrd-v2/dist/typography/typography-embed.html)
  - [/Users/popskraft/Projects/carrd-v2/dist/header-nav/header-nav-embed.html](/Users/popskraft/Projects/carrd-v2/dist/header-nav/header-nav-embed.html)

## Before-State Evidence

Raw pre-state backups were saved under:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft)

Existing embed backups:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed01-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed01-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed02-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed02-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed03-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed03-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed04-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed04-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed05-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed05-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed06-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed06-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed07-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed07-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed08-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed08-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed09-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed09-before.html)

New embed placeholders:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed10-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed10-before.html)
- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed11-before.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/embed11-before.html)

## Draft Changes Applied

Updated existing embeds to current `0.1.17` distributives:

- `embed02`
  - `Theme Design System (in HEAD)`
- `embed08`
  - `No Load Waiting (in HEAD)`
- `embed04`
  - `Shopping Cart CSS`
- `embed03`
  - `Shopping Cart JS`
- `embed06`
  - `Slider`
- `embed05`
  - `Cards`
- `embed09`
  - `Grid Cluster`
- `embed07`
  - `Modal`
- `embed01`
  - `FAQ`

Added new embeds:

- `embed10`
  - `Typography`
- `embed11`
  - `Header Nav`

Resulting top-level embed order in the draft:

1. `embed02`
2. `embed08`
3. `embed04`
4. `embed03`
5. `embed06`
6. `embed05`
7. `embed09`
8. `embed07`
9. `embed01`
10. `embed10`
11. `embed11`

## Readback Verification

Raw rollout readback:

- [/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/builder-plugin-rollout-0.1.17.json](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/raw-imports/2026-04-07-plugin-rollout-draft/builder-plugin-rollout-0.1.17.json)

Verification result:

- every touched embed read back from Builder with exact SHA-256 match against the intended local source artifact
- draft is dirty in Builder
- no publish was triggered

New embed ids assigned by Carrd:

- `Typography` -> `embed10`
- `Header Nav` -> `embed11`

## Validation

### Builder-side

- exact hash readback for all 11 target embeds
- Builder publish button is in dirty/alert state

### Published-side

Not run.

Reason:

- this pass intentionally stopped at draft mutation
- published validation must happen only after owner review and publish

## Operational Caveat

This draft state is ahead of the last canonical published scan.

Do not treat the current template as fully synchronized in canonical docs until all of these happen:

1. owner reviews the draft
2. owner publishes the site
3. a fresh post-publish scan package is recorded
4. live inventory and sync review are refreshed
