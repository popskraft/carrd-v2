<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';
require ADMINCARRD_APP . '/lib/Optimizer.php';

use AdminCarrd\Auth;
use AdminCarrd\Csrf;
use AdminCarrd\Optimizer;

$ctx = adminCarrdBoot([
    'require_auth'    => true,
    'require_setup'   => true,
    'allow_pre_setup' => false,
]);
$config   = $ctx['config'];
$auth     = $ctx['auth'];
$adminUrl = $ctx['admin_url'];

if ($auth->isDefaultPasswordHash()) {
    $_SESSION['admincarrd_flash_error'] = 'Доступ заблокирован: в config.php установлен пароль по умолчанию.';
    $auth->logout();
    header('Location: ' . $adminUrl . '/login.php');
    exit;
}

$redirect = static function () use ($adminUrl) {
    header('Location: ' . $adminUrl . '/index.php');
    exit;
};

$detectMimeType = static function (string $path): string {
    if ($path === '' || !is_file($path)) {
        return '';
    }

    if (function_exists('finfo_open') && defined('FILEINFO_MIME_TYPE')) {
        $finfo = @finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $mime = @finfo_file($finfo, $path);
            @finfo_close($finfo);
            if (is_string($mime) && $mime !== '') {
                return strtolower(trim($mime));
            }
        }
    }

    if (function_exists('mime_content_type')) {
        $mime = @mime_content_type($path);
        if (is_string($mime) && $mime !== '') {
            return strtolower(trim($mime));
        }
    }

    return '';
};

$checkUploadRateLimit = static function (array $config, Auth $auth) {
    $cfg = (array) ($config['security']['upload_rate_limit'] ?? []);
    $windowSec = max(60, (int) ($cfg['window_sec'] ?? 3600));
    $maxAttempts = max(1, (int) ($cfg['max_attempts'] ?? 10));
    $minIntervalSec = max(1, (int) ($cfg['min_interval_sec'] ?? 30));

    $ip = $auth->getClientIp();
    $sid = session_id();
    $key = hash('sha256', $ip . '|' . $sid);

    $logsDir = rtrim((string) ($config['logs_dir'] ?? (ADMINCARRD_ROOT . '/var/logs')), '/\\');
    if (!is_dir($logsDir) && !@mkdir($logsDir, 0755, true) && !is_dir($logsDir)) {
        return null;
    }

    $file = $logsDir . '/upload_rate_limit.json';
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        return null;
    }

    $now = time();
    $error = null;

    try {
        if (!flock($handle, LOCK_EX)) {
            fclose($handle);
            return null;
        }

        rewind($handle);
        $raw = stream_get_contents($handle);
        $data = [];
        if (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }

        $entry = $data[$key] ?? ['attempts' => [], 'last_ts' => 0];
        $attempts = array_values(array_filter((array) ($entry['attempts'] ?? []), static function ($ts) use ($now, $windowSec) {
            return is_int($ts) && ($now - $ts) <= $windowSec;
        }));
        $lastTs = (int) ($entry['last_ts'] ?? 0);

        if ($lastTs > 0 && ($now - $lastTs) < $minIntervalSec) {
            $retry = $minIntervalSec - ($now - $lastTs);
            $error = 'Слишком частые загрузки. Подождите ' . $retry . ' сек.';
        } elseif (count($attempts) >= $maxAttempts) {
            $oldest = (int) ($attempts[0] ?? $now);
            $retry = max(1, $windowSec - ($now - $oldest));
            $error = 'Превышен лимит загрузок. Повторите через ' . $retry . ' сек.';
        } else {
            $attempts[] = $now;
            $data[$key] = [
                'attempts' => $attempts,
                'last_ts' => $now,
            ];
        }

        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
    } catch (\Throwable $e) {
        flock($handle, LOCK_UN);
        fclose($handle);
        throw $e;
    }

    return $error;
};

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $_SESSION['admincarrd_flash_error'] = 'Некорректный метод запроса.';
    $redirect();
}

$token = isset($_POST['csrf_token']) ? (string) $_POST['csrf_token'] : '';
if (!Csrf::validate('upload_form', $token)) {
    $_SESSION['admincarrd_flash_error'] = 'Ошибка CSRF. Обновите страницу и попробуйте снова.';
    $redirect();
}

$uploadLimitError = $checkUploadRateLimit($config, $auth);
if ($uploadLimitError !== null) {
    $_SESSION['admincarrd_flash_error'] = $uploadLimitError;
    $redirect();
}

