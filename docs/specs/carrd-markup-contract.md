# Carrd Markup Contract

Rules governing how plugins interact with Carrd author HTML.

## Core Rules

- Existing Carrd author HTML is not agent-controlled by default.
- Do not introduce new user-facing classes, IDs, or `data-*` attributes in Carrd markup unless the Human Owner explicitly decides to add them.
- Approved v2 plugin bindings use `data-<plugin>="<name>"`; classes are styling hooks or legacy fallback only.
- Approved v2 hash triggers use `#data-<plugin>-<name>` and must be ignored unless a matching plugin data target exists.
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

| Plugin | Contract type | Notes |
|--------|--------------|-------|
| `accordeon` | V2 hash + attribute group | `#data-accordeon-v2-<name>` toggles containers marked `data-accordeon-v2="<name>"`; `#accordeon-<name>` and `data-accorderon-v2` remain legacy fallback |
| `header-nav` | Header scope + collapse marker | `#header` activates only when it contains `.header-mobile-el-collapsing`; mobile anti-jump collapse only, no sticky shell |
| `floating-cta` | V2 data marker + position | `data-floating-v2="<name>"` marks each source element to clone; `data-floating-v2-position` sets the base position; `data-floating-v2-position-mobile` can override it on mobile; `data-floating-v2-hide` can hide the clone on `mobile` or `desktop` |
| `cookie-banner` | V2 data marker + legacy fallback | `data-cookie-v2="<name>"` is primary; `data-cookie-v2-indent`, `data-cookie-v2-indent-mobile`, `data-cookie-v2-delay`, `data-cookie-v2-days`, and `data-cookie-v2-position` configure each banner; literal `data-cookie-v2="banner"`, old `.cookie-banner`, and `#cookie-baner` remain fallback |
| `shopping-cart` | Class/name-first + ID fallback | Legacy ID fallbacks for older installs |
| `modal` | V2 hash + data modal | `#data-modal-v2-<name>` opens `.container-component[data-modal-v2="<name>"]`; legacy `.modal` + `id` hash remains fallback |
| `grid-cluster` | V2 data grid + legacy grid classes | `data-grid-v2="<name>"` groups consecutive containers; `grid-N` remains fallback; `columns` is archived legacy |
| `cards` | V2 data marker + legacy class | `[data-cards-v2="<name>"]` is the preferred container marker; `data-cards-v2-color*` and `data-cards-v2-padding*` are primary options; `.cards` and older generic `data-*` attrs remain fallback |
| `faq` | V2 data marker + legacy class | `data-faq-v2="<name>"` marks FAQ containers; question blocks use Carrd dividers plus headings; `.FAQContainer` remains fallback |
| `switcher` | V2 data targets + legacy class/cluster fallback | `data-switcher-v2-target="<name>"` targets are primary; class-index and `data-switcher-v2-cluster` remain fallback. See `docs/specs/plugin-v2-data-contract.md` |
