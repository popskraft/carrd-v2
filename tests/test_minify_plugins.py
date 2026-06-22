import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts import minify_plugins as m


def build_valid_plugin_readme(title: str) -> str:
    return (
        f"# {title}\n\n"
        "Short intro.\n\n"
        "## What You Do in Carrd\nBody\n\n"
        "## How It Works in Carrd\nBody\n\n"
        "## How To Check That It Works\nBody\n\n"
        "## Configuration\nBody\n"
    )


class MinifyPluginsTests(unittest.TestCase):
    def test_validate_plugin_readme_contract_accepts_required_flow_with_allowed_tail(self):
        content = (
            "# Demo\n\n"
            "Intro.\n\n"
            "## What You Do in Carrd\nBody\n\n"
            "## How It Works in Carrd\nBody\n\n"
            "## How To Check That It Works\nBody\n\n"
            "## Configuration\nBody\n\n"
            "## Design\nBody\n\n"
            "## Advanced: Example\nBody\n\n"
            "## API\nBody\n"
        )

        m.validate_plugin_readme_contract(content, "demo")

    def test_validate_plugin_readme_contract_rejects_template_owned_installation(self):
        content = (
            "# Demo\n\n"
            "## Installation\nBody\n\n"
            "## What You Do in Carrd\nBody\n\n"
            "## How It Works in Carrd\nBody\n\n"
            "## How To Check That It Works\nBody\n\n"
            "## Configuration\nBody\n"
        )

        with self.assertRaisesRegex(ValueError, "must not define '## Installation'"):
            m.validate_plugin_readme_contract(content, "demo")

    def test_validate_plugin_readme_contract_rejects_wrong_required_order(self):
        content = (
            "# Demo\n\n"
            "## What You Do in Carrd\nBody\n\n"
            "## How To Check That It Works\nBody\n\n"
            "## How It Works in Carrd\nBody\n\n"
            "## Configuration\nBody\n"
        )

        with self.assertRaisesRegex(ValueError, "must keep required sections in this order"):
            m.validate_plugin_readme_contract(content, "demo")

    def test_validate_plugin_readme_contract_rejects_unknown_top_level_tail_sections(self):
        content = (
            "# Demo\n\n"
            "## What You Do in Carrd\nBody\n\n"
            "## How It Works in Carrd\nBody\n\n"
            "## How To Check That It Works\nBody\n\n"
            "## Configuration\nBody\n\n"
            "## Notes\nBody\n"
        )

        with self.assertRaisesRegex(ValueError, "unsupported top-level sections"):
            m.validate_plugin_readme_contract(content, "demo")

    def test_repo_source_readmes_follow_the_shared_contract(self):
        repo_root = Path(__file__).resolve().parent.parent
        for readme_path in sorted((repo_root / "src").glob("*/README.md")):
            with self.subTest(readme=readme_path.parent.name):
                m.validate_plugin_readme_contract(
                    readme_path.read_text(encoding="utf-8"),
                    readme_path.parent.name,
                )

    def test_minify_js_strips_comments_preserves_regex(self):
        src = "const r=/https?:\\/\\/example\\.com/; // comment"
        out = m.minify_js(src)
        self.assertIn("/https?:\\/\\/example\\.com/;", out)
        self.assertNotIn("// comment", out)

    def test_minify_js_preserves_return_regex_newline(self):
        src = "return\\n/a\\\\/b/;"
        out = m.minify_js(src)
        self.assertIn("return\\n/a\\\\/b/;", out)

    def test_minify_css_removes_comments(self):
        src = "/*comment*/ .a { color: red; }"
        out = m.minify_css(src)
        self.assertEqual(".a{color:red}", out)

    def test_minify_css_preserves_descendant_space_after_not_selector(self):
        src = (
            "@media (max-width: 736px) { "
            "#header:has(.site-header.header-collapsing:not(.is-header-nav-initialized)) "
            ".header-mobile-el-collapsing { display: none !important; } }"
        )
        out = m.minify_css(src)
        self.assertIn(
            "#header:has(.site-header.header-collapsing:not(.is-header-nav-initialized)) .header-mobile-el-collapsing",
            out,
        )

    def test_run_builds_dist_without_mutating_source(self):
        with TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            src_dir = repo_root / "src"
            plugin_dir = src_dir / "demo"
            dist_dir = repo_root / "dist"

            plugin_dir.mkdir(parents=True)
            (repo_root / "VERSION").write_text("1.2.3", encoding="utf-8")
            (repo_root / "README.md").write_text("# Demo Repo\n", encoding="utf-8")
            (repo_root / "CHANGELOG.md").write_text("## [Unreleased]\n", encoding="utf-8")
            source_js = (
                "/*\n"
                " * Plugin: Demo\n"
                " * Version: 0.0.0\n"
                " */\n"
                "window.demoPlugin = true;\n"
            )
            (plugin_dir / "demo.js").write_text(source_js, encoding="utf-8")
            (plugin_dir / "README.md").write_text(
                build_valid_plugin_readme("Demo"),
                encoding="utf-8",
            )

            m.run(src_dir, dist_dir, docs_only=False)

            self.assertEqual((plugin_dir / "demo.js").read_text(encoding="utf-8"), source_js)
            built_js = (dist_dir / "demo" / "demo.min.js").read_text(encoding="utf-8")
            self.assertEqual(built_js, "window.demoPlugin=true;")

    def test_minifiers_handle_large_input_without_regression(self):
        css_chunk = ".card { padding: 10px; margin: 0 auto; color: #123456; }\n"
        js_chunk = "const value = 1; // remove me\nconst label = 'demo';\n"
        large_css = "/* header */\n" + (css_chunk * 6000)
        large_js = "/* header */\n" + (js_chunk * 6000)

        minified_css = m.minify_css(large_css)
        minified_js = m.minify_js(large_js)

        self.assertTrue(len(minified_css) < len(large_css))
        self.assertTrue(len(minified_js) < len(large_js))
        self.assertNotIn("/* header */", minified_css)
        self.assertNotIn("// remove me", minified_js)

    def test_run_builds_many_plugins_in_one_pass(self):
        with TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            src_dir = repo_root / "src"
            dist_dir = repo_root / "dist"

            (repo_root / "VERSION").write_text("9.9.9", encoding="utf-8")
            (repo_root / "README.md").write_text("# Demo Repo\n", encoding="utf-8")
            (repo_root / "CHANGELOG.md").write_text("## [Unreleased]\n", encoding="utf-8")

            for index in range(12):
                plugin_dir = src_dir / f"plugin-{index}"
                plugin_dir.mkdir(parents=True, exist_ok=True)
                (plugin_dir / f"plugin-{index}.js").write_text(
                    "window.pluginIndex = " + str(index) + "; // comment\n",
                    encoding="utf-8",
                )
                (plugin_dir / f"plugin-{index}.css").write_text(
                    ".plugin { margin: 0 auto; color: #000; }\n",
                    encoding="utf-8",
                )
                (plugin_dir / "README.md").write_text(
                    build_valid_plugin_readme("Plugin"),
                    encoding="utf-8",
                )

            m.run(src_dir, dist_dir, docs_only=False)

            for index in range(12):
                self.assertTrue((dist_dir / f"plugin-{index}" / f"plugin-{index}.min.js").exists())
                self.assertTrue((dist_dir / f"plugin-{index}" / f"plugin-{index}.min.css").exists())


if __name__ == "__main__":
    unittest.main()