$targetPath = isset($_POST['target_path']) ? (string) $_POST['target_path'] : '';
$targetPath = Optimizer::normalizePublishPath($targetPath);
$transformMode = isset($_POST['transform_mode']) ? (int) $_POST['transform_mode'] : 0;
if (!in_array($transformMode, [1, 2, 3], true)) {
    $_SESSION['admincarrd_flash_error'] = 'Выберите корректный режим обработки.';
    $redirect();
}
$_SESSION['admincarrd_form_data'] = [
    'target_path' => $targetPath,
    'transform_mode' => $transformMode,
];

$allowedTargets = Optimizer::getPublishTargets($config);
if ($targetPath === '' || !isset($allowedTargets[$targetPath])) {
    $_SESSION['admincarrd_flash_error'] = 'Выбранный путь публикации не разрешён.';
    $redirect();
}

if (!isset($_FILES['archive']) || !is_array($_FILES['archive'])) {
    $_SESSION['admincarrd_flash_error'] = 'Файл архива не получен.';
    $redirect();
}

$file = $_FILES['archive'];
$errorCode = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
if ($errorCode !== UPLOAD_ERR_OK) {
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'Файл превышает лимит upload_max_filesize.',
        UPLOAD_ERR_FORM_SIZE => 'Файл превышает лимит формы.',
        UPLOAD_ERR_PARTIAL => 'Файл загружен частично.',
        UPLOAD_ERR_NO_FILE => 'Файл не выбран.',
        UPLOAD_ERR_NO_TMP_DIR => 'Временный каталог сервера недоступен.',
        UPLOAD_ERR_CANT_WRITE => 'Ошибка записи файла на диск.',
        UPLOAD_ERR_EXTENSION => 'Загрузка остановлена расширением PHP.',
    ];

    $_SESSION['admincarrd_flash_error'] = $messages[$errorCode] ?? 'Неизвестная ошибка загрузки файла.';
    $redirect();
}

$tmpName = (string) ($file['tmp_name'] ?? '');
$origName = (string) ($file['name'] ?? 'archive.zip');
$size = (int) ($file['size'] ?? 0);

if (!is_uploaded_file($tmpName)) {
    $_SESSION['admincarrd_flash_error'] = 'Некорректный источник загруженного файла.';
    $redirect();
}

$maxBytes = (int) ($config['upload']['max_bytes'] ?? (100 * 1024 * 1024));
if ($size <= 0 || $size > $maxBytes) {
    $_SESSION['admincarrd_flash_error'] = 'Размер архива должен быть от 1 байта до ' . (int) floor($maxBytes / (1024 * 1024)) . ' MB.';
    $redirect();
}

$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
$allowedExt = array_map('strtolower', (array) ($config['upload']['allowed_extensions'] ?? ['zip']));
if (!in_array($ext, $allowedExt, true)) {
    $_SESSION['admincarrd_flash_error'] = 'Разрешены только ZIP-архивы.';
    $redirect();
}

$mime = $detectMimeType($tmpName);

$allowedMime = (array) ($config['upload']['allowed_mime_types'] ?? []);
if ($mime !== '' && !in_array($mime, $allowedMime, true)) {
    $_SESSION['admincarrd_flash_error'] = 'Недопустимый MIME-тип: ' . $mime;
    $redirect();
}

$header = @file_get_contents($tmpName, false, null, 0, 4);
if (!is_string($header) || substr($header, 0, 2) !== "PK") {
    $_SESSION['admincarrd_flash_error'] = 'Файл не похож на корректный ZIP-архив.';
    $redirect();
}

$tmpDir = rtrim((string) ($config['tmp_dir'] ?? (ADMINCARRD_ROOT . '/var/uploads/tmp')), '/\\');
if (!is_dir($tmpDir) && !@mkdir($tmpDir, 0755, true) && !is_dir($tmpDir)) {
    $_SESSION['admincarrd_flash_error'] = 'Не удалось создать временный каталог загрузки.';
    $redirect();
}

$jobFile = $tmpDir . '/upload_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.zip';
if (!move_uploaded_file($tmpName, $jobFile)) {
    $_SESSION['admincarrd_flash_error'] = 'Не удалось переместить загруженный архив во временный каталог.';
    $redirect();
}

$optimizer = new Optimizer($config);
$report = $optimizer->run($jobFile, $targetPath, [
    'transform_mode' => $transformMode,
]);

$_SESSION['admincarrd_report'] = $report;
if (($report['status'] ?? 'error') !== 'success') {
    $_SESSION['admincarrd_flash_error'] = 'Задача завершилась с ошибкой. Смотрите детали ниже.';
}

$redirect();
