import shutil
import tempfile
import subprocess
import unittest
import zipfile
from pathlib import Path

from scripts.admincarrd import build_installer_package as builder

ROOT = Path(__file__).resolve().parent.parent


class AdminCarrdInstallerPackageTests(unittest.TestCase):
    def test_build_creates_sanitized_package_and_installer(self):
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            installer_path, package_path = builder.build(output_dir)

            self.assertTrue(installer_path.is_file())
            self.assertTrue(package_path.is_file())

            with zipfile.ZipFile(package_path) as zf:
                names = set(zf.namelist())
                self.assertIn("admincarrd/index.php", names)
                self.assertIn("admincarrd/.user.ini", names)
                self.assertIn("admincarrd/app/config/config.php", names)
                self.assertIn("admincarrd/var/logs/.htaccess", names)
                self.assertIn("admincarrd/var/uploads/tmp/.htaccess", names)
                self.assertNotIn("admincarrd/var/logs/rate_limit.json", names)
                self.assertNotIn("admincarrd/var/logs/upload_rate_limit.json", names)
                self.assertNotIn("admincarrd/var/logs/sessions.json", names)
                self.assertNotIn("admincarrd/var/setup/setup-token.txt", names)

                config = zf.read("admincarrd/app/config/config.php").decode("utf-8")
                self.assertIn("'setup_complete' => false", config)
                self.assertIn("'password_hash' => ''", config)

    @unittest.skipUnless(shutil.which("php"), "php CLI not available")
    def test_installer_config_writer_preserves_bcrypt_dollar_signs(self):
        with tempfile.TemporaryDirectory() as tmp:
            script = Path(tmp) / "check.php"
            hash_value = "$2y$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOpqrstuv"
            script.write_text(
                "<?php\n"
                "$_SERVER['REQUEST_METHOD'] = 'GET';\n"
                "ob_start();\n"
                "require " + repr(str(ROOT / "scripts" / "admincarrd" / "install.php")) + ";\n"
                "ob_end_clean();\n"
                "$hash = " + repr(hash_value) + ";\n"
                "$config = \"<?php\\nreturn ['password_hash' => ''];\\n\";\n"
                "echo setConfigValue($config, 'password_hash', $hash);\n",
                encoding="utf-8",
            )
            proc = subprocess.run(["php", str(script)], text=True, capture_output=True, check=True)
            self.assertIn("'password_hash' => '" + hash_value + "'", proc.stdout)


if __name__ == "__main__":
    unittest.main()
