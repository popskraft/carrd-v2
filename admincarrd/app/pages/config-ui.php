<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';
require ADMINCARRD_APP . '/lib/Optimizer.php';

use AdminCarrd\ConfigWriter;
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
$cspNonce = adminCarrdCspNonce();

$logsDir = rtrim((string) ($config['logs_dir'] ?? (ADMINCARRD_ROOT . '/var/logs')), '/\\');
$configFile = ADMINCARRD_APP . '/config/config.php';
$configFingerprint = adminCarrdConfigFingerprint($configFile);

function e(string $value): string
{
    return adminCarrdEscape($value);
}

function fmtBytes(int $bytes): string
{
    if ($bytes < 1024) return $bytes . ' B';
    if ($bytes < 1048576) return number_format($bytes / 1024, 1) . ' KB';
    return number_format($bytes / 1048576, 2) . ' MB';
}

$flashSuccess = (string) ($_SESSION['admincarrd_flash_success'] ?? '');
$flashError   = (string) ($_SESSION['admincarrd_flash_error']   ?? '');
unset($_SESSION['admincarrd_flash_success'], $_SESSION['admincarrd_flash_error']);

// Обработка POST-действий
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    $token  = (string) ($_POST['csrf_token'] ?? '');

    if (!Csrf::validate('config_form', $token)) {
        $_SESSION['admincarrd_flash_error'] = 'Ошибка CSRF. Обновите страницу.';
        header('Location: ' . $adminUrl . '/config-ui.php');
        exit;
    }

    if ($action === 'save_targets') {
        $postedFingerprint = (string) ($_POST['config_fingerprint'] ?? '');
        $raw = (string) ($_POST['allowed_targets'] ?? '');
        // Защита от ReDoS: ограничиваем размер ввода 16 KB до сплита.
        if (strlen($raw) > 16384) {
            $_SESSION['admincarrd_flash_error'] = 'Слишком большой ввод (максимум 16 KB).';
            header('Location: ' . $adminUrl . '/config-ui.php');
            exit;
        }

        $lines = preg_split('/\r\n|\r|\n/', $raw) ?: [];
        $normalized = [];
        $invalid = [];
        $missingDirs = [];
        $maxItems = 100;

        $projectRoot = rtrim((string) ($config['project_root'] ?? dirname(__DIR__)), '/\\');

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            if (count($normalized) >= $maxItems) {
                $invalid[] = $line . ' (превышен лимит ' . $maxItems . ' записей)';
                continue;
            }
            $norm = Optimizer::normalizePublishPath($line);
            if ($norm === '') {
                $invalid[] = $line;
                continue;
            }
            if (in_array($norm, $normalized, true)) {
                continue;
            }
            // Валидация существования директории (мягкое предупреждение, не блокирует сохранение).
            if ($norm !== '/') {
                $abs = $projectRoot . rtrim($norm, '/');
                if (!is_dir($abs)) {
                    $missingDirs[] = $norm;
                }
            }
            $normalized[] = $norm;
        }

        $messages = [];
        if (!empty($invalid)) {
            $messages[] = 'Отброшены: ' . implode(', ', $invalid);
        }
        if (!empty($missingDirs)) {
            $messages[] = 'Внимание — несуществующие папки сохранены: ' . implode(', ', $missingDirs);
        }

        try {
            ConfigWriter::updateIfUnchanged($configFile, $postedFingerprint, static function (string $content) use ($normalized): string {
                return ConfigWriter::replaceStringArrayValue($content, 'allowed_targets', $normalized);
            });
            $msg = empty($normalized)
                ? 'Allowed Targets очищены — включён автоскан.'
                : 'Сохранено путей: ' . count($normalized) . '.';
            if (!empty($messages)) {
                $_SESSION['admincarrd_flash_error'] = implode('; ', $messages);
            }
            $_SESSION['admincarrd_flash_success'] = $msg;
        } catch (\Throwable $e) {
            $_SESSION['admincarrd_flash_error'] = 'Не удалось обновить config.php: ' . $e->getMessage();
        }

        header('Location: ' . $adminUrl . '/config-ui.php');
        exit;
    }

    if ($action === 'clear_logs') {
        $deleted = 0;
        foreach (glob($logsDir . '/*.log') ?: [] as $f) {
            if (@unlink($f)) {
                $deleted++;
            }
        }
        $_SESSION['admincarrd_flash_success'] = 'Удалено лог-файлов: ' . $deleted . '.';
        header('Location: ' . $adminUrl . '/config-ui.php');
        exit;
    }

    if ($action === 'clear_one_log') {
        $name = basename((string) ($_POST['filename'] ?? ''));
        $path = $logsDir . '/' . $name;
        if ($name !== '' && substr($name, -4) === '.log' && is_file($path)) {
            @unlink($path);
            $_SESSION['admincarrd_flash_success'] = 'Файл удалён: ' . $name;
        } else {
            $_SESSION['admincarrd_flash_error'] = 'Файл не найден или недопустим.';
        }
        header('Location: ' . $adminUrl . '/config-ui.php');
        exit;
    }

    header('Location: ' . $adminUrl . '/config-ui.php');
    exit;
}

