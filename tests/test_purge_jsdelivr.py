import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts import purge_jsdelivr as purge


class PurgeJsdelivrTests(unittest.TestCase):
    def test_resolve_cdn_ref_uses_version_file_by_default(self):
        with TemporaryDirectory() as temp_dir:
            version_file = Path(temp_dir) / "VERSION"
            version_file.write_text("9.8.7\n", encoding="utf-8")

            self.assertEqual(purge.resolve_cdn_ref(version_file=version_file), "9.8.7")

    def test_resolve_cdn_ref_prefers_explicit_ref(self):
        with TemporaryDirectory() as temp_dir:
            version_file = Path(temp_dir) / "VERSION"
            version_file.write_text("9.8.7\n", encoding="utf-8")

            self.assertEqual(
                purge.resolve_cdn_ref("release-candidate", version_file=version_file),
                "release-candidate",
            )

    def test_build_purge_base_uses_repository_and_ref(self):
        self.assertEqual(
            purge.build_purge_base("2.1.0"),
            "https://purge.jsdelivr.net/gh/popskraft/carrd-v2@2.1.0/dist",
        )
        self.assertEqual(
            purge.build_purge_base("main", repository="example/repo"),
            "https://purge.jsdelivr.net/gh/example/repo@main/dist",
        )

    def test_build_purge_base_rejects_empty_inputs(self):
        with self.assertRaisesRegex(ValueError, "CDN ref must not be empty"):
            purge.build_purge_base("")
        with self.assertRaisesRegex(ValueError, "Repository must not be empty"):
            purge.build_purge_base("2.1.0", repository="")

    def test_collect_cdn_assets_includes_top_level_and_plugin_assets(self):
        assets = purge.collect_cdn_assets()

        self.assertIn("theme-runtime.min.css", assets)
        self.assertIn("theme-runtime.min.js", assets)
        self.assertIn("theme-core.min.css", assets)
        self.assertIn("theme-core.min.js", assets)
        self.assertIn("shopping-cart/shopping-cart.min.js", assets)
        self.assertIn("cookie-banner/cookie-banner.min.css", assets)


if __name__ == "__main__":
    unittest.main()
