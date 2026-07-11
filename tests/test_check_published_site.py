import unittest

from scripts.check_published_site import check_html


class PublishedSiteCheckTests(unittest.TestCase):
    def test_accepts_single_immutable_release_ref(self):
        html = '<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@2.1.0/dist/no-loadwaiting/no-loadwaiting.min.js"></script>'
        self.assertEqual(check_html(html, "2.1.0"), [])

    def test_rejects_commit_ref_even_when_it_is_a_real_git_ref(self):
        html = '<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@b910f70/dist/no-loadwaiting/no-loadwaiting.min.js"></script>'
        errors = check_html(html, "2.1.0")
        self.assertTrue(any("non-SemVer" in error for error in errors))
        self.assertTrue(any("expected only @2.1.0" in error for error in errors))

    def test_rejects_development_markers(self):
        html = '<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-runtime.min.js?rev=20260711-01"></script>'
        errors = check_html(html, "2.1.0")
        self.assertTrue(any("@main" in error for error in errors))
        self.assertTrue(any("?rev=" in error for error in errors))
