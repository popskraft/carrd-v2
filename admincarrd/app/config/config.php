<?php

declare(strict_types=1);

$moduleRoot = dirname(__DIR__, 2);

return [
    'admin_url' => (static function (): string {
        $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
        if ($scriptName !== '') {
            $dir = trim(dirname($scriptName), '/');
            if ($dir !== '' && $dir !== '.') {
                return '/' . $dir;
            }
        }

        return '/admincarrd';
    })(),
    'project_root' => realpath($moduleRoot . '/..') ?: dirname($moduleRoot),
    'logs_dir' => $moduleRoot . '/var/logs',
    'tmp_dir' => $moduleRoot . '/var/uploads/tmp',
    'session' => [
        'name' => 'ADMINCARRDSESSID',
        'ttl' => 7200,
    ],
    // false = первый запуск, пароль не установлен, редирект на setup.php.
    // true  = пароль установлен, вход только через login.php.
    'setup_complete' => false,
    // Технический хэш полностью дефолтного пароля (CarrdAccess@20) — только для блокировки.
    // Не менять.
    'password_hash_default' => '$2y$12$AsFWNmBp524tutHELlS.aeVXQzqkdJB1fdQTeTeEY8uuB5zwSouUy',
    // Текущий рабочий пароль. Меняется через UI (страница «Сменить пароль»).
    'password_hash' => '',
    'upload' => [
        'max_bytes' => 100 * 1024 * 1024,
        'allowed_extensions' => ['zip'],
        'allowed_mime_types' => [
            'application/zip',
            'application/x-zip-compressed',
            'multipart/x-zip',
        ],
    ],
    'optimizer' => [
        'webp_quality' => 85,
        // 1 = только размещение, 2 = WebP без минификации, 3 = WebP + минификация CSS/JS
        'transform_mode_default' => 3,
        'minify_enabled_default' => true,
        'html_minify_enabled' => false,
        // conservative = минифицировать JS только когда код выглядит безопасно для упрощённого минификатора
        'js_minify_mode' => 'conservative',
        'require_files' => [
            'index.html',
            'assets/main.css',
            'assets/main.js',
        ],
        'target_timeout_sec' => 120,
        'delete_original_images' => true,
        'keep_original_images_backup' => true,
        'original_images_backup_dir' => $moduleRoot . '/var/uploads/original-backups',
        'original_images_backup_ttl_hours' => 168,
    ],
    'publish' => [
        // Если массив непустой — для публикации доступны ТОЛЬКО эти пути.
        // Если пустой — работает автоскан (discover_from_root + static_targets).
        // Управляется через UI (страница Config).
        'allowed_targets' => [],
        'discover_from_root' => true,
        // 1 = только /folder/, 2 = /folder/subfolder/
        'discover_depth' => 2,
        // Исключаем технические директории из автоскана target-путей.
        'discover_excluded_names' => [
            'assets',
            'css',
            'js',
            'img',
            'images',
            'fonts',
            'vendor',
            'node_modules',
            'dist',
            'build',
            'cache',
            'tmp',
            'uploads',
        ],
        'reserved_root_entries' => [
            'site',
            'wire',
            'admincarrd',
            '.git',
            '.github',
            '.vscode',
            '.idea',
            'vendor',
            'node_modules',
        ],
        'static_targets' => [
            '/' => 'Корень сайта (/)',
            '/_source/' => 'Папка разработки (/_source/)',
        ],
        'keep_publish_backup' => true,
        'publish_backup_dir' => $moduleRoot . '/var/uploads/publish-backups',
        'publish_backup_ttl_hours' => 48,
        'protected_root_files' => [
            'index.php',
            '.htaccess',
            '.env',
            '.env.local',
            '.user.ini',
        ],
    ],
    'security' => [
        'bind_session_to_ip' => true,
        'rate_limit' => [
            'window_sec' => 900,
            'max_attempts' => 20,
            'lockout_sec' => 900,
        ],
        'upload_rate_limit' => [
            'window_sec' => 3600,
            'max_attempts' => 10,
            'min_interval_sec' => 30,
        ],
        'ip_header' => 'REMOTE_ADDR',
        'csp' => [
            'enabled' => true,
            'allow_inline_style' => true,
        ],
    ],
    'app' => [
        'locale' => 'ru_RU',
        'timezone' => 'Europe/Moscow',
    ],
];
