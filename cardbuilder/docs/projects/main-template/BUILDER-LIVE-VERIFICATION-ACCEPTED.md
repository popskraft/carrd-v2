# Builder Live Verification Accepted

## Decision

The externally produced live-verification conclusions for the remaining `builder-static` UI questions are accepted as the current canonical resolution for those questions.

Acceptance basis:

- the report resolves the 4 remaining residual `builder-static` questions
- its evidence quality is materially stronger than prior text-only or screenshot-only inference
- where multiple external reports conflicted, the stronger DOM/CSS/state-transition explanation was accepted

## Accepted Canonical Conclusions

### 1. `#publish-panel`

Accepted conclusion:

- `#publish-panel` is a dedicated publish-oriented panel separate from `#properties-panel`
- it contains a 3-tab structure:
  - Publish
  - Media
  - Settings
- `Publish Changes` is the bottom primary action

Accepted with caveat:

- exact field inventory may evolve over time, but the panel role and 3-tab model are accepted as canonical for current builder-static knowledge

### 2. `#sections-panel`

Accepted conclusion:

- `#sections-panel` is a dedicated sections-navigation panel
- it includes:
  - an `(all sections)` pseudo-entry
  - project-specific named section rows
  - a `Done` close action
- selecting a named section enters Section View
- leaving Section View restores all-sections view

Accepted with caveat:

- section row labels are `template-instance`
- the panel structure and behavior are `builder-static`

### 3. `background-properties` and `main-properties`

Accepted conclusion:

- these actions are not simply menu-only
- visibility is viewport-width dependent
- default wider screens:
  - hidden as direct toolbar items
  - available through the More Actions menu
- narrow screens (`max-width: 480px`):
  - shown directly in the toolbar
  - hidden from the More Actions dropdown

This replaces the weaker earlier conclusion that they were always menu-only.

### 4. `do-ui-previous` and `do-ui-next`

Accepted conclusion:

- these are panel docking controls
- they move the UI wrapper / panel rail left and right
- they do not navigate between selected canvas elements

Accepted current behavioral contract:

- on normal screens they are used for panel-side switching
- on narrow screens they are hidden

## Superseded Earlier Conclusions

The following earlier interpretations are no longer canonical:

1. `background-properties` and `main-properties` are always menu-only
2. `do-ui-previous` and `do-ui-next` are likely previous/next element navigation controls
3. `#publish-panel` / `#sections-panel` remain unresolved at the same level as before the live verification evidence

## Source Quality Note

These accepted conclusions come from external live-verification reports and have been adopted into local canon after critical comparison.

Status:

- accepted for current builder-static knowledge
- high confidence
- not yet independently re-executed by this agent in the live builder session

If future direct live verification by this agent contradicts any accepted point, the direct live verification should win and the canon must be updated.
