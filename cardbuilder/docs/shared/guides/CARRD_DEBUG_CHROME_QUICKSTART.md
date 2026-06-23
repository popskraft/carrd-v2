# Carrd Debug Chrome Quickstart

## Purpose

Start a reusable Chrome remote-debugging session for Carrd Builder work with one command.

## Default Scripts

### Start the session

```bash
/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/open-debug-chrome.sh
```

What it does:

1. reads the live site registry plus the active pointer
2. starts a dedicated Chrome debug profile on port `9222`
3. opens:
   - the active Builder URL
   - the active published URL when one is known
4. prints the local debug endpoints

### Check session status

```bash
/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/debug-chrome-status.sh
```

What it prints:

- `json/version`
- `json/list`
- page ids and `webSocketDebuggerUrl` values for the current debug tabs

## Default Runtime Values

- Port:
  - `9222`
- Profile dir:
  - Resolved from `chromeProfileDir` in `cardbuilder/data/sites.json` for the active site.
  - Falls back to `~/.codex/chrome-debug-profile` if the field is absent.
- Registry:
  - `/Users/popskraft/Projects/carrd-v2/cardbuilder/data/sites.json`

## Per-Site Chrome Profiles

Each site in `sites.json` has a `chromeProfileDir` field pointing to a dedicated Chrome user-data directory.
The script reads this field automatically — switching `active-template.json` to a different site will launch
Chrome under the matching profile.

Current profile mapping:

| Site | Chrome profile dir |
|---|---|
| `main-template` | `~/.codex/chrome-debug-profile` |
| `lunar-auto-film` | `~/.codex/chrome-debug-profile-lunar-auto-film` |
| `faktura` | `~/.codex/chrome-debug-profile-faktura` |

When adding a new site to the registry, set `chromeProfileDir` to a new unique path under `~/.codex/`.
Chrome will create the directory on first launch.

## Optional Overrides

You can override the profile per run:

```bash
CARRD_DEBUG_PORT=9333 /Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/open-debug-chrome.sh
```

```bash
CARRD_DEBUG_PROFILE="$HOME/.codex/chrome-debug-profile-alt" /Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/open-debug-chrome.sh
```

## Recommended Everyday Flow

1. Run:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/open-debug-chrome.sh`
2. Log into Carrd in that debug Chrome profile if needed.
3. Confirm the session:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/debug-chrome-status.sh`
4. Check read-only readiness:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/check-site-readiness.mjs --site <site-slug>`
5. Hand the resulting `webSocketDebuggerUrl` and page ids to the browser-capable agent if direct automation is needed.

## Confirmed Positive Pattern

This workflow is now positively validated for real Carrd Builder work in this repo.

Confirmed successful use case:

1. detect the live debug tab with:
   - `/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/debug-chrome-status.sh`
2. inspect Builder state through CDP with:
   - [/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/cdp-eval.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/cdp-eval.mjs)
3. apply controlled draft plugin rollout with:
   - [/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/refresh-builder-plugins.mjs](/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/refresh-builder-plugins.mjs)
4. save raw before/after evidence under:
   - `cardbuilder/projects/main-template/data/raw-imports/...`
5. verify the draft by exact hash readback before asking the owner to publish

Important boundary:

- this is an accepted draft-mutation workflow
- it does not replace published verification or post-publish scan refresh
- use it when deterministic Builder read/write is better than manual clicking

## Optional Shell Alias

If you want a shorter command, add this to `~/.zshrc`:

```bash
alias carrd-debug='/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/open-debug-chrome.sh'
alias carrd-debug-status='/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/debug-chrome-status.sh'
```

Then reload the shell:

```bash
source ~/.zshrc
```
