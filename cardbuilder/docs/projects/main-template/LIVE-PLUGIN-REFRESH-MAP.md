# Live Plugin Refresh Map

## Purpose

Translate the current scan package into exact live Builder replacement targets before any plugin refresh or `columns` migration is attempted.

## Why This Exists

The active template is not simply missing `grid-cluster`.

It is currently running a broader legacy inline plugin layer:

- old inline plugin embeds
- old `--mini-*` token layer in HEAD
- a combined legacy `Columns` embed that also contains the old cards behavior

This means the safe order is:

1. introduce a compatible HEAD foundation
2. replace the legacy `Columns` embed with the prepared `cards + grid-cluster` replacement
3. optionally refresh the other active legacy plugin embeds to the current `dist` outputs

## Current Live Targets

### HEAD

| Embed | Current title | Current role | Target replacement |
|---|---|---|---|
| `embed02` | `Theme CSS Variables in HEAD` | legacy `--mini-*` token layer | [head-theme-foundation-0.1.15.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/head-theme-foundation-0.1.15.html) |
| `embed08` | `No Load Waiting in HEAD` | legacy inline plugin | [no-loadwaiting-embed.html](/Users/popskraft/Projects/carrd-v2/dist/no-loadwaiting/no-loadwaiting-embed.html) |

### BODY END

| Embed | Current title | Current role | Target replacement |
|---|---|---|---|
| `embed01` | `FAQ` | legacy inline plugin | [faq-embed.html](/Users/popskraft/Projects/carrd-v2/dist/faq/faq-embed.html) |
| `embed03` | `Shopping Card JS` | legacy split JS half | [shopping-cart-embed.html](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart-embed.html) |
| `embed04` | `Shopping Card CSS` | legacy split CSS half | [shopping-cart-embed.html](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart-embed.html) |
| `embed05` | `Columns` | legacy combined `columns + cards` | [embed05-cards-grid-cluster-0.1.15.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/embed05-cards-grid-cluster-0.1.15.html) |
| `embed06` | `Slider` | legacy inline plugin | [slider-embed.html](/Users/popskraft/Projects/carrd-v2/dist/slider/slider-embed.html) |
| `embed07` | `Modal` | legacy inline plugin | [modal-embed.html](/Users/popskraft/Projects/carrd-v2/dist/modal/modal-embed.html) |

## Primary Migration Target

The critical swap for the approved baseline change started with:

- current live target: `embed05` titled `Columns`
- prepared replacement: [embed05-cards-grid-cluster-0.1.15.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/embed05-cards-grid-cluster-0.1.15.html)

Important detail:

- the current live `embed05` contains both grid clustering and cards behavior
- therefore the replacement must provide both:
  - `cards`
  - `grid-cluster`

Removing `Columns` without replacing both layers would be an incomplete migration.

## Final Desired Live Structure

After the migration draft is normalized, the target BODY END structure is:

- `embed05` titled `Cards`
  - target asset: [cards-embed.html](/Users/popskraft/Projects/carrd-v2/dist/cards/cards-embed.html)
- a following embed titled `Grid Cluster`
  - current draft component id: `embed09`
  - target asset: [grid-cluster-embed.html](/Users/popskraft/Projects/carrd-v2/dist/grid-cluster/grid-cluster-embed.html)

This split structure is now the preferred operational shape over the temporary combined replacement.

## HEAD Compatibility Step

Before or together with the `embed05` swap, the safer HEAD replacement is:

- [head-theme-foundation-0.1.15.html](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/head-theme-foundation-0.1.15.html)

Why:

- current live plugins use `--mini-*`
- current distributive plugins use `--theme-*`
- the prepared HEAD file preserves the live palette and spacing values while also exposing the newer token names

This makes staged replacement safer and avoids false regressions caused only by token-layer mismatch.

## Recommended Execution Order In Builder

1. Replace `embed02` with the prepared HEAD foundation file.
2. Replace `embed05` with the prepared `cards + grid-cluster` replacement file or directly normalize it into separate `Cards` and `Grid Cluster` embeds.
3. Validate Builder state and published view for all grid/card sections.
4. If desired, continue with the broader refresh of `FAQ`, `Shopping Cart`, `Slider`, `Modal`, and `No Load Waiting`.

## Machine-Readable Map

See:

- [live-embed-replacement-map.json](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/live-embed-replacement-map.json)
