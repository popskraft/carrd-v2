import tempfile
import unittest
from pathlib import Path

from scripts.check_release import (
    validate_cdn_refs,
    validate_changelog,
    validate_version,
)


class CheckReleaseTests(unittest.TestCase):
    def test_accepts_stable_semver(self):
        self.assertEqual(validate_version("2.1.1"), [])

    def test_rejects_prefixed_or_incomplete_version(self):
        self.assertTrue(validate_version("v2.1.1"))
        self.assertTrue(validate_version("2.1"))

    def test_requires_dated_changelog_section(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            changelog = Path(temp_dir) / "CHANGELOG.md"
            changelog.write_text("## [2.1.1] - 2026-07-08\n", encoding="utf-8")
            self.assertEqual(validate_changelog("2.1.1", changelog), [])
            self.assertTrue(validate_changelog("2.1.2", changelog))

    def test_rejects_mixed_generated_cdn_versions(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dist_dir = Path(temp_dir) / "dist"
            dist_dir.mkdir()
            (dist_dir / "theme-runtime-cdn.html").write_text(
                "https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@2.1.0/dist/a.css\n"
                "https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@2.1.1/dist/a.js\n",
                encoding="utf-8",
            )
            errors = validate_cdn_refs("2.1.1", dist_dir)
            self.assertEqual(len(errors), 1)
            self.assertIn("2.1.0", errors[0])


if __name__ == "__main__":
    unittest.main()
