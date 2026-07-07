# Carrd MCP V1 Guide

## Purpose

Describe the minimal MCP server for deterministic Carrd Builder control in `cardbuilder`.

## When To Use

- when a client needs a thin MCP adapter over the existing CDP control core
- when a session needs deterministic `semanticKey -> target -> read/update` flow
- when adding a second Carrd site profile without changing the core approach

## Architecture

Three layers only:

- `control core`
  - site resolution
  - readiness checks
  - live CDP read/write
  - target resolution
  - preflight and readback verification
- `profile knowledge`
  - `site-profile.json`
  - `knowledge-status.json`
  - `mcp-targets.json`
- `MCP adapter`
  - stdio JSON-RPC
  - tool schemas
  - no Carrd business logic beyond argument routing

## Profile Package

The active MCP package for a site is:

- `data/manifests/site-profile.json`
  - MCP enable flag
  - target map path
  - semantic namespace
  - contract mode
- `data/manifests/mcp-targets.json`
  - deterministic semantic target registry
  - allowlisted mutation paths
  - proposed `cx-*` classes
  - live sync readback fields
- `data/manifests/knowledge-status.json`
  - freshness and trust record

## Semantic Contract

Primary rule:

- every managed target has one `semanticKey`

Preferred persistent Carrd marking:

- one proposed `cx-*` class per managed target

Current v1 bootstrap mode:

- `main-template` runs in `bootstrap-file-first`
- target resolution uses `semanticKey -> componentId` from `mcp-targets.json`
- proposed `cx-*` classes are recorded but not auto-applied while save/publish stays operator-only

This keeps edits deterministic without requiring automated live save operations.

## Auto-Onboarding

One command maps a whole site into MCP control without a manual targeting pass:

```bash
# Registered site (re-run is idempotent; also handles drift):
npm run onboard:site -- --site <ref> [--dry-run]

# New site (operator supplies slug + dedicated Chrome debug profile):
npm run onboard:site -- --builder-url <url> --slug <slug> --chrome-profile-dir <dir>
```

Pipeline: readiness pre-check -> live inventory (enumerate + panel probe, with a
stability re-scan; unstable inventories fail as `inventory-unstable`) -> deterministic
target generation from `cardbuilder/data/mutation-catalog.json` (semanticKey per
component; unsupported types land in `unmapped[]` with a reason) -> manifests written
-> readback `sync_profile` -> write probe (dry-run only) -> on green probe
`capabilities.contentPatch` flips to `state-write` (owner-approved default;
`--no-write-enable` opts out) -> final deep check.

The site is controllable only when `check_profile` reports
`readinessStatus: fully-mapped-safe-to-control` (contract probes pass, coverage 100%,
knowledge fresh, targets present, write enabled).

Operator boundary (never automated): debug Chrome + Carrd login + open Builder tab,
slug and `chromeProfileDir` for new sites, applying proposed `cx-*` classes, save/publish.

Drift handling: re-run `onboard_site`. semanticKeys are preserved by componentId,
added components get new keys, removed ones are reported in `removedTargets`.
`check_profile` reports `contract-drift` per probe instead of raising on the next read.

## Tool Surface

- `list_profiles`
  - list registered Carrd profiles and MCP readiness metadata
- `check_profile`
  - run readiness checks without mutation; returns `contractCheck` (live DOM/API probes),
    `coverage` (live components vs target map), and `readinessStatus` with reasons
- `onboard_site`
  - full auto-onboarding as above; `dryRun=true` by default reports without writing files
- `sync_profile`
  - read live Builder state for known targets and optionally persist refreshed target metadata
- `resolve_target`
  - resolve `semanticKey`, `componentId`, or a fuzzy phrase into one deterministic target or an ambiguity report
- `read_target`
  - read live allowlisted fields for one exact target
- `update_target`
  - preflight one allowlisted field and mutate only when `commit=true`

## Write Safety

Every write follows the same sequence:

1. resolve exact target
2. check profile capability is `state-write`
3. verify requested path is allowlisted
4. verify `expectedBefore` when supplied
5. mutate one field only
6. mark Builder dirty state through Builder runtime APIs
7. read back the same field and report match/mismatch

The server does not:

- publish
- save
- run raw arbitrary JS from the MCP client
- mutate unknown paths

## Main Files

- [carrd-mcp-server.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/carrd-mcp-server.mjs)
- [control-core.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/lib/control-core.mjs)
- [readiness-core.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/lib/readiness-core.mjs)
- [onboarding-core.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/lib/onboarding-core.mjs)
- [keygen.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/lib/keygen.mjs)
- [mutation-catalog.json](/Users/popskraft/Projects/carrd-v2/cardbuilder/data/mutation-catalog.json)
- [mcp-targets.json](/Users/popskraft/Projects/carrd-v2/cardbuilder/projects/main-template/data/manifests/mcp-targets.json)

## Validation

- `npm run test:cardbuilder --silent`
- `npm run onboard:site -- --site main-template --dry-run`
- `node cardbuilder/scripts/carrd/carrd-mcp-server.mjs`
- `node cardbuilder/scripts/carrd/sync-mcp-profile.mjs --site main-template`
- `node cardbuilder/scripts/carrd/check-site-readiness.mjs --site main-template --no-fail`

## Notes

- `faktura` still has an empty target map; the operator runs
  `npm run onboard:site -- --site faktura` (with its debug Chrome open) to fill it —
  no manual targeting pass is needed anymore.
- Panel probing shows each component in the properties panel (~140ms each); large
  sites take proportionally longer during onboarding. `--no-panel-probe` skips it.
- Extend `mutation-catalog.json` only with live-verified paths; unsupported component
  types stay in `unmapped[]` rather than getting guessed mutations.
