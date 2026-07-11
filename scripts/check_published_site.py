#!/usr/bin/env python3
"""Check published Carrd HTML against the immutable CDN release contract."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

REPO = "popskraft/carrd-v2"
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
REF_PATTERN = re.compile(
    r"https://cdn\.jsdelivr\.net/gh/"
    + re.escape(REPO)
    + r"@([^/\"'\s<>]+)(?:/dist/[^\"'\s<>]+)"
)


def read_version(root: Path) -> str:
    return (root / "VERSION").read_text(encoding="utf-8").strip()


def fetch(url: str) -> tuple[int, str]:
    request = Request(url, headers={"User-Agent": "carrd-v2-published-check/1"})
    with urlopen(request, timeout=20) as response:
        return int(response.status), response.read().decode("utf-8", errors="replace")


def check_html(html: str, version: str) -> list[str]:
    errors: list[str] = []
    refs = sorted(set(REF_PATTERN.findall(html)))
    if not refs:
        errors.append("No repo-owned jsDelivr refs found in published HTML")
    for ref in refs:
        if ref != version:
            errors.append(f"Published HTML uses @{ref}; expected only @{version}")
        if not SEMVER.fullmatch(ref):
            errors.append(f"Published HTML uses non-SemVer CDN ref @{ref}")
    for forbidden in ("@main", "?rev="):
        if forbidden in html:
            errors.append(f"Published HTML contains forbidden development marker {forbidden}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="https://mini.crd.co/")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    version = read_version(args.root)
    try:
        status, html = fetch(args.url)
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"Published check blocked: {exc}", file=sys.stderr)
        return 2
    if status != 200:
        print(f"Published check failed: HTTP {status}", file=sys.stderr)
        return 1
    errors = check_html(html, version)
    if errors:
        for error in errors:
            print(f"Published check failed: {error}", file=sys.stderr)
        return 1
    print(f"Published check passed: {args.url} uses only @{version} repo-owned refs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
