# Koryphey Automation Runner

## Purpose

Run the migration automation for `koryphey-online` against an already-open Chrome CDP session.

## When To Use

- dry-run the migration flow
- execute the migration flow
- roll back the last standard run

## Steps

1. Start Chrome with remote debugging.
2. Log into Carrd in that Chrome profile.
3. Open the source and target Builder tabs.
4. Install dependencies in this folder.
5. Run the dry-run, execute, copy/paste, or rollback command you need.

## Commands

```bash
./start-cdp-chrome.sh
npm install
npm run dry-run
npm run execute
npm run dry-run-cp
npm run execute-cp
npm run rollback-last-run
```

## Notes

- This is best-effort UI automation for a visual builder.
- Never save or publish automatically.
- Companion docs live in [cardbuilder/docs/projects/koryphey-online/INDEX.md](/Users/popskraft/Projects/carrd-v2/cardbuilder/docs/projects/koryphey-online/INDEX.md).
- Runtime evidence is written under `../data/runs/`.
