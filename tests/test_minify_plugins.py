import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts import minify_plugins as m


def build_valid_plugin_readme(title: str) -> str:
    return (
        f"# {title}\n\n"
        "Short user-facing summary.\n\n"
        "## Carrd Setup\nBody\n\n"
        "## Configuration\nBody\n\n"
        "## Verify\nBody\n"
    )


class MinifyPluginsTests(unittest.TestCase):
    def test_validate_plugin_readme_contract_accepts_required_flow_with_allowed_tail(self):
        content = (
            "# Demo\n\n"
            "Intro.\n\n"
            "## Carrd Setup\nBody\n\n"
            "## Configuration\nBody\n\n"
            "## Verify\nBody\n\n"
            "## Design\nBody\n\n"
            "## Advanced: Example\nBody\n\n"
            "## API\nBody\n"
        )

        m.validate_plugin_readme_contract(content, "demo")

    def test_validate_plugin_readme_contract_rejects_template_owned_installation(self):
        content = (
            "# Demo\n\n"
            "Intro.\n\n"
            "## Install\nBody\n\n"
            "## Carrd Setup\nBody\n\n"
            "## Configuration\nBody\n\n"
            "## Verify\nBody\n"
        )

        with self.assertRaisesRegex(ValueError, "must not define install sections"):
            m.validate_plugin_readme_contract(content, "demo")

    def test_validate_plugin_readme_contract_rejects_wrong_required_order(self):
        content = (
            "# Demo\n\n"
            "Intro.\n\n"
            "## Configuration\nBody\n\n"
            "## Carrd Setup\nBody\n\n"
            "## Verify\nBody\n"
        )

        with self.assertRaisesRegex(ValueError, "must keep required sections in this order"):
            m.validate_plugin_readme_contract(content, "demo")

    def test_validate_plugin_readme_contract_rejects_unknown_top_level_tail_sections(self):
        content = (
            "# Demo\n\n"
            "Intro.\n\n"
            "## Carrd Setup\nBody\n\n"
            "## Configuration\nBody\n\n"
            "## Verify\nBody\n\n"
            "## Notes\nBody\n"
        )

        with self.assertRaisesRegex(ValueError, "unsupported top-level sections"):
            m.validate_plugin_readme_contract(content, "demo")

        with self.assertRaisesRegex(ValueError, "unsupported top-level sections"):
            m.validate_plugin_readme_contract(
                content.replace("## Notes", "## Design Notes"),
                "demo",
            )

    def test_validate_plugin_readme_contract_requires_one_summary_paragraph(self):
        content = build_valid_plugin_readme("Demo").replace(
            "Short user-facing summary.",
            "First paragraph.\n\nSecond paragraph.",
        )

        with self.assertRaisesRegex(ValueError, "one short summary paragraph"):
            m.validate_plugin_readme_contract(content, "demo")

    def test_build_plugin_installation_uses_bundle_config_as_source_of_truth(self):
        with TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            plugin_dir = repo_root / "src" / "demo"
            plugin_dir.mkdir(parents=True)
            (repo_root / "bundle.config.json").write_text(
                '{"cdn_bundle":{"enabled":true,"name":"theme-core","plugins":["demo"]}}',
                encoding="utf-8",
            )

            bundled = m.build_plugin_installation(repo_root, plugin_dir, True, True)
            self.assertIn("`theme-core` already includes this plugin", bundled)
            self.assertNotIn("Bundle Add-on", bundled)

            plugin_dir = repo_root / "src" / "add-on"
            plugin_dir.mkdir()
            add_on = m.build_plugin_installation(repo_root, plugin_dir, True, True)
            self.assertIn("Bundle Add-on", add_on)
            self.assertIn("`theme-core` does not include this plugin", add_on)

            (repo_root / "bundle.config.json").write_text(
                '{"cdn_bundle":{"enabled":false,"name":"theme-core","plugins":[]}}',
                encoding="utf-8",
            )
            no_bundle = m.build_plugin_installation(repo_root, plugin_dir, True, True)
            self.assertNotIn("CDN Bundle", no_bundle)
            self.assertNotIn("Bundle Add-on", no_bundle)
            self.assertIn("CDN Individual", no_bundle)

    def test_experimental_grid_cluster_install_is_inline_only(self):
        with TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            plugin_dir = repo_root / "src" / "grid-cluster-2"
            plugin_dir.mkdir(parents=True)
            (repo_root / "bundle.config.json").write_text(
                '{"cdn_bundle":{"enabled":true,"name":"theme-runtime","plugins":[]}}',
                encoding="utf-8",
            )

            install = m.build_plugin_installation(repo_root, plugin_dir, True, True)

            self.assertIn("Inline Embed (required for testing)", install)
            self.assertNotIn("CDN Individual", install)
            self.assertNotIn("Bundle Add-on", install)

    def test_inline_installation_uses_special_placement_and_split_files(self):
        no_load = m.build_inline_install_steps("no-loadwaiting", False, True)
        self.assertIn("Code → Hidden → Head", no_load)
        self.assertNotIn("Body End", no_load)

        slider = m.build_inline_install_steps("slider", True, True)
        self.assertIn("slider-embed-part1.html", slider)
        self.assertIn("slider-embed-part2.html", slider)
        self.assertIn("Code → Hidden → Body End", slider)

    def test_repo_source_readmes_follow_the_shared_contract(self):
        repo_root = Path(__file__).resolve().parent.parent
        for readme_path in sorted((repo_root / "src").glob("*/README.md")):
            with self.subTest(readme=readme_path.parent.name):
                m.validate_plugin_readme_contract(
                    readme_path.read_text(encoding="utf-8"),
                    readme_path.parent.name,
                )

    def test_repo_generated_readmes_match_bundle_contract(self):
        repo_root = Path(__file__).resolve().parent.parent
        bundle_plugins = set(
            m.load_bundle_config(repo_root).get("cdn_bundle", {}).get("plugins", [])
        )

        for source_readme in sorted((repo_root / "src").glob("*/README.md")):
            plugin_slug = source_readme.parent.name
            generated_readme = repo_root / "dist" / plugin_slug / "README.md"
            content = generated_readme.read_text(encoding="utf-8")
            with self.subTest(plugin=plugin_slug):
                self.assertNotIn("Build date", content)
                self.assertNotIn("[[", content)
                if plugin_slug in m.INLINE_ONLY_PLUGIN_SLUGS:
                    self.assertIn("inline-only", content)
                    self.assertIn("Inline Embed (required for testing)", content)
                    self.assertNotIn("Bundle Add-on", content)
                elif plugin_slug in bundle_plugins:
                    self.assertIn("already includes this plugin", content)
                    self.assertNotIn("Bundle Add-on", content)
                else:
                    self.assertIn("does not include this plugin", content)
                    self.assertIn("Bundle Add-on", content)

        no_load = (repo_root / "dist" / "no-loadwaiting" / "README.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("Paste the marked block into `Hidden → Head`", no_load)
        self.assertNotIn("Hidden → Body End", no_load)

        for plugin_slug in m.SPLIT_EMBED_PLUGINS:
            content = (repo_root / "dist" / plugin_slug / "README.md").read_text(
                encoding="utf-8"
            )
            self.assertIn(f"{plugin_slug}-embed-part1.html", content)
            self.assertIn(f"{plugin_slug}-embed-part2.html", content)

    def test_public_readmes_do_not_expose_local_filesystem_paths(self):
        repo_root = Path(__file__).resolve().parent.parent
        readme_paths = [
            repo_root / "README.md",
            repo_root / "dist" / "README.md",
            *sorted((repo_root / "src").glob("*/README.md")),
            *sorted((repo_root / "dist").glob("*/README.md")),
        ]

        forbidden_fragments = ("/Users/", "/Projects/carrd-v2")
        for readme_path in readme_paths:
            content = readme_path.read_text(encoding="utf-8")
            with self.subTest(readme=readme_path.relative_to(repo_root)):
                for fragment in forbidden_fragments:
                    self.assertNotIn(fragment, content)

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

    def test_minify_css_preserves_compound_selector_after_is(self):
        src = (
            '.theme-floating-cta:is([data-floating-position="top-left"], '
            '[data-floating-position="top-right"]).is-visible { transform: none; }'
        )
        out = m.minify_css(src)
        self.assertIn(
            '.theme-floating-cta:is([data-floating-position="top-left"],'
            '[data-floating-position="top-right"]).is-visible',
            out,
        )
        self.assertNotIn(") .is-visible", out)

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
            built_readme = (dist_dir / "demo" / "README.md").read_text(encoding="utf-8")
            self.assertNotIn("Build date", built_readme)
            self.assertNotIn("[[", built_readme)

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
                    build_valid_plugin_readme(f"Plugin {index}"),
                    encoding="utf-8",
                )

            m.run(src_dir, dist_dir, docs_only=False)

            for index in range(12):
                self.assertTrue((dist_dir / f"plugin-{index}" / f"plugin-{index}.min.js").exists())
                self.assertTrue((dist_dir / f"plugin-{index}" / f"plugin-{index}.min.css").exists())


if __name__ == "__main__":
    unittest.main()
