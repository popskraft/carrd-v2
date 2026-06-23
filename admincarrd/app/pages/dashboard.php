<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';
require ADMINCARRD_APP . '/lib/Optimizer.php';

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

if ($auth->isDefaultPasswordHash()) {
    $_SESSION['admincarrd_flash_error'] = 'Доступ заблокирован: в config.php установлен пароль по умолчанию.';
    $auth->logout();
    header('Location: ' . $adminUrl . '/login.php');
    exit;
}

$targets = Optimizer::getPublishTargets($config);
$selectedTarget = (string) ($_SESSION['admincarrd_form_data']['target_path'] ?? '');
$defaultTransformMode = (int) ($config['optimizer']['transform_mode_default'] ?? 0);
if (!in_array($defaultTransformMode, [1, 2, 3], true)) {
    $defaultTransformMode = (bool) ($config['optimizer']['minify_enabled_default'] ?? true) ? 3 : 2;
}
$selectedTransformMode = isset($_SESSION['admincarrd_form_data']['transform_mode'])
    ? (int) $_SESSION['admincarrd_form_data']['transform_mode']
    : $defaultTransformMode;
if (!in_array($selectedTransformMode, [1, 2, 3], true)) {
    $selectedTransformMode = $defaultTransformMode;
}

$flashError = (string) ($_SESSION['admincarrd_flash_error'] ?? '');
$report = $_SESSION['admincarrd_report'] ?? null;

unset($_SESSION['admincarrd_flash_error'], $_SESSION['admincarrd_report'], $_SESSION['admincarrd_form_data']);

function e(string $value): string
{
    return adminCarrdEscape($value);
}

function fmtBytes(int $bytes): string
{
    $units = ['B', 'KB', 'MB', 'GB'];
    $size = (float) max(0, $bytes);
    $i = 0;
    while ($size >= 1024 && $i < count($units) - 1) {
        $size /= 1024;
        $i++;
    }
    return number_format($size, $i === 0 ? 0 : 2, '.', ' ') . ' ' . $units[$i];
}
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AdminCarrd: загрузка архива</title>
    <link rel="stylesheet" href="assets/style.css?v=1">
