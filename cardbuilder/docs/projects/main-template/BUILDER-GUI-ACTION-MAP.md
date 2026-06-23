# Builder GUI Action Map

## Purpose

Provide a normalized `builder-static` reference for the Carrd Builder GUI based on critically reviewed local evidence and accepted external live-verification reports.

This document is intentionally stricter than any single external report:

- only accepted or clearly caveated facts are included
- `template-instance` observations are kept out unless explicitly labeled
- unresolved items stay unresolved instead of being silently promoted into canon

## Source Stack

Priority used for this document:

1. accepted builder-static local canon
2. accepted external live-verification evidence
3. critically reviewed external GUI reconnaissance evidence
4. older screenshot/manual inference only where stronger evidence is absent

## Scope Boundary

### Included

- stable Carrd Builder surfaces
- stable actions and modes
- recurring panel structures
- operational action map for future deterministic Builder work

### Excluded

- current site content
- project-specific section names
- project-specific classes, IDs, and plugin usage
- precise pixel geometry and fragile implementation trivia unless operationally relevant

## Builder Overview

### Major Zones

1. Canvas
   - root: `#canvas`
   - role: live site rendering and direct element interaction

2. Builder UI wrapper
   - wrapper state includes `is-right` / `is-left`
   - role: host floating toolbar and side panels

3. Toolbar / menu bar
   - root: `#menu`
   - role: primary action surface for global Builder commands

4. Side panels
   - `#properties-panel`
   - `#publish-panel`
   - `#sections-panel`
   - role: context-specific editing and navigation surfaces

5. Annotations layer
   - root: `#annotations`
   - role: hover/selection labels and visual selection feedback

### Builder Chrome vs Canvas

- the canvas holds the site content being edited
- the builder chrome is overlaid around and above the canvas
- the builder chrome should be treated as `builder-static`
- the site content inside the canvas should be treated as `template-instance`

## Stable GUI Map

| Surface | Root / Trigger | Role | Domain |
|---|---|---|---|
| Toolbar | `#menu` | global Builder actions | `builder-static` |
| Add menu | toolbar `Add` / `data-menu=\"add\"` | insert new element types | `builder-static` |
| More Actions | toolbar `Menu` / `data-menu=\"menu\"` | less frequently used global actions | `builder-static` |
| Properties panel | `#properties-panel` | selected-element or site-level properties | `builder-static` |
| Publish panel | `#publish-panel` | publish workflow and site-level publish settings | `builder-static` |
| Sections panel | `#sections-panel` | section navigation and section-view entry | `builder-static` |
| Instructions overlay | `instructions` action | in-product builder help / icon map | `builder-static` |
| Canvas | `#canvas` | current site preview and interaction surface | mixed; chrome is static, content is instance |

## Toolbar Action Map

### Stable Action Inventory

These actions are accepted as part of the Carrd Builder action system for the current Builder generation:

- `add-text`
- `add-image`
- `add-video`
- `add-audio`
- `add-gallery`
- `add-timer`
- `add-slideshow`
- `add-widget`
- `add-container`
- `add-list`
- `add-buttons`
- `add-links`
- `add-icons`
- `add-table`
- `add-divider`
- `add-form`
- `add-embed`
- `add-control`
- `undo`
- `redo`
- `play`
- `deactivate-section`
- `sections`
- `crop-view`
- `view`
- `background-properties`
- `main-properties`
- `view-site`
- `publish`
- `start-over`
- `instructions`
- `keyboard-shortcuts`
- `docs`
- `dashboard`
- `exit`

### Current Direct Toolbar Working Model

High-confidence visible toolbar actions:

1. `Menu`
2. `Publish`
3. `Switch View`
4. `Show Sections`
5. `Preview Animation`
6. `Redo`
7. `Undo`
8. `Add`

Medium-confidence current-toolbar action:

- `View Site`
  - accepted as a stable builder action
  - likely appears directly in at least some current UI states
  - direct visibility in the exact current baseline remains a caveated point until a first-party live recheck

State-dependent toolbar actions:

- `deactivate-section`
  - hidden until Section View is active
- `crop-view`
  - hidden until Mobile View is active
- `background-properties`
  - direct toolbar item only on narrow screens
- `main-properties`
  - direct toolbar item only on narrow screens

### Add Menu

The add menu is a stable two-column element picker triggered by `Add`.

Element families:

- Text
- Image
- Video
- Audio
- Gallery
- Timer
- Slideshow
- Widget
- Container
- List
- Buttons
- Links
- Icons
- Table
- Divider
- Form
- Embed
- Control

### More Actions

The More Actions menu is the stable overflow surface for global Builder commands.

