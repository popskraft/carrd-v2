# Plugin Unification Migration Plan

## Purpose

Привести все плагины Carrd Plugins V2 к одному v2 semantic contract:

- primary setup uses predictable `data-*` markers;
- secondary attrs are plugin-prefixed;
- `src/<plugin>/README.md` and generated `dist/<plugin>/README.md` teach one setup path;
- runtime keeps legacy fallback only as a controlled migration bridge;
- Carrd Builder examples match the same mental model as repo docs.

## Current Status

Repo-level unification is mostly complete:

- primary `data-*` contracts are implemented in runtime;
- source README structure is normalized;
- `dist` is regenerated from source + templates;
- tests and lint pass on the current repo state.

Remaining work is now concentrated in live Carrd migration, exception policy, and legacy-freeze decisions.

## Success Condition

The migration is done only when all of these are true:

- every plugin has one documented primary setup path;
- legacy fallback appears only as migration guidance;
- generated public docs do not contradict source docs;
- Builder-facing examples use primary attrs;
- at least one live Carrd page is verified for each risky contract family;
- long-term fallback policy is explicitly decided before removal work starts.

## Canonical Rules

### Public contract

- Base marker: `data-<plugin>="<name>"` when a plugin binds an instance, group, or source element.
- Secondary attrs: `data-<plugin>-<option>`.
- Indexed overrides: `data-<plugin>-<option>-<index>`.
- Hash triggers: `#data-<plugin>-<name>` only when Carrd link UX is the simplest trigger surface.
- Generic attrs like `data-gap`, `data-color`, and `data-padding` are legacy only.
- Ambiguous role names are not allowed in new primary contracts.

### Documentation contract

- Source README order: `What You Do in Carrd` -> `How It Works in Carrd` -> `How To Check That It Works` -> `Configuration` -> `Design` -> optional `Advanced`.
- `dist` README is generated from source README plus templates only.
- Install flow belongs to templates; source README should not duplicate `Installation`.
- Legacy fallback belongs in one short migration note, not in the primary setup path.

### Runtime contract

- Primary contract must work without legacy attrs.
- Legacy fallback stays until freeze branch/tag exists and live pages are verified.
- Internal runtime attrs stay undocumented as public setup.
- Existing public APIs keep one stable `window.Carrd<Plugin>` surface.

## Remaining Work

### Repo

- Re-check canonical docs for wording drift after the v2 cleanup.
- Decide documented exception policy for `header-nav`, `no-loadwaiting`, `typography`, and `shopping-cart`.
- Confirm `plugin-v2-data-contract.md` and `carrd-markup-contract.md` still match real runtime behavior after live migration decisions.

### Live Carrd

- Verify `header-nav` anti-jump on a real mobile page.
- Verify multi-controller `switcher` sync on a real page.
- Verify `switcher` cluster mode on a real page.
- Verify `accordeon` on the `ppf` group.
- Verify at least one page per contract family:
  - hash-driven: `modal` or `accordeon`
  - grouped marker: `cards`, `grid-cluster`, or `slider`
  - runtime clone / floating UI: `floating-cta` or `shopping-cart`
  - structural exception: `header-nav` or `no-loadwaiting`

### Freeze

- Create a legacy freeze branch/tag before any fallback removal.
- Decide which fallbacks remain long-term compatibility features and which are temporary migration bridges.

## Plugin Status Matrix

| Plugin | Primary v2 contract | Repo status | Live work left |
|---|---|---|---|
| `accordeon` | `data-accordeon-v2`, `#data-accordeon-v2-*` | aligned | verify `ppf`, replace old hashes where needed |
| `cards` | `data-cards-v2`, `data-cards-v2-color*`, `data-cards-v2-padding*` | aligned | migrate old generic attrs on live pages |
| `cookie-banner` | `data-cookie-v2="<name>"` | aligned | replace literal `banner` markers on live pages |
| `faq` | `data-faq-v2="<name>"` | aligned | verify live divider-based setups |
| `floating-cta` | `data-floating-v2="<name>"`, `data-floating-v2-position*` | aligned | migrate literal marker values to semantic names |
| `grid-cluster` | `data-grid-v2`, `data-grid-v2-gap*` | aligned | replace `data-gap*` on live pages |
| `header-nav` | structural exception via `#header` + `header-mobile-el-collapsing` | needs explicit exception decision | mobile anti-jump verification |
| `modal` | `data-modal-v2`, `data-modal-v2-open`, `#data-modal-v2-*` | aligned | replace legacy trigger attrs and hashes on live pages |
| `no-loadwaiting` | structural exception, no public marker | aligned | verify placement/load-order only |
| `shopping-cart` | `data-shopping-cart-v2-output` | mostly aligned | decide long-term role of `data-shopping-cart-v2-target` and migrate live forms |
| `slider` | `data-slider-v2="<name>"` | aligned | replace bare `.slider` setups on live pages |
| `switcher` | `data-switcher-v2`, `data-switcher-v2-target`, `data-switcher-v2-index` | aligned | verify live sync and cluster behavior |
| `typography` | parsing exception via `.txt` | aligned | verify authors understand non-marker setup |

## Validation

### Repo validation

- `npm run build`
- `npm run verify:dist`
- `npm run test`
- `npm run lint`

### Manual docs audit

- Compare each `src/<plugin>/README.md` with generated `dist/<plugin>/README.md`.
- Confirm template-owned install sections are not contradicted by source README.
- Confirm root `README.md` still reflects the active install-path hierarchy.

### Live validation

- Verify one live page per risky contract family.
- Record any failure before changing fallback policy.
- Keep a manual replacement map old attr -> new attr for Builder UI work.

## Stop Rules

- Stop before removing any fallback that still has historical installs.
- Stop before changing live Carrd pages without a reversible checklist.
- Stop if docs cleanup would desync source and generated `dist`.
- Stop if a new public marker is required before it is approved in `plugin-v2-data-contract.md`.

## Output

Use this document as the compact execution surface for the remaining migration. Keep detailed unresolved decisions in `OPEN-QUESTIONS.md`, not as repeated checklists here.
