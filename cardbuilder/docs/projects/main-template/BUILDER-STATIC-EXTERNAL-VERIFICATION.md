# Builder-Static External Verification

## Purpose

Record what was verified against official Carrd documentation after the local evidence pass and hypothesis review.

This document uses official Carrd docs as external reference context for `builder-static` knowledge.

## Sources

- `https://carrd.co/docs/building/overview`
- `https://carrd.co/docs/building/using-mobile-view`
- `https://carrd.co/docs/building/using-section-view`
- `https://carrd.co/docs/building/using-element-styles`
- `https://carrd.co/docs/building/basics`
- `https://carrd.co/docs/sites/changing-a-title-and-description`
- `https://carrd.co/docs/sites/adding-a-share-image`
- `https://carrd.co/docs/sites/setting-up-redirects`
- `https://carrd.co/docs/building/keyboard-shortcuts`

## Verified Results

### 1. Toolbar order for the current visible icon set

Confirmed as a practical working model from left to right:

1. More actions
2. Publish
3. Switch to Mobile View
4. Show Sections
5. Preview Animations
6. Redo
7. Undo
8. Add Element

Why this is accepted:

- the user confirmed the icon order with current screenshots
- official docs describe the same menu capabilities
- older text in the local manual describing edit/duplicate in the visible toolbar is treated as stale

### 2. `data-action="view"`

Verified meaning:

- view-mode switch for the builder
- specifically tied to Desktop View / Mobile View transitions

External support:

- Carrd docs describe `Switch to Mobile View`, `Switch to expanded view`, `Switch to cropped view`, and `Switch back to desktop view`

### 3. `data-action="crop-view"`

Verified meaning:

- cropped mobile-view mode toggle inside Mobile View

External support:

- Carrd docs explicitly describe `(Mobile View) Switch to cropped view`

Important note:

- this is not treated as image crop editing
- image cropping exists elsewhere in Carrd, but this builder action belongs to canvas/mobile-view behavior

### 4. `data-action="deactivate-section"`

Verified meaning:

- leave section view / show all sections again

External support:

- Carrd docs explicitly say to leave Section View, click `Leave Section View` in the menu

### 5. Floppy-like top icon

Verified practical meaning:

- publish surface
- opens the publish flow/panel rather than being documented purely as a passive local save button

External support:

- Carrd overview says the menu includes `Publish the site (and bring up its properties panel)`
- Carrd site-setting docs consistently start with `Click Publish`
- keyboard shortcuts docs describe `Quick Publish (or Save)` and `Publish (or Save)`, suggesting Carrd conceptually couples save/publish behavior

Operational rule:

- treat the top floppy-like visible icon as the publish surface
- do not rely on a separate purely local `save` action unless a live session proves one exists in the current UI state

### 6. `#publish-panel`

Verified at purpose level:

- separate publish-oriented panel
- not the same thing as `#properties-panel`
- used to manage publish-time site settings and changes

Externally supported substructure:

- `Media` tab confirmed by Carrd docs
- `Settings` tab confirmed by Carrd docs
- `Publish Changes` action confirmed by Carrd docs

Not yet fully verified:

- complete current live tab list in the exact runtime UI

### 7. `#sections-panel`

Verified at purpose level:

- separate sections navigation panel
- opened from `Show sections`
- selecting an item isolates that section in Section View
- `Leave Section View` exits back to showing all sections

Not yet fully verified:

- exact DOM and visual list structure in the current live runtime

### 8. Style dropdown

Verified meaning:

- reusable Element Styles control
- creates, links, renames, and deletes shared styles
- located in the upper-right corner of the properties panel on Appearance

Important implication:

- it is not just a passive label or per-element local selector
- it is a shared-style binding mechanism

### 9. Clone / Delete / Done panel controls

Verified at behavior level:

- `Clone` duplicates the selected element
- `Delete` removes the selected element
- `Done` closes the panel

External support:

- Carrd Basics doc explicitly documents these actions from the properties panel

## Remaining Gaps After External Verification

These gaps were later accepted as resolved from external live-verification evidence.

See:

- `cardbuilder/docs/projects/main-template/BUILDER-LIVE-VERIFICATION-ACCEPTED.md`
