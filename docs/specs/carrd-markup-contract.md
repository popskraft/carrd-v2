# Carrd Markup Contract

Rules governing how plugins interact with Carrd author HTML.

## Core Rules

- Existing Carrd author HTML is not agent-controlled by default.
- Do not introduce new user-facing classes, IDs, or `data-*` attributes in Carrd markup unless the Human Owner explicitly decides to add them.
- Approved plugin bindings use `data-<plugin>="<name>"`; classes are styling hooks or legacy fallback only.
- Approved plugin hash triggers use `#data-<plugin>-<name>` and must be ignored unless a matching plugin data target exists.
- Do not assume Carrd structural markup can be freely changed just to simplify plugin code.
- Carrd structural detection is allowed when it relies on stable platform invariants or already-approved page contracts.
- Prefer deterministic structural contracts over multi-layer heuristic guessing.
- If a plugin needs additional markers, stop and escalate instead of silently expanding the public contract.
- Runtime-created elements are the exception: the agent may add internal classes, IDs, and `data-*` attributes to elements created by the script itself.

## Acceptable vs Not Acceptable

**Acceptable structural detection:**
- `.wrapper > .inner` — stable Carrd layout pattern
- Adjacent Carrd blocks by order
- Approved root classes set by the owner
- Existing IDs chosen by the owner
- Platform-stable wrapper patterns

**Not acceptable without owner approval:**
- Inventing a new required class in Carrd content
- Forcing a new `id` on an existing Carrd element
- Expecting a new `data-*` attribute in Carrd content

**Allowed for plugin-created elements (runtime):**
- Any internal classes, IDs, `data-*` on overlays, spacers, clones, wrappers, toggles that the script creates itself.

## Escalation

If a plugin needs a new public marker to stay reliable, escalate the contract change to the Human Owner. Do not silently assume it.

## Active Plugin Contracts

Contract types and escalation notes only. The authoritative per-plugin binding syntax, options, and the full Naming Matrix live in `docs/specs/plugin-data-contract.md`.

| Plugin | Contract type | Escalation / exception notes |
|--------|--------------|-------|
| `accordeon` | Clean hash + attribute group | Only `#data-accordeon-<name>` with matching `data-accordeon="<name>"` is supported |
| `header-nav` | Header scope + collapse marker | `#header` activates only with `.header-mobile-hide`; legacy `.header-mobile-el-collapsing` stays as alias; mobile anti-jump collapse only, no sticky shell. See `docs/decisions/header-nav-structural-contract.md` |
| `floating-cta` | Clean data marker + position | Runtime clones source elements to fixed position; position/hide options per instance |
| `cookie-banner` | Clean data marker + legacy fallback | Per-banner indent/delay/days/position options; shared consent cookie |
| `shopping-cart` | Carrd section + form + clean output marker | Use `#shopping-cart`, `#form-shopping-cart` and `data-shopping-cart-output="order-details"`; no separate target marker |
| `modal` | Clean hash + data marker | Lazy `[data-modal]` lookup; legacy `.modal` + `id` hash remains fallback |
| `grid-cluster` | Clean data grid + legacy grid classes | `grid-N` remains fallback |
| `cards` | Clean data marker + legacy class | Per-container color/border/padding options |
| `faq` | Clean data marker + legacy class | Divider + heading based question blocks |
| `switcher` | Clean data targets + legacy class fallback | Whole containers use `data-switcher-target` + `data-switcher-index`; cluster mode is removed |
