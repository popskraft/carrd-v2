# Columns To Grid Cluster Migration Draft Execution

## Status

Published and re-scanned.

The draft migration was accepted, published, and followed by a fresh post-migration scan package refresh.

## Execution Time

- Date: `2026-04-06`
- Builder target:
  - `https://carrd.co/dashboard/4155176224428477/build`

## What Was Changed

The live Builder draft was updated in two passes.

### Pass 1

Two live Builder code embeds were replaced in the active template model:

1. `embed02`
   - title: `Theme CSS Variables in HEAD`
   - replacement:
     - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/head-theme-foundation-0.1.15.html`

2. `embed05`
   - title: `Columns`
   - replacement:
     - `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/embed05-cards-grid-cluster-0.1.15.html`

### Pass 2

The combined `embed05` replacement was then split into two separate Builder embeds to match the desired operational structure:

1. `embed05`
   - final title: `Cards`
   - final replacement:
     - `/Users/popskraft/Projects/carrd-v2/dist/cards/cards-embed.html`

2. `embed09`
   - final title: `Grid Cluster`
   - inserted immediately after `embed05`
   - final replacement:
     - `/Users/popskraft/Projects/carrd-v2/dist/grid-cluster/grid-cluster-embed.html`

## Backups

The exact pre-migration live embed contents were saved locally before replacement:

- `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed02-before-0.1.15.html`
- `/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/migration/backups/embed05-before-0.1.15.html`

## Deterministic Verification

The post-replacement live Builder model was read back and compared against the prepared local migration assets.

Results:

- `embed02` content hash matches prepared asset
- `embed05` final content hash matches `dist/cards/cards-embed.html`
- `embed09` final content hash matches `dist/grid-cluster/grid-cluster-embed.html`
- `embed05 -> embed09 -> embed07` component order is confirmed
- Builder `Publish` action is now in `alert` state, which indicates a dirty draft state in the current session

Verified hashes:

- `embed02`
  - sha256: `9e06af910347f16df65ef4b32b7cfe4dbd4c52b5469bb4e7a3779c87fd187213`
- `embed05` final (`Cards`)
  - sha256: `fa6b661bbed301b9e3492aba6dcc5c8cbbb008c20ffe2bb8fa80c99d2aec90bf`
- `embed09` final (`Grid Cluster`)
  - sha256: `b9c289f4d933fc9cf18480a50e47ed94c2e89fe33a0283227a8fd1298f6f9d2f`

## Evidence

- Builder draft screenshot:
  - `/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/screens/migration-builder-draft-after-2026-04-06.png`
- Builder draft screenshot after split:
  - `/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/main-template/screens/migration-builder-draft-split-after-2026-04-06.png`

## Published Outcome

The operator completed publish after review.

Post-publish rescan result:

- `columns` is no longer detected live
- `cards` is detected live
- `grid-cluster` is detected live
- `no-loadwaiting` is detected live
- active plugin embeds were refreshed to current distributive versions

## Next Required Steps

1. Keep the refreshed scan package as the current canonical post-migration baseline.
2. Revisit only optional repo-only plugins if product scope changes:
   - `cookie-banner`
   - `header-nav`
   - `typography`