// GET: download / view
if (isset($_GET['download'])) {
    $name = basename((string) $_GET['download']);
    $path = $logsDir . '/' . $name;
    if ($name !== '' && substr($name, -4) === '.log' && is_file($path)) {
        header('Content-Type: text/plain; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $name . '"');
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;
    }
    $_SESSION['admincarrd_flash_error'] = 'Файл не найден.';
    header('Location: ' . $adminUrl . '/config-ui.php');
    exit;
}

$viewContent = null;
$viewName    = null;
if (isset($_GET['view'])) {
    $name = basename((string) $_GET['view']);
    $path = $logsDir . '/' . $name;
    if ($name !== '' && substr($name, -4) === '.log' && is_file($path)) {
        $viewName    = $name;
        $viewContent = file_get_contents($path);
        if ($viewContent === false) {
            $viewContent = '(не удалось прочитать файл)';
        }
    }
}

// Подготовка данных
$logFiles = [];
foreach (glob($logsDir . '/*.log') ?: [] as $f) {
    $logFiles[] = [
        'name'  => basename($f),
        'size'  => (int) filesize($f),
        'mtime' => (int) filemtime($f),
    ];
}
usort($logFiles, static fn($a, $b) => $b['mtime'] - $a['mtime']);

$allowedTargets = (array) ($config['publish']['allowed_targets'] ?? []);
$allowedTargetsText = implode("\n", $allowedTargets);
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AdminCarrd: Config</title>
    <link rel="stylesheet" href="assets/style.css?v=2">
    <style>
        .section { margin-top:24px; padding-top:20px; border-top:1px solid var(--line); }
        .section:first-of-type { border-top:none; padding-top:0; margin-top:0; }
        .section h2 { margin:0 0 6px; font-size:1.15rem; }
        .section .desc { color:var(--muted); font-size:0.92rem; margin:0 0 14px; }
        .log-table { width:100%; border-collapse:collapse; margin-top:8px; font-size:0.92rem; }
        .log-table th, .log-table td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); }
        .log-table th { font-weight:600; color:var(--muted); background:#f8faff; }
        .log-table tr:last-child td { border-bottom:none; }
        .log-table .actions { display:flex; gap:6px; flex-wrap:wrap; }
        .btn-sm { min-height:32px; padding:4px 10px; font-size:0.86rem; border-radius:8px; }
        .btn-danger { color:var(--danger); border-color:#fecaca; background:#fff; }
        .btn-danger:hover { background:#fef2f2; }
        textarea {
            width:100%; min-height:130px; padding:10px 12px;
            border:1px solid var(--line); border-radius:10px;
            font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size:0.92rem;
            resize:vertical;
        }
        .log-viewer pre {
            background:#0f172a; color:#e2e8f0; border-radius:10px; padding:16px;
            font-size:0.82rem; line-height:1.6; overflow-x:auto;
            white-space:pre-wrap; word-break:break-all;
            max-height:500px; overflow-y:auto;
        }
        .empty { color:var(--muted); padding:14px 0; }
        .danger-zone {
            border:1px solid #fecaca; background:#fef9f9; border-radius:10px;
            padding:14px;
        }
    </style>
</head>
<body>
<div class="wrap">
    <div class="card">
        <div class="toolbar">
            <div>
                <h1>Config</h1>
                <p>Настройки и обслуживание AdminCarrd.</p>
            </div>
            <div style="display:flex;gap:8px;">
                <a class="btn btn-ghost" href="index.php">← На главную</a>
                <a class="btn btn-ghost" href="change-password.php">Сменить пароль</a>
                <a class="btn btn-ghost" href="logout.php">Выйти</a>
            </div>
        </div>

        <?php if ($flashError !== ''): ?>
            <div class="msg msg-error"><?= e($flashError) ?></div>
        <?php endif; ?>
        <?php if ($flashSuccess !== ''): ?>
            <div class="msg msg-ok"><?= e($flashSuccess) ?></div>
        <?php endif; ?>

        <!-- Секция: Allowed Targets -->
        <div class="section">
            <h2>Папки для публикации</h2>
            <p class="desc">
                Укажите пути для публикации (по одному на строку, например <code>/carrd/</code>).
                Если список пуст — используется автоматический скан корня проекта.
            </p>
            <form method="post">
                <?= Csrf::field('config_form') ?>
                <input type="hidden" name="action" value="save_targets">
                <input type="hidden" name="config_fingerprint" value="<?= e($configFingerprint) ?>">
                <textarea name="allowed_targets" placeholder="/carrd/&#10;/another-folder/"><?= e($allowedTargetsText) ?></textarea>
                <div style="margin-top:10px;display:flex;justify-content:flex-end;">
                    <button type="submit">Сохранить</button>
                </div>
            </form>
        </div>

        <!-- Секция: Логи -->
        <div class="section">
            <h2>Логи</h2>
            <p class="desc">Файлы журнала операций. Просмотр, скачивание, удаление.</p>

            <?php if (empty($logFiles)): ?>
                <div class="empty">Лог-файлы не найдены.</div>
            <?php else: ?>
                <div style="display:flex;justify-content:flex-end;">
                    <form method="post">
                        <?= Csrf::field('config_form') ?>
                        <input type="hidden" name="action" value="clear_logs">
                        <button type="submit" class="btn btn-sm btn-danger"
                            data-confirm="Удалить все лог-файлы?">
                            Очистить все логи
                        </button>
                    </form>
                </div>
                <table class="log-table">
                    <thead>
                        <tr>
                            <th>Файл</th>
                            <th>Размер</th>
                            <th>Дата</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($logFiles as $lf): ?>
                            <tr>
                                <td><code><?= e($lf['name']) ?></code></td>
                                <td><?= e(fmtBytes($lf['size'])) ?></td>
                                <td><?= e(date('d.m.Y H:i', $lf['mtime'])) ?></td>
                                <td>
                                    <div class="actions">
                                        <a class="btn btn-ghost btn-sm" href="?view=<?= urlencode($lf['name']) ?>">Просмотр</a>
                                        <a class="btn btn-ghost btn-sm" href="?download=<?= urlencode($lf['name']) ?>">Скачать</a>
                                        <form method="post" style="display:inline;">
                                            <?= Csrf::field('config_form') ?>
                                            <input type="hidden" name="action" value="clear_one_log">
                                            <input type="hidden" name="filename" value="<?= e($lf['name']) ?>">
                                            <button type="submit" class="btn btn-sm btn-danger"
                                                data-confirm="Удалить <?= e($lf['name']) ?>?">
                                                Удалить
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>

            <?php if ($viewContent !== null): ?>
                <div class="log-viewer" style="margin-top:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <b><?= e($viewName ?? '') ?></b>
                        <a class="btn btn-ghost btn-sm" href="config-ui.php">Закрыть</a>
                    </div>
                    <pre><?= e($viewContent) ?></pre>
                </div>
            <?php endif; ?>
        </div>

        <!-- Секция: Сброс -->
        <div class="section">
            <h2>Опасная зона</h2>
            <p class="desc">Полный сброс системы. Будут удалены: пароль, allowed targets, все логи, rate-limit, все сессии.</p>
            <div class="danger-zone">
                <form method="post" action="reset.php">
                    <?= Csrf::field('reset_form') ?>
                    <input type="hidden" name="config_fingerprint" value="<?= e($configFingerprint) ?>">
                    <button type="submit" class="btn btn-danger"
                        data-confirm="Сбросить ВСЕ состояния? Будут удалены: пароль, allowed_targets, все логи, rate-limit, все сессии. Вы будете перенаправлены на страницу первого запуска.">
                        Сбросить все состояния
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
<script nonce="<?= e($cspNonce) ?>">
document.querySelectorAll('[data-confirm]').forEach(function (element) {
    element.addEventListener('click', function (event) {
        var message = element.getAttribute('data-confirm') || 'Подтвердить действие?';
        if (!window.confirm(message)) {
            event.preventDefault();
        }
    });
});
</script>
</body>
</html>
