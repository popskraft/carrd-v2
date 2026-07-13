# Live Plugin Refresh Map

## Purpose

Translate the current scan package into exact live Builder replacement targets for the post-`2026-07-13` MBX reinstall baseline.

## Status

The old legacy refresh map is no longer valid.

Observed live draft on `2026-07-13`:

- `122` Builder components
- `18` embed elements
- all active plugin embeds are now inline, individually titled, and mostly aligned with current `dist`
- `embed03` is no longer a plugin slot; it is a site-owned `Head` customization placeholder
- `cards` has been intentionally removed from the current Builder draft

## Current Live Targets

### HEAD

| Embed | Current title | Current role | Target replacement |
|---|---|---|---|
| `embed01` | `No Loadwaiting (HEAD)` | active plugin slot | [no-loadwaiting-embed.html](/Users/popskraft/Projects/carrd-v2/dist/no-loadwaiting/no-loadwaiting-embed.html) |
| `embed02` | `Theme Design System (HEAD)` | active theme slot | [theme-design-system.html](/Users/popskraft/Projects/carrd-v2/dist/theme-design-system.html) |
| `embed03` | `Theme Customizing (HEAD)` | site-owned custom layer | preserve as-is; no repo-owned replacement |

### BODY END

| Embed | Current title | Current role | Target replacement |
|---|---|---|---|
| `embed04` | `Accordeon` | active plugin slot | [accordeon-embed.html](/Users/popskraft/Projects/carrd-v2/dist/accordeon/accordeon-embed.html) |
| `embed05` | `Cookie Banner` | active plugin slot | [cookie-banner-embed.html](/Users/popskraft/Projects/carrd-v2/dist/cookie-banner/cookie-banner-embed.html) |
| `embed06` | `Faq` | active plugin slot | [faq-embed.html](/Users/popskraft/Projects/carrd-v2/dist/faq/faq-embed.html) |
| `embed07` | `Floating Cta` | active plugin slot | [floating-cta-embed.html](/Users/popskraft/Projects/carrd-v2/dist/floating-cta/floating-cta-embed.html) |
| `embed08` | `Grid Cluster` | active plugin slot | [grid-cluster-embed.html](/Users/popskraft/Projects/carrd-v2/dist/grid-cluster/grid-cluster-embed.html) |
| `embed09` | `Header Nav` | active plugin slot | [header-nav-embed.html](/Users/popskraft/Projects/carrd-v2/dist/header-nav/header-nav-embed.html) |
| `embed10` | `Modal` | active plugin slot | [modal-embed.html](/Users/popskraft/Projects/carrd-v2/dist/modal/modal-embed.html) |
| `embed11` | `Shopping Cart 1/2` | active split part 1 | [shopping-cart-embed-part1.html](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart-embed-part1.html) |
| `embed12` | `Shopping Cart 2/2` | active split part 2 | [shopping-cart-embed-part2.html](/Users/popskraft/Projects/carrd-v2/dist/shopping-cart/shopping-cart-embed-part2.html) |
| `embed13` | `Slider 1/2` | active split part 1 | [slider-embed-part1.html](/Users/popskraft/Projects/carrd-v2/dist/slider/slider-embed-part1.html) |
| `embed14` | `Slider 2/2` | active split part 2 | [slider-embed-part2.html](/Users/popskraft/Projects/carrd-v2/dist/slider/slider-embed-part2.html) |
| `embed15` | `Stacker` | active plugin slot | [stacker-embed.html](/Users/popskraft/Projects/carrd-v2/dist/stacker/stacker-embed.html) |
| `embed16` | `Switcher` | active plugin slot | [switcher-embed.html](/Users/popskraft/Projects/carrd-v2/dist/switcher/switcher-embed.html) |
| `embed17` | `Typography` | active plugin slot | [typography-embed.html](/Users/popskraft/Projects/carrd-v2/dist/typography/typography-embed.html) |
| `embed18` | `Design Palette` | active visible helper embed | [design-palette-embed.html](/Users/popskraft/Projects/carrd-v2/dist/design-palette/design-palette-embed.html) |

## Remap Note

The current Builder draft is close to a stable inline canon, but not fully green:

- `embed02` and `embed12` differ from repo `dist` only by formatting reflow introduced by Carrd/MBX
- `embed03` is intentionally outside repo-owned plugin automation
- `container23` no longer carries the temporary `why` anchor

## Recommended Next Action

1. Treat this embed layout as the current Builder draft canon.
2. Use `embed03` only as a site-owned custom `Head` slot.
3. Do not declare persistent canon for all mutation classes until the remaining save/reload/readback checks succeed.

## Save Boundary

- This file maps the remapped Builder state.
- Safe persistence probes for custom `data-*` on stable `container18` and custom `id` on safe `container28` have already been proven live.
- A real product attr probe on `2026-07-13` failed the full boundary: `container12` kept `data-modal-close-on-overlay=off` in Builder after publish, but published `mini.crd.co` did not expose that attr on `#data-modal-contact`.
- Do not declare canonical PASS until the remaining mutation classes, especially real product attrs, embed edits, and structural edits, also pass save/reload/readback on the actual Builder surface.
