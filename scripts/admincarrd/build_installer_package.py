#!/usr/bin/env python3
"""Build a browser installer bundle for AdminCarrd."""

from __future__ import annotations

import argparse
import re
import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE_DIR = ROOT / "admincarrd"
INSTALLER_SOURCE = ROOT / "scripts" / "admincarrd" / "install.php"
DEFAULT_OUTPUT_DIR = ROOT / "_build" / "admincarrd-installer"
PACKAGE_NAME = "admincarrd-package.zip"

EXCLUDED_BASENAMES = {
    ".DS_Store",
    "setup-token.txt",
    "rate_limit.json",
    "upload_rate_limit.json",
    "sessions.json",
    ".tmp_sweep",
}


def sanitize_config(content: str) -> str:
    content = re.sub(r"'setup_complete'\s*=>\s*(?:true|false)", "'setup_complete' => false", content)
    content = re.sub(r"'password_hash'\s*=>\s*'[^']*'", "'password_hash' => ''", content)
    return content


def should_include(path: Path) -> bool:
    if path.name in EXCLUDED_BASENAMES:
        return False
    if "__pycache__" in path.parts:
        return False
    return True


def add_directory_entries(zip_file: zipfile.ZipFile) -> None:
    required_dirs = [
        "admincarrd/var/",
        "admincarrd/var/logs/",
        "admincarrd/var/setup/",
        "admincarrd/var/uploads/",
        "admincarrd/var/uploads/tmp/",
        "admincarrd/var/uploads/original-backups/",
        "admincarrd/var/uploads/publish-backups/",
    ]
    for entry in required_dirs:
        info = zipfile.ZipInfo(entry)
        info.external_attr = 0o755 << 16
        zip_file.writestr(info, "")


def build(output_dir: Path) -> tuple[Path, Path]:
    if not MODULE_DIR.is_dir():
        raise RuntimeError(f"AdminCarrd module not found: {MODULE_DIR}")
    if not INSTALLER_SOURCE.is_file():
        raise RuntimeError(f"Installer source not found: {INSTALLER_SOURCE}")

    output_dir.mkdir(parents=True, exist_ok=True)
    package_path = output_dir / PACKAGE_NAME
    installer_path = output_dir / "install.php"

    with zipfile.ZipFile(package_path, "w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        add_directory_entries(zip_file)
        for path in sorted(MODULE_DIR.rglob("*")):
            if not path.is_file() or not should_include(path):
                continue

            relative = path.relative_to(MODULE_DIR)
            archive_name = Path("admincarrd") / relative

            if relative.as_posix() == "app/config/config.php":
                zip_file.writestr(
                    archive_name.as_posix(),
                    sanitize_config(path.read_text(encoding="utf-8")),
                )
                continue

            zip_file.write(path, archive_name.as_posix())

    shutil.copy2(INSTALLER_SOURCE, installer_path)
    return installer_path, package_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Build AdminCarrd install.php + package ZIP.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for install.php and admincarrd-package.zip.",
    )
    args = parser.parse_args()

    installer_path, package_path = build(args.output_dir)
    print(f"Installer: {installer_path}")
    print(f"Package:   {package_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
