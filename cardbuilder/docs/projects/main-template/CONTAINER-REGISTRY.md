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
  - purpose: logo, top navigation links, and the header CTA

### Hero

- `hero-content-container`
  - live: `container27`
  - purpose: live hero heading and lead paragraph

### Stacker

- `stacker-card-1`
  - live: `container23`
- `stacker-card-2`
  - live: `container24`
  - classes: `container-bg-red-light`
- `stacker-card-3`
  - live: `container22`
  - classes: `container-bg-green-light`

These three containers form the live stacker demo run.

### Columns + Ecommerce

- `columns-ecommerce-intro-container`
  - live: `container28`
- `quick-order-cards-container`
  - live: `container06`
  - purpose: quick-order cards block with shopping-cart buttons

### Grid Cluster

- `grid-cluster-intro-container`
  - live: `container25`
- `grid-feature-card-1`
  - live: `container13`
- `grid-feature-card-2`
  - live: `container14`
- `grid-feature-card-3`
  - live: `container15`
- `grid-feature-card-reversed`
  - live: `container04`
  - note: reversed text/image layout

These four containers currently form the grid-cluster demo set. Because their content is placeholder-level duplicated, numeric suffixes are still required.

### Slider

- `slider-card-1`
  - live: `container11`
- `slider-card-reversed`
  - live: `container05`
  - note: reversed text/image layout
- `slider-card-2`
  - live: `container07`
- `slider-card-3`
  - live: `container08`
- `slider-card-4`
  - live: `container16`
  - note: this replaced the retired `container09` reference

These five containers currently form the slider demo set.

### Switchers

- `switcher-intro-container`
  - live: `container26`
- `switcher-case-1`
  - live: `container20`
- `switcher-case-2`
  - live: `container21`
- `switcher-case-3`
  - live: `container19`

### FAQ

- `faq-container`
  - live: `container03`
  - purpose: FAQ heading and Q/A content

### Typography Demo

- `typography-demo-container`
  - live: `container01`
  - classes: `txt`
  - purpose: long rich-content showcase block and design-palette embed

### Shopping Cart

- `shopping-cart-order-form-container`
  - live: `container10`
  - purpose: order form immediately after the `#shopping-cart` section break

### Footer

- `footer-container`
  - live: `container18`
  - purpose: dedicated footer content

### Modal

- `modal-contact-container`
  - live: `container12`
  - current element id: `modalContact`
  - purpose: modal body content for the contact/modal flow

### Cookie Banner

- `cookie-banner-container`
  - live: `container17`
  - purpose: cookie notice and accept action

## Important Current Absence

The current live template now includes a dedicated footer content container.

## Status

This registry is a reference snapshot, not an active standing task.

That means:

- container indexing and reindexing are not required by default
- future work should not assume this map is automatically current
- if container mapping is needed again later, it should be requested as a fresh scoped task
