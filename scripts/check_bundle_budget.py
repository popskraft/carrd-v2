#!/usr/bin/env python3
"""Fail the build when a generated dist asset exceeds its size budget.

Standalone by design: it reads only the already-generated `dist/` outputs and a
`scripts/bundle-budget.json` config, and never touches the dist clean-rebuild
contract enforced by `verify_dist.py`. Run after `npm run build`.

Usage: python3 scripts/check_bundle_budget.py
Exit code 0 when every asset is within budget, 1 otherwise.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CONFIG_PATH = ROOT / "scripts" / "bundle-budget.json"


def load_config() -> dict:
    with CONFIG_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def collect_rows(config: dict):
    default_max = int(config.get("default_plugin_max_bytes", 24000))
    overrides = config.get("plugin_overrides", {})
    bundles = config.get("bundles", {})

    rows = []  # (name, size, budget, ok)

    # Per-plugin minified JS: dist/<slug>/<slug>.min.js
    for min_js in sorted(DIST.glob("*/*.min.js")):
        slug = min_js.parent.name
        if min_js.name != f"{slug}.min.js":
            continue
        budget = int(overrides.get(slug, default_max))
        size = min_js.stat().st_size
        rows.append((f"{slug}/{min_js.name}", size, budget, size <= budget))

    # Top-level bundles.
    for bundle_name, budget in bundles.items():
        path = DIST / bundle_name
        if path.exists():
            size = path.stat().st_size
            rows.append((bundle_name, size, int(budget), size <= int(budget)))

    return rows


def main() -> int:
    if not DIST.exists():
        print("check_bundle_budget: dist/ not found — run `npm run build` first.", file=sys.stderr)
        return 1

    config = load_config()
    rows = collect_rows(config)
    if not rows:
        print("check_bundle_budget: no dist assets found — run `npm run build` first.", file=sys.stderr)
        return 1

    width = max(len(name) for name, *_ in rows)
    failures = []
    for name, size, budget, ok in rows:
        flag = "OK " if ok else "OVER"
        print(f"[{flag}] {name.ljust(width)}  {size:>7} / {budget:>7} bytes")
        if not ok:
            failures.append((name, size, budget))

    if failures:
        print("\nBundle budget check FAILED:")
        for name, size, budget in failures:
            print(f"  - {name}: {size} bytes exceeds budget {budget} bytes (+{size - budget})")
        print("Reduce the asset or raise its budget in scripts/bundle-budget.json.")
        return 1

    print(f"\nBundle budget check passed: {len(rows)} assets within budget.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
