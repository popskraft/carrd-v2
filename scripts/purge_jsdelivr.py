from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist"
VERSION_FILE = REPO_ROOT / "VERSION"
DEFAULT_REPOSITORY = "popskraft/carrd-v2"
PURGE_HOST = "https://purge.jsdelivr.net/gh"


def read_version(version_file: Path = VERSION_FILE) -> str:
    version = version_file.read_text(encoding="utf-8").strip()
    if not version:
        raise ValueError(f"VERSION file is empty: {version_file}")
    return version


def resolve_cdn_ref(cli_ref: str | None = None, version_file: Path = VERSION_FILE) -> str:
    ref = (cli_ref or "").strip()
    if ref:
        return ref
    return read_version(version_file)


def build_purge_base(cdn_ref: str, repository: str = DEFAULT_REPOSITORY) -> str:
    ref = str(cdn_ref or "").strip()
    if not ref:
        raise ValueError("CDN ref must not be empty.")
    repo = str(repository or "").strip()
    if not repo:
        raise ValueError("Repository must not be empty.")
    return f"{PURGE_HOST}/{repo}@{ref}/dist"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Purge jsDelivr cache for the generated dist assets."
    )
    parser.add_argument(
        "--ref",
        default="",
        help="Git ref to purge (tag, branch, or commit). Defaults to VERSION.",
    )
    parser.add_argument(
        "--repo",
        default=DEFAULT_REPOSITORY,
        help=f"GitHub repository slug. Defaults to {DEFAULT_REPOSITORY}.",
    )
    return parser.parse_args(argv)


def collect_cdn_assets() -> list[str]:
    assets = [
        "theme-design-tokens.css",
        "theme-design-tokens-embed.html",
        "theme-ui.css",
        "theme-ui-runtime.css",
        "theme-runtime.min.css",
        "theme-runtime.min.js",
        "theme-core.min.css",
        "theme-core.min.js",
    ]

    for path in sorted(DIST_DIR.glob("*/*.min.css")):
        assets.append(path.relative_to(DIST_DIR).as_posix())
    for path in sorted(DIST_DIR.glob("*/*.min.js")):
        assets.append(path.relative_to(DIST_DIR).as_posix())

    return sorted(set(assets))


def purge_asset(asset: str, purge_base: str) -> tuple[bool, str]:
    url = f"{purge_base}/{asset}"
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


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        purge_base = build_purge_base(
            resolve_cdn_ref(args.ref, version_file=VERSION_FILE),
            repository=args.repo,
        )
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2

    failures: list[str] = []
    print(f"Purging jsDelivr assets from {purge_base}")
    for asset in collect_cdn_assets():
        ok, message = purge_asset(asset, purge_base)
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
