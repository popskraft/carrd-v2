from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = REPO_ROOT / "VERSION"
CHANGELOG_FILE = REPO_ROOT / "CHANGELOG.md"
DIST_DIR = REPO_ROOT / "dist"
SEMVER_PATTERN = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")
CDN_REF_PATTERN = re.compile(r"cdn\.jsdelivr\.net/gh/popskraft/carrd-v2@([^/]+)/dist/")


def read_version(path: Path = VERSION_FILE) -> str:
    return path.read_text(encoding="utf-8").strip()


def validate_version(version: str) -> list[str]:
    if SEMVER_PATTERN.fullmatch(version):
        return []
    return [f"VERSION must use MAJOR.MINOR.PATCH without a v prefix: {version!r}"]


def validate_changelog(version: str, path: Path = CHANGELOG_FILE) -> list[str]:
    content = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"^## \[{re.escape(version)}\] - \d{{4}}-\d{{2}}-\d{{2}}$", re.MULTILINE)
    if pattern.search(content):
        return []
    return [f"CHANGELOG.md has no dated release section for {version}"]


def validate_tag_is_new(version: str, repo_root: Path = REPO_ROOT) -> list[str]:
    result = subprocess.run(
        ["git", "tag", "--list", f"v{version}"],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    if not result.stdout.strip():
        return []
    return [f"Release tag v{version} already exists; increment VERSION instead of reusing it"]


def validate_cdn_refs(version: str, dist_dir: Path = DIST_DIR) -> list[str]:
    errors: list[str] = []
    for path in sorted(dist_dir.rglob("*-cdn.html")):
        refs = CDN_REF_PATTERN.findall(path.read_text(encoding="utf-8"))
        wrong_refs = sorted({ref for ref in refs if ref != version})
        if wrong_refs:
            relative_path = Path("dist") / path.relative_to(dist_dir)
            errors.append(
                f"{relative_path} uses CDN refs {wrong_refs}; expected only @{version}"
            )
    return errors


def main() -> int:
    version = read_version()
    errors = [
        *validate_version(version),
        *validate_changelog(version),
        *validate_tag_is_new(version),
        *validate_cdn_refs(version),
    ]
    if errors:
        for error in errors:
            print(f"Release check failed: {error}", file=sys.stderr)
        return 1
    print(f"Release candidate v{version} is consistent and uses a new version")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