High-confidence actions in the broader menu system:

- `publish`
- `view-site`
- `start-over`
- `background-properties`
- `main-properties`
- `instructions`
- `keyboard-shortcuts`
- `docs`
- `dashboard`
- `exit`
- possibly duplicated `undo` / `redo` depending on current state and visible composition

Operational rule:

- treat action existence as more stable than exact visible grouping/order
- do not hardcode visual menu order unless a direct current-session check demands it

## Panel Map

### Properties Panel

Root:

- `#properties-panel`

Stable structure:

- header tabs
- title area
- form wrapper
- optional style dropdown / shared style binding control
- panel-side actions:
  - `.do-ui-previous`
  - `.do-ui-next`
  - `.do-close`
- footer:
  - clone/delete for normal elements
  - `Done`

Stable behaviors:

- opens on canvas element selection
- can also open for site-level targets such as background/page actions
- background/page variants suppress clone/delete actions

### Publish Panel

Root:

- `#publish-panel`

Stable role:

- dedicated publish workflow panel
- separate from `#properties-panel`

Stable current model:

- 3 tabs:
  - Publish
  - Media
  - Settings
- bottom primary action:
  - `Publish Changes`

### Sections Panel

Root:

- `#sections-panel`

Stable role:

- dedicated sections navigation panel

Stable current model:

- title
- dynamic list populated when opened
- `(all sections)` pseudo-entry
- project-specific named section rows
- `Done`

Stable behaviors:

- selecting a named section enters Section View
- selecting `(all sections)` leaves Section View
- panel close and section-view exit are related but not identical concepts

### Instructions Overlay

Stable role:

- internal Builder help surface
- useful secondary evidence for icon-to-action mapping

## Mode And View Map

### Desktop View

- default canvas mode
- `crop-view` hidden

### Mobile View

- entered via `view`
- reveals `crop-view`

### Cropped / Expanded Mobile View

- controlled by `crop-view`
- this is a mobile-canvas mode, not image cropping

### Section View

- entered via `sections` panel by selecting a specific section
- exited via `deactivate-section` or `(all sections)`

### Animation Preview

- entered via `play`
- action purpose is confirmed
- exact exit-state mechanics remain less strongly documented than entry semantics

### Panel Side State

- wrapper state toggles between `is-right` and `is-left`
- controlled by `.do-ui-previous` / `.do-ui-next`
- these controls move the panel rail; they do not move canvas selection

## Deterministic Findings

1. `#publish-panel`, `#properties-panel`, and `#sections-panel` should be treated as separate sibling panels under the Builder UI wrapper.
2. `.do-ui-previous` and `.do-ui-next` are panel docking controls, not previous/next element controls.
3. `background-properties` and `main-properties` are viewport-dependent direct-toolbar items:
   - wider screens: menu-only
   - narrow screens (`<= 480px`): direct-toolbar, hidden from the overflow menu
4. `crop-view` belongs to Mobile View, not image editing.
5. `deactivate-section` leaves Section View.
6. `view-site` is a stable Builder action even if its exact direct-toolbar visibility is still treated cautiously.
7. `publish` is the publish surface and supports a quick-publish variant via `Shift+click`.
8. the instructions overlay is a valid secondary reference for the current icon/action model.

## Unresolved Or Caveated Items

1. exact current direct-toolbar visibility of `view-site`
2. exact current visible composition and order of the More Actions dropdown in the active UI state
3. exact tab sets for every non-text element type in `#properties-panel`
4. low-risk but still unverified behaviors such as title-cycle interaction and the exact non-destructive behavior of `keyboard-shortcuts` / `docs`
5. safe operational semantics of `start-over`, which remains treated as risky

## Action Atlas

If you want to add a new element, use `Add` and choose one of the stable `add-*` actions.

If you want to edit a selected element, click it on the canvas to open `#properties-panel`.

If you want to edit page-level settings, use `main-properties` / `Page`.

If you want to edit background-level settings, use `background-properties` / `Background`.

If you want to publish or inspect publish settings, use `publish` to open `#publish-panel`.

If you want to open the ready site, use `view-site` either from the direct toolbar if visible or from More Actions.

If you want to inspect or navigate sections, use `sections` to open `#sections-panel`.

If you want to leave Section View, use `deactivate-section` or select `(all sections)`.

If you want to switch between desktop and mobile canvas modes, use `view`.

If you want to switch between cropped and expanded mobile canvas, use `crop-view` after entering Mobile View.

If you want to preview configured animations, use `play`.

If you want the panel rail on the opposite side, use `.do-ui-previous` / `.do-ui-next`.
