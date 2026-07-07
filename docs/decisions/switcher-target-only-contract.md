# ADR: Switcher target-only contract

## Status

Accepted — 2026-06-30. Resolves `OPEN-QUESTIONS.md` Q002. Implementation is tracked in `ROADMAP.md` #37.

## Context

`switcher` currently supports the explicit `data-switcher-target` path and a separate order-based cluster mode. Cluster mode adds another public mental model, wider lookup scope, order-dependent mapping, dedicated configuration, runtime branches, tests and documentation.

The `main-template` migration package already uses cluster mode for the `cases` switcher, so runtime removal before markup migration would break that switcher after a CDN update.

## Decision

- Remove `data-switcher-mode="cluster"` and `data-switcher-cluster` completely.
- Do not keep cluster mode as a compatibility path.
- Keep one public target contract: `data-switcher`, `data-switcher-target` and optional `data-switcher-index`.
- Use explicit indexes whenever button-to-target mapping must remain stable after DOM reordering.

## Migration Order

1. Migrate `main-template` `cases` targets to `data-switcher-target="cases"` with explicit indexes `1`, `2` and `3`.
2. Verify the Builder draft and published behavior before changing the shared runtime.
3. Remove cluster runtime branches, configuration, tests and documentation.
4. Rebuild `dist/`, run the full validation suite and perform post-update live verification.

## Release Guard

Do not publish or purge a cluster-free CDN bundle while any known Carrd site still uses `data-switcher-mode="cluster"` or `data-switcher-cluster`.
