# Container Registry

## Purpose

Preserve a reference snapshot of top-level Carrd containers for the active main template.

This registry is intended to support:

- deterministic future audits
- explicit references when discussing current container placement
- temporary mapping away from raw `containerNN` ids during analysis

Machine-readable reference file:

- `cardbuilder/projects/main-template/data/inventories/container-registry.json`

## Naming Rules

1. Prefer semantic names over numeric names.
2. Use numeric suffixes only when multiple containers share the same role and current content does not provide a better distinction.
3. If one duplicate has a meaningful structural difference, prefer a semantic suffix such as `-reversed` before introducing another number.
4. Never renumber existing canonical ids just because a container was removed or a new one was inserted.
5. Track both:
   - `liveDataId` for the current Carrd builder object
   - `currentElementId` for any existing Carrd settings ID
6. If a unified Carrd element ID is needed later, write it into `proposedElementId` first and only treat it as applied after a live Builder verification pass.

## Current Registry

### Header

- `site-header-container`
  - live: `container02`
  - current element id: `SiteHeader`
  - purpose: logo + top navigation links

### Main Intro

- `hero-content-container`
  - live: `container01`
  - purpose: main hero/content showcase with heading stack, body text, CTA, and support links

### Cards

- `quick-order-cards-container`
  - live: `container06`
  - classes: `cards`
  - purpose: quick-order cards block with shopping-cart buttons

### Grid Cluster

- `grid-feature-card-1`
  - live: `container13`
  - classes: `grid-2`
- `grid-feature-card-2`
  - live: `container14`
  - classes: `grid-2`
- `grid-feature-card-3`
  - live: `container15`
  - classes: `grid-2`
- `grid-feature-card-reversed`
  - live: `container04`
  - classes: `grid-2`
  - note: reversed text/image layout

These four containers currently form the grid-cluster demo set. Because their content is placeholder-level duplicated, numeric suffixes are currently required.

### Slider

- `slider-card-1`
  - live: `container11`
  - classes: `slider`
- `slider-card-reversed`
  - live: `container05`
  - classes: `slider`
  - note: reversed text/image layout
- `slider-card-2`
  - live: `container07`
  - classes: `slider`
- `slider-card-3`
  - live: `container08`
  - classes: `slider`
- `slider-card-4`
  - live: `container09`
  - classes: `slider`

These five containers currently form the slider demo set.

### FAQ

- `faq-container`
  - live: `container03`
  - classes: `FAQContainer`
  - purpose: FAQ heading and Q/A content

### Shopping Cart

- `shopping-cart-order-form-container`
  - live: `container10`
  - purpose: order form immediately after the `#shopping-cart` section break

### Modal

- `modal-contact-container`
  - live: `container12`
  - current element id: `modalContact`
  - classes: `modal`
  - purpose: modal body content for the contact/modal flow

## Important Current Absence

The current scan package does not show a dedicated footer content container.

That means:

- `footer-container` is not part of the current recorded snapshot
- if such a container is added later, it can receive a new semantic name at that time if a fresh container-mapping task is requested

## Status

This registry is a reference snapshot, not an active standing task.

That means:

- container indexing and reindexing are not required by default
- future work should not assume this map is automatically current
- if container mapping is needed again later, it should be requested as a fresh scoped task
