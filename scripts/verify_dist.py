from __future__ import annotations

import hashlib
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts import minify_plugins as build


SRC_DIR = REPO_ROOT / "src"
DIST_DIR = REPO_ROOT / "dist"


def file_digest(path: Path) -> str:
    hasher = hashlib.sha256()
    hasher.update(path.read_bytes())
    return hasher.hexdigest()


def snapshot_tree(root: Path) -> dict[str, str]:
    if not root.exists():
        return {}

    snapshot: dict[str, str] = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            snapshot[path.relative_to(root).as_posix()] = file_digest(path)
    return snapshot


def expected_dist_files(repo_root: Path) -> set[str]:
    expected: set[str] = {"README.md"}
    src_dir = repo_root / "src"
    bundle_config = build.load_bundle_config(repo_root).get("cdn_bundle", {})

    if (repo_root / "CHANGELOG.md").exists():
        expected.add("CHANGELOG.md")
    if (src_dir / "theme-design-tokens.css").exists():
        expected.add("theme-design-tokens.css")
        expected.add("theme-design-system.html")
    if (src_dir / "theme-ui.css").exists():
        expected.add("theme-ui.css")
    if bundle_config.get("enabled", False):
        bundle_name = bundle_config.get("name", "theme-core")
        expected.add(f"{bundle_name}.min.css")
        expected.add(f"{bundle_name}.min.js")
        expected.add(f"{bundle_name}-cdn.html")

    for entry in sorted(src_dir.iterdir(), key=lambda path: path.name):
        if not entry.is_dir() or entry.name.startswith("."):
            continue
        rel = Path(entry.name)
        if build.is_dist_build_excluded(rel):
            continue

        if (entry / "README.md").exists():
            expected.add(f"{entry.name}/README.md")

        has_css = any(entry.glob("*.css"))
        has_js = any(entry.glob("*.js"))
        if has_css:
            expected.add(f"{entry.name}/{entry.name}.min.css")
        if has_js:
            expected.add(f"{entry.name}/{entry.name}.min.js")
        if has_css or has_js:
            expected.add(f"{entry.name}/{entry.name}-cdn.html")
        if has_css or has_js:
            expected.add(f"{entry.name}/{entry.name}-embed.html")

    return expected


def compare_snapshots(expected: dict[str, str], actual: dict[str, str]) -> list[str]:
    issues: list[str] = []

    missing = sorted(set(expected) - set(actual))
    extra = sorted(set(actual) - set(expected))
    changed = sorted(
        path for path in set(expected).intersection(actual) if expected[path] != actual[path]
    )

    if missing:
        issues.append("Missing files:\n- " + "\n- ".join(missing))
    if extra:
        issues.append("Unexpected files:\n- " + "\n- ".join(extra))
    if changed:
        issues.append("Changed files:\n- " + "\n- ".join(changed))

    return issues


def main() -> int:
    before_src = snapshot_tree(SRC_DIR)

    with tempfile.TemporaryDirectory(prefix="carrd-verify-dist-") as temp_dir:
        temp_dist = Path(temp_dir) / "dist"
        build.run(SRC_DIR, temp_dist, docs_only=False)

        after_src = snapshot_tree(SRC_DIR)
        if before_src != after_src:
            print("verify:dist failed: build changed source files under src/.", file=sys.stderr)
            return 1

        temp_snapshot = snapshot_tree(temp_dist)
        dist_snapshot = snapshot_tree(DIST_DIR)

        required_files = expected_dist_files(REPO_ROOT)
        missing_required = sorted(path for path in required_files if path not in temp_snapshot)
        if missing_required:
            print("verify:dist failed: build output is missing required files:", file=sys.stderr)
            for path in missing_required:
                print(f"- {path}", file=sys.stderr)
            return 1

        diff_issues = compare_snapshots(temp_snapshot, dist_snapshot)
        if diff_issues:
            print("verify:dist failed: committed dist/ does not match a clean rebuild.", file=sys.stderr)
            for issue in diff_issues:
                print(issue, file=sys.stderr)
            return 1

    print("verify:dist passed: dist/ matches a clean rebuild and src/ stayed unchanged.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
