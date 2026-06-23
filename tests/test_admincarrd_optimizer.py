import json
import os
import subprocess
import tempfile
import textwrap
import unittest
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
HARNESS = ROOT / "tests" / "admincarrd_optimizer_harness.php"


def run_harness(command: str, payload: dict) -> dict:
    proc = subprocess.run(
        ["php", str(HARNESS), command],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(proc.stdout)


class AdminCarrdOptimizerTests(unittest.TestCase):
    def test_css_minifier_preserves_calc_spacing(self):
        css = "body { width: calc(100% - 20px); color: red; }\n/* comment */\n.box { margin: 0 auto; }"
        result = run_harness("minify-css", {"css": css})["result"]
        self.assertIn("calc(100% - 20px)", result)
        self.assertNotIn("/* comment */", result)
        self.assertIn(".box{margin:0 auto}", result)

    def test_js_minifier_skips_risky_regex_patterns(self):
        js = "const re = /foo\\/bar/i;\nconst x = 1; // trailing comment\n"
        output = run_harness("minify-js", {"js": js, "js_minify_mode": "conservative"})
        self.assertEqual(output["result"], js)
        self.assertTrue(output["warnings"])

    def test_js_minifier_minifies_safe_code(self):
        js = textwrap.dedent(
            """
            const a = 1; // remove me
            /*
              remove me too
            */
            const b = "ok";
            """
        ).strip() + "\n"
        output = run_harness("minify-js", {"js": js, "js_minify_mode": "conservative"})
        self.assertIn('const a = 1;', output["result"])
        self.assertIn('const b = "ok";', output["result"])
        self.assertFalse(output["warnings"])
        self.assertNotIn("remove me", output["result"])

    def test_mode_3_keeps_html_unchanged_but_minifies_css_js(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            project_root = tmp_path / "project"
            publish_target = project_root / "site"
            logs_dir = tmp_path / "logs"
            uploads_tmp = tmp_path / "tmp"
            source_dir = tmp_path / "fixture"
            assets_dir = source_dir / "assets"

            publish_target.mkdir(parents=True)
            logs_dir.mkdir(parents=True)
            uploads_tmp.mkdir(parents=True)
            assets_dir.mkdir(parents=True)

            html = textwrap.dedent(
                """
                <!doctype html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <title>Fixture</title>
                  </head>
                  <body>
                    <script>
                      const inlineValue = 1; // should stay because HTML minify is off
                    </script>
                  </body>
                </html>
                """
            ).lstrip()
            css = "body { color: red; }\n.box { margin: 0 auto; }\n"
            js = "const value = 1; // remove me\nconst another = 2;\n"

            (source_dir / "index.html").write_text(html, encoding="utf-8")
            (assets_dir / "main.css").write_text(css, encoding="utf-8")
            (assets_dir / "main.js").write_text(js, encoding="utf-8")

            zip_path = tmp_path / "fixture.zip"
            with zipfile.ZipFile(zip_path, "w") as zf:
                zf.write(source_dir / "index.html", "index.html")
                zf.write(assets_dir / "main.css", "assets/main.css")
                zf.write(assets_dir / "main.js", "assets/main.js")

            report = run_harness(
                "run",
                {
                    "zip_path": str(zip_path),
                    "project_root": str(project_root),
                    "logs_dir": str(logs_dir),
                    "tmp_dir": str(uploads_tmp),
                    "target_path": "/site/",
                    "transform_mode": 3,
                    "html_minify_enabled": False,
                    "js_minify_mode": "conservative",
                },
            )

            self.assertEqual(report["status"], "success")
            self.assertEqual(report["stages"]["minify_html"]["status"], "skipped")

            published_html = (publish_target / "index.html").read_text(encoding="utf-8")
            published_css = (publish_target / "assets" / "main.css").read_text(encoding="utf-8")
            published_js = (publish_target / "assets" / "main.js").read_text(encoding="utf-8")

            self.assertEqual(published_html, html)
            self.assertNotEqual(published_css, css)
            self.assertNotEqual(published_js, js)
            self.assertNotIn("// remove me", published_js)

    def test_mode_3_stress_large_css_js_payload(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            project_root = tmp_path / "project"
            publish_target = project_root / "site"
            logs_dir = tmp_path / "logs"
            uploads_tmp = tmp_path / "tmp"
            source_dir = tmp_path / "fixture"
            assets_dir = source_dir / "assets"

            publish_target.mkdir(parents=True)
            logs_dir.mkdir(parents=True)
            uploads_tmp.mkdir(parents=True)
            assets_dir.mkdir(parents=True)

            css_block = ".item { margin: 0 auto; padding: 10px; color: #333; }\n"
            js_block = "const v = 1; // strip\nconst text = 'ok';\n"
            css = "/* css head */\n" + (css_block * 3000)
            js = "/* js head */\n" + (js_block * 3000)
            html = "<!doctype html><html><head></head><body><h1>Load</h1></body></html>\n"

            (source_dir / "index.html").write_text(html, encoding="utf-8")
            (assets_dir / "main.css").write_text(css, encoding="utf-8")
            (assets_dir / "main.js").write_text(js, encoding="utf-8")

            zip_path = tmp_path / "fixture-large.zip"
            with zipfile.ZipFile(zip_path, "w") as zf:
                zf.write(source_dir / "index.html", "index.html")
                zf.write(assets_dir / "main.css", "assets/main.css")
                zf.write(assets_dir / "main.js", "assets/main.js")

            report = run_harness(
                "run",
                {
                    "zip_path": str(zip_path),
                    "project_root": str(project_root),
                    "logs_dir": str(logs_dir),
                    "tmp_dir": str(uploads_tmp),
                    "target_path": "/site/",
                    "transform_mode": 3,
                    "html_minify_enabled": False,
                    "js_minify_mode": "conservative",
                },
            )

            self.assertEqual(report["status"], "success")
            self.assertEqual(report["stages"]["minify_css_js"]["status"], "done")

            published_css = (publish_target / "assets" / "main.css").read_text(encoding="utf-8")
            published_js = (publish_target / "assets" / "main.js").read_text(encoding="utf-8")

            self.assertTrue(len(published_css) < len(css))
            self.assertTrue(len(published_js) < len(js))
            self.assertNotIn("/* css head */", published_css)
            self.assertNotIn("// strip", published_js)
            self.assertIn("warnings", report)


if __name__ == "__main__":
    unittest.main()
