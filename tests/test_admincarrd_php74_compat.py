import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
TARGETS = [
    ROOT / "admincarrd" / "index.php",
    ROOT / "admincarrd" / "router.php",
]
TARGETS.extend((ROOT / "admincarrd" / "app").rglob("*.php"))


class AdminCarrdPhp74CompatTests(unittest.TestCase):
    def test_no_php8_string_helpers_in_runtime(self):
        forbidden = [
            "str_contains(",
            "str_starts_with(",
            "str_ends_with(",
        ]
        violations = []

        for path in TARGETS:
            content = path.read_text(encoding="utf-8")
            for token in forbidden:
                if token in content:
                    violations.append(f"{path.relative_to(ROOT)} -> {token}")

        self.assertFalse(
            violations,
            "PHP 7.4 compatibility violation(s):\n" + "\n".join(violations),
        )

    def test_no_php8_match_expression_in_runtime(self):
        pattern = re.compile(r"(?<![A-Za-z0-9_])match\s*\(")
        violations = []

        for path in TARGETS:
            content = path.read_text(encoding="utf-8")
            if pattern.search(content):
                violations.append(str(path.relative_to(ROOT)))

        self.assertFalse(
            violations,
            "PHP 7.4 compatibility violation(s), match() expression found in:\n"
            + "\n".join(violations),
        )


if __name__ == "__main__":
    unittest.main()
