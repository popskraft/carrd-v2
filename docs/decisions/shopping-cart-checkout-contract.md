# ADR: Shopping Cart checkout contract

## Status

Accepted and implemented — 2026-06-30. Resolves `OPEN-QUESTIONS.md` Q003.

## Context

The clean Shopping Cart runtime opens checkout through a Carrd Section Break hash, then finds the order textarea inside `#form-shopping-cart`. The former `data-shopping-cart-target` selector was still declared in configuration and documentation but was not read anywhere in runtime.

Keeping an inert marker creates a false second checkout path and makes users expect behavior that does not exist.

## Decision

- Remove `data-shopping-cart-target` from runtime configuration, active automation and current documentation.
- Do not keep it as a compatibility path.
- Use one checkout contract:
  - Section Break name: `shopping-cart`.
  - Form ID: `form-shopping-cart`.
  - Textarea marker: `data-shopping-cart-output="order-details"`.
- Keep `checkoutTargetId` as the optional configuration for changing the Carrd Section Break hash.

## Consequences

- Runtime checkout behavior does not change because the removed selector was unused.
- `main-template` automation clears the obsolete class/attribute without adding a replacement marker.
- Historical migration snapshots and execution evidence may retain the old marker as immutable history, but it is not a current contract.
