<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';
require ADMINCARRD_APP . '/lib/SetupToken.php';

use AdminCarrd\ConfigWriter;
use AdminCarrd\Csrf;
use AdminCarrd\SetupToken;

$ctx = adminCarrdBoot([
    'require_auth'    => true,
    'require_setup'   => true,
    'allow_pre_setup' => false,
]);
$config   = $ctx['config'];
$auth     = $ctx['auth'];
$adminUrl = $ctx['admin_url'];
$configFile = ADMINCARRD_APP . '/config/config.php';

if (!function_exists('adminCarrdResetDeleteTreeContents')) {
    function adminCarrdResetDeleteTreeContents(string $dir, array $preserveBasenames = []): void
    {
        if ($dir === '' || !is_dir($dir)) {
            return;
        }

        $items = @scandir($dir);
        if (!is_array($items)) {
            return;
        }

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            if (in_array($item, $preserveBasenames, true)) {
                continue;
            }

            $path = $dir . '/' . $item;
            if (is_dir($path) && !is_link($path)) {
                adminCarrdRmTree($path);
                continue;
            }
            @unlink($path);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $adminUrl . '/index.php');
    exit;
}

$token = isset($_POST['csrf_token']) ? (string) $_POST['csrf_token'] : '';
if (!Csrf::validate('reset_form', $token)) {
    $_SESSION['admincarrd_flash_error'] = 'Ошибка CSRF. Обновите страницу и повторите попытку.';
    header('Location: ' . $adminUrl . '/index.php');
    exit;
}

$postedFingerprint = isset($_POST['config_fingerprint']) ? (string) $_POST['config_fingerprint'] : '';

$logsDir = rtrim((string) ($config['logs_dir'] ?? (ADMINCARRD_ROOT . '/var/logs')), '/\\');
$tmpDir = rtrim((string) ($config['tmp_dir'] ?? (ADMINCARRD_ROOT . '/var/uploads/tmp')), '/\\');
$originalBackupsDir = rtrim((string) ($config['optimizer']['original_images_backup_dir'] ?? (ADMINCARRD_ROOT . '/var/uploads/original-backups')), '/\\');
$publishBackupsDir = rtrim((string) ($config['publish']['publish_backup_dir'] ?? (ADMINCARRD_ROOT . '/var/uploads/publish-backups')), '/\\');
$sessionRegistryFile = $auth->getSessionRegistryFilePath();

// Сбрасываем пароль, setup_complete, allowed_targets через атомарный writer
try {
    ConfigWriter::updateIfUnchanged($configFile, $postedFingerprint, static function (string $content): string {
        $content = ConfigWriter::replaceBoolValue($content, 'setup_complete', false);
        $content = ConfigWriter::replaceStringValue($content, 'password_hash', '');
        $content = ConfigWriter::replaceStringArrayValue($content, 'allowed_targets', []);
        return $content;
    });
} catch (\Throwable $e) {
    $_SESSION['admincarrd_flash_error'] = 'Сброс остановлен: ' . $e->getMessage();
    header('Location: ' . $adminUrl . '/config-ui.php');
    exit;
}

// Удаляем setup-token.txt — для нового запуска создастся свежий
SetupToken::consume();

// Полностью удаляем производные runtime-файлы и артефакты.
adminCarrdResetDeleteTreeContents($logsDir, ['.htaccess']);
adminCarrdResetDeleteTreeContents($tmpDir, ['.htaccess']);
adminCarrdResetDeleteTreeContents($originalBackupsDir, ['.htaccess']);
adminCarrdResetDeleteTreeContents($publishBackupsDir, ['.htaccess']);

// Уничтожаем текущую сессию
$auth->logout();

// Удаляем только сессии AdminCarrd, известные локальному registry.
$sessionPath = session_save_path() ?: sys_get_temp_dir();
$sessionRegistryRaw = @file_get_contents($sessionRegistryFile);
$sessionRegistry = is_string($sessionRegistryRaw) ? json_decode($sessionRegistryRaw, true) : [];
if (is_array($sessionRegistry)) {
    foreach (array_keys($sessionRegistry) as $sid) {
        $sid = (string) $sid;
        if ($sid === '' || preg_match('/^[a-zA-Z0-9,-]+$/', $sid) !== 1) {
            continue;
        }
        $sessFile = rtrim($sessionPath, '/') . '/sess_' . $sid;
        @unlink($sessFile);
    }
}
@unlink($sessionRegistryFile);

header('Location: ' . $adminUrl . '/setup.php?reset=1');
exit;
