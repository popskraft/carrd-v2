from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist"
PURGE_BASE = "https://purge.jsdelivr.net/gh/popskraft/carrd-v2@main/dist"


def collect_cdn_assets() -> list[str]:
    assets = [
        "theme-design-tokens.css",
        "theme-ui.css",
        "theme-core.min.css",
        "theme-core.min.js",
    ]

    for path in sorted(DIST_DIR.glob("*/*.min.css")):
        assets.append(path.relative_to(DIST_DIR).as_posix())
    for path in sorted(DIST_DIR.glob("*/*.min.js")):
        assets.append(path.relative_to(DIST_DIR).as_posix())

    return sorted(set(assets))


def purge_asset(asset: str) -> tuple[bool, str]:
    url = f"{PURGE_BASE}/{asset}"
    try:
        with urlopen(url, timeout=30) as response:
            payload = response.read().decode("utf-8")
    except URLError as error:
        return False, f"{asset}: {error}"

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        data = {}

    status = data.get("status")
    if status == "finished":
        return True, f"{asset}: finished"

    return False, f"{asset}: unexpected response {payload}"


def main() -> int:
    failures: list[str] = []
    for asset in collect_cdn_assets():
        ok, message = purge_asset(asset)
        print(message)
        if not ok:
            failures.append(message)

    if failures:
        print("CDN purge failed for one or more assets.", file=sys.stderr)
        return 1

    print("CDN purged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
