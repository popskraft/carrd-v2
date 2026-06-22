# OPEN-QUESTIONS.md

## Active Questions

### Q1. `header-nav` exception policy

Question:
Should `header-nav` remain an approved structural exception without a public `data-*` contract?

Why it matters:
This decides whether current docs are final or whether a new public contract must be designed later.

Current recommendation:
Keep it as an explicit structural exception unless live Carrd usage proves a marker-based contract is operationally simpler.

### Q2. `switcher` cluster mode status

Question:
Is `data-switcher-v2-cluster` a first-class primary path or an advanced compatibility path?

Why it matters:
This changes how strongly cluster mode should appear in public docs and Builder examples.

Current recommendation:
Keep `data-switcher-v2-target` as the primary path and document cluster mode as advanced until live usage justifies first-class status.

### Q3. `shopping-cart` target policy

Question:
Should `data-shopping-cart-v2-target` remain public guidance or be demoted to compatibility-only guidance?

Why it matters:
This affects the public mental model for checkout setup and whether docs keep two parallel output/target concepts.

Current recommendation:
Keep `data-shopping-cart-v2-output` as the preferred explicit contract and treat target-based guidance as compatibility unless a live Builder flow still depends on it.

### Q4. Long-term fallback policy

Question:
Which legacy fallbacks stay permanently and which are removed after freeze?

Why it matters:
Without this decision, docs and runtime cannot converge on a final “supported vs temporary” policy.

Current recommendation:
Keep harmless compatibility aliases that do not distort the public mental model; retire generic attrs and misleading trigger names after live migration is complete.

### Q5. Canonical live smoke pages

Question:
Which real Carrd pages are the canonical smoke-test surfaces for:
- hash-driven plugins
- grouped marker plugins
- runtime clone/floating UI plugins
- structural exceptions

Why it matters:
Freeze and fallback-removal decisions should depend on named live evidence, not ad hoc manual checks.

Current recommendation:
Assign one stable page per contract family before running the live migration pass.

### Q6. Debug Chrome bootstrap reliability for live Carrd track

Question:
Should `cardbuilder/scripts/carrd/open-debug-chrome.sh` remain the canonical bootstrap, or should the live track switch to an `open -na "Google Chrome" --args ...` launch path with first-run suppression flags?

Why it matters:
The current live migration flow depends on a deterministic CDP session. In the latest check, `open-debug-chrome.sh` reported success on port `9222`, but the endpoint became unavailable immediately after startup, while direct `open -na ... --remote-debugging-port=<port> --no-first-run --no-default-browser-check --disable-default-apps --disable-sync` produced a stable CDP session and opened the expected Carrd Builder page.

Current recommendation:
Treat the existing script as needing verification before the next live pass; if the issue reproduces, promote the `open -na ...` path into the canonical bootstrap and then re-check `check-site-readiness.mjs` against the same live Builder tab.