</head>
<body>
<div class="wrap">
    <div class="card">
        <div class="toolbar">
            <div>
                <h1>AdminCarrd</h1>
                <p>Загрузка ZIP, оптимизация и публикация шаблона.</p>
            </div>
            <div style="display:flex;gap:8px;">
                <a class="btn btn-ghost" href="config-ui.php">Config</a>
                <a class="btn btn-ghost" href="logout.php">Выйти</a>
            </div>
        </div>

        <?php if ($flashError !== ''): ?>
            <div class="msg msg-error"><?= e($flashError) ?></div>
        <?php endif; ?>

        <?php if (is_array($report)): ?>
            <?php $status = (string) ($report['status'] ?? 'error'); ?>
            <div class="msg <?= $status === 'success' ? 'msg-ok' : 'msg-error' ?>">
                <?= $status === 'success' ? 'Обработка завершена успешно.' : 'Обработка завершена с ошибкой.' ?>
            </div>

            <div class="meta">
                <div class="stat"><b>Путь публикации</b><span><?= e((string) ($report['target_path'] ?? '-')) ?></span></div>
                <div class="stat"><b>Длительность</b><span><?= e((string) ($report['duration_sec'] ?? 0)) ?> сек</span></div>
                <div class="stat"><b>Конвертировано в WebP</b><span><?= e((string) ($report['images_converted'] ?? 0)) ?></span></div>
                <div class="stat"><b>Ссылок обновлено</b><span><?= e((string) ($report['references_updated'] ?? 0)) ?></span></div>
            </div>

            <?php if (!empty($report['files']) && is_array($report['files'])): ?>
                <div class="meta">
                    <div class="stat">
                        <b>CSS</b>
                        <span><?= fmtBytes((int) ($report['files']['css']['before'] ?? 0)) ?> → <?= fmtBytes((int) ($report['files']['css']['after'] ?? 0)) ?></span>
                    </div>
                    <div class="stat">
                        <b>JS</b>
                        <span><?= fmtBytes((int) ($report['files']['js']['before'] ?? 0)) ?> → <?= fmtBytes((int) ($report['files']['js']['after'] ?? 0)) ?></span>
                    </div>
                    <div class="stat">
                        <b>HTML</b>
                        <span><?= fmtBytes((int) ($report['files']['html']['before'] ?? 0)) ?> → <?= fmtBytes((int) ($report['files']['html']['after'] ?? 0)) ?></span>
                    </div>
                    <div class="stat">
                        <b>Публикация</b>
                        <span><?= e((string) ($report['published_url'] ?? '-')) ?></span>
                    </div>
                    <div class="stat">
                        <b>Режим обработки</b>
                        <span><?= e((string) ($report['transform_mode_label'] ?? 'не указан')) ?></span>
                    </div>
                    <div class="stat">
                        <b>Request ID</b>
                        <span><code><?= e((string) ($report['request_id'] ?? '-')) ?></code></span>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($report['timings_sec']) && is_array($report['timings_sec'])): ?>
                <div class="meta">
                    <div class="stat"><b>Распаковка ZIP</b><span><?= e((string) ($report['timings_sec']['extract_zip'] ?? 0)) ?> сек</span></div>
                    <div class="stat"><b>Подготовка build</b><span><?= e((string) ($report['timings_sec']['prepare_build'] ?? 0)) ?> сек</span></div>
                    <div class="stat"><b>Минификация CSS/JS</b><span><?= e((string) ($report['timings_sec']['minify_css_js'] ?? 0)) ?> сек</span></div>
                    <div class="stat"><b>Конвертация WebP</b><span><?= e((string) ($report['timings_sec']['convert_images'] ?? 0)) ?> сек</span></div>
                    <div class="stat"><b>Замена ссылок</b><span><?= e((string) ($report['timings_sec']['replace_references'] ?? 0)) ?> сек</span></div>
                    <div class="stat"><b>Минификация HTML</b><span><?= e((string) ($report['timings_sec']['minify_html'] ?? 0)) ?> сек</span></div>
                    <div class="stat"><b>Публикация</b><span><?= e((string) ($report['timings_sec']['publish'] ?? 0)) ?> сек</span></div>
                </div>
            <?php endif; ?>

            <?php if (!empty($report['warnings']) && is_array($report['warnings'])): ?>
                <div class="msg msg-warn">
                    Предупреждения:
                    <ul class="list">
                        <?php foreach ($report['warnings'] as $warn): ?>
                            <li><?= e((string) $warn) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <?php if (!empty($report['errors']) && is_array($report['errors'])): ?>
                <div class="msg msg-error">
                    Ошибки:
                    <ul class="list">
                        <?php foreach ($report['errors'] as $err): ?>
                            <li><?= e((string) $err) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <?php if (!empty($report['stages']) && is_array($report['stages'])): ?>
                <div class="meta">
                    <?php foreach ($report['stages'] as $stageName => $stageData): ?>
                        <div class="stat">
                            <b><?= e((string) $stageName) ?></b>
                            <span><?= e((string) ($stageData['status'] ?? 'unknown')) ?>, <?= e((string) ($stageData['duration_sec'] ?? 0)) ?> сек</span>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($report['runtime']) && is_array($report['runtime'])): ?>
                <div class="meta">
                    <div class="stat"><b>target_timeout_sec</b><span><?= e((string) ($report['runtime']['target_timeout_sec'] ?? 0)) ?></span></div>
                    <div class="stat"><b>max_execution_time</b><span><?= e((string) ($report['runtime']['php_max_execution_time'] ?? 0)) ?></span></div>
                </div>
            <?php endif; ?>
        <?php endif; ?>

        <form method="post" action="process.php" enctype="multipart/form-data" class="grid" id="upload-form" style="margin-top:16px;">
            <?= Csrf::field('upload_form') ?>

            <div class="row">
                <label for="archive">ZIP-архив шаблона</label>
                <div id="archive-dropzone" class="dropzone" tabindex="0" role="button" aria-controls="archive">
                    <div class="dropzone-title">Перетащите ZIP сюда или нажмите для выбора</div>
                    <div class="small">Поддерживается drag-and-drop одного `.zip` файла.</div>
                </div>
                <input id="archive" name="archive" type="file" accept=".zip,application/zip" required>
                <div class="small">Допустимый размер: до 100 MB.</div>
                <div id="archive-selected" class="small" aria-live="polite"></div>
            </div>

            <div class="row">
                <label for="target_path">Путь публикации</label>
                <select id="target_path" name="target_path" required>
                    <option value="" <?= $selectedTarget === '' ? 'selected' : '' ?> disabled>
                        Выберите папку публикации
                    </option>
                    <?php foreach ($targets as $path => $label): ?>
                        <option value="<?= e($path) ?>" <?= $selectedTarget === $path ? 'selected' : '' ?>>
                            <?= e($label) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <div class="small">Публикация идёт с полной заменой содержимого целевой папки.</div>
            </div>

            <div class="row">
                <label>Режим обработки</label>
                <label for="transform_mode_1">
                    <input id="transform_mode_1" name="transform_mode" type="radio" value="1" <?= $selectedTransformMode === 1 ? 'checked' : '' ?> required>
                    1. Без изменений: только размещение
                </label>
                <label for="transform_mode_2">
                    <input id="transform_mode_2" name="transform_mode" type="radio" value="2" <?= $selectedTransformMode === 2 ? 'checked' : '' ?>>
                    2. Без минификации: WebP + замена ссылок
                </label>
                <label for="transform_mode_3">
                    <input id="transform_mode_3" name="transform_mode" type="radio" value="3" <?= $selectedTransformMode === 3 ? 'checked' : '' ?>>
                    3. Полная обработка: WebP + минификация CSS/JS
                </label>
                <div class="small">Рекомендуется выбрать режим 1, если архив очень большой или содержит много тяжёлых файлов/видео. Это снижает риск таймаута и ошибок обработки.</div>
            </div>

            <button type="submit" id="upload-submit">
                <span class="btn-label">Загрузить и обработать</span>
                <span class="btn-spinner" aria-hidden="true"></span>
            </button>
        </form>

        <script nonce="<?= adminCarrdEscape($cspNonce) ?>">
        (function () {
            const form = document.getElementById('upload-form');
            const btn  = document.getElementById('upload-submit');
            const targetSelect = document.getElementById('target_path');
            const fileInput = document.getElementById('archive');
            const dropzone = document.getElementById('archive-dropzone');
            const selected = document.getElementById('archive-selected');
            if (!form || !btn) return;

            function updateSelectedFile() {
                if (!selected || !fileInput) return;
                const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
                selected.textContent = file ? ('Выбран файл: ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)') : '';
            }

            if (fileInput) {
                fileInput.addEventListener('change', updateSelectedFile);
            }

            if (dropzone && fileInput) {
                dropzone.addEventListener('click', function () {
                    fileInput.click();
                });
                dropzone.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        fileInput.click();
                    }
                });
                ['dragenter', 'dragover'].forEach(function (eventName) {
                    dropzone.addEventListener(eventName, function (event) {
                        event.preventDefault();
                        dropzone.classList.add('is-dragover');
                    });
                });
                ['dragleave', 'dragend', 'drop'].forEach(function (eventName) {
                    dropzone.addEventListener(eventName, function (event) {
                        event.preventDefault();
                        dropzone.classList.remove('is-dragover');
                    });
                });
                dropzone.addEventListener('drop', function (event) {
                    const files = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : null;
                    if (!files || !files.length) return;
                    fileInput.files = files;
                    updateSelectedFile();
                });
            }

            form.addEventListener('submit', function (event) {
                const target = targetSelect ? (targetSelect.value || '') : '';
                if (!target) {
                    return;
                }
                const ok = window.confirm(
                    'Внимание: содержимое папки ' + target + ' будет полностью заменено.\n\n' +
                    'Продолжить публикацию?'
                );
                if (!ok) {
                    event.preventDefault();
                    return;
                }
                btn.disabled = true;
                btn.classList.add('is-loading');
                const label = btn.querySelector('.btn-label');
                if (label) label.textContent = 'Загружаем...';
            });
        })();
        </script>

    </div>
</div>
</body>
</html>
