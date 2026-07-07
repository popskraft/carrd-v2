<?php

declare(strict_types=1);

/**
 * Единая точка инициализации для всех страниц admincarrd.
 *
 * Использование на странице:
 *   require __DIR__ . '/lib/bootstrap.php';
 *   $ctx = adminCarrdBoot([
 *       'require_auth'   => true,   // требовать активную сессию
 *       'require_setup'  => true,   // блокировать если setup_complete=false
 *       'allow_pre_setup'=> false,  // разрешить выполнение когда setup_complete=false (только setup.php)
 *   ]);
 *   $config   = $ctx['config'];
 *   $auth     = $ctx['auth'];
 *   $adminUrl = $ctx['admin_url'];
 */

require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Csrf.php';
require_once __DIR__ . '/ConfigWriter.php';

use AdminCarrd\Auth;

if (!defined('ADMINCARRD_APP')) {
    define('ADMINCARRD_APP', dirname(__DIR__));
}

if (!defined('ADMINCARRD_ROOT')) {
    define('ADMINCARRD_ROOT', dirname(ADMINCARRD_APP));
}

if (!function_exists('adminCarrdBoot')) {
    function adminCarrdBoot(array $opts = []): array
    {
        $opts += [
            'require_auth'    => true,
            'require_setup'   => true,
            'allow_pre_setup' => false,
        ];

        $configFile = ADMINCARRD_APP . '/config/config.php';
        $config = require $configFile;

        date_default_timezone_set((string) ($config['app']['timezone'] ?? 'UTC'));
        @ini_set('date.timezone', (string) ($config['app']['timezone'] ?? 'UTC'));

        $locale = (string) ($config['app']['locale'] ?? '');
        if ($locale !== '') {
            @setlocale(LC_ALL, $locale, $locale . '.UTF-8', $locale . '.utf8');
        }

        $adminUrl = rtrim((string) ($config['admin_url'] ?? '/admincarrd'), '/');
        adminCarrdApplySecurityHeaders($config);

        $setupComplete = !empty($config['setup_complete']);

        // Логика setup-гейта:
        //  - allow_pre_setup=true: страница setup.php; ничего не делаем здесь.
        //  - require_setup=true и setup не завершён → редирект на setup.
        //  - setup завершён + страница это setup.php (allow_pre_setup=true) обрабатывает редирект сама.
        if ($opts['allow_pre_setup']) {
            // Стартуем правильную сессию (с samesite/httponly) — даже до завершения setup.
            Auth::bootSession($config);
            return [
                'config'    => $config,
                'auth'      => null,
                'admin_url' => $adminUrl,
                'setup_complete' => $setupComplete,
            ];
        }

        if ($opts['require_setup'] && !$setupComplete) {
            header('Location: ' . $adminUrl . '/setup.php');
            exit;
        }

        Auth::bootSession($config);

        $auth = new Auth($config);

        if ($opts['require_auth']) {
            $auth->requireLogin();
        }

        // Опционально подметаем зомби-файлы в uploads/tmp (старше 24 часов).
        adminCarrdSweepTmp((string) ($config['tmp_dir'] ?? ''), (string) ($config['logs_dir'] ?? ''));

        return [
            'config'    => $config,
            'auth'      => $auth,
            'admin_url' => $adminUrl,
            'setup_complete' => $setupComplete,
        ];
    }
}

if (!function_exists('adminCarrdSweepTmp')) {
    function adminCarrdSweepTmp(string $tmpDir, string $logsDir): void
    {
        if ($tmpDir === '' || !is_dir($tmpDir)) {
            return;
        }

        // Маркер: запускаем не чаще раза в час.
        $marker = ($logsDir !== '' ? rtrim($logsDir, '/\\') : sys_get_temp_dir()) . '/.tmp_sweep';
        $now = time();
        if (is_file($marker) && ($now - (int) @filemtime($marker)) < 3600) {
            return;
        }
        @touch($marker);

        $maxAgeSec = 24 * 3600;

        // Удаляем старые upload_*.zip файлы и job_* директории.
        foreach (glob(rtrim($tmpDir, '/\\') . '/{upload_*.zip,job_*}', GLOB_BRACE) ?: [] as $entry) {
            $mtime = @filemtime($entry);
            if ($mtime === false || ($now - $mtime) < $maxAgeSec) {
                continue;
            }
            if (is_dir($entry)) {
                adminCarrdRmTree($entry);
            } else {
                @unlink($entry);
            }
        }
    }
}

if (!function_exists('adminCarrdRmTree')) {
    function adminCarrdRmTree(string $dir): void
    {
        if (!is_dir($dir)) {
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
            $path = $dir . '/' . $item;
            if (is_dir($path) && !is_link($path)) {
                adminCarrdRmTree($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }
}

if (!function_exists('adminCarrdEscape')) {
    function adminCarrdEscape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('adminCarrdRequestId')) {
    function adminCarrdRequestId(): string
    {
        static $requestId = null;
        if (is_string($requestId) && $requestId !== '') {
            return $requestId;
        }

        $requestId = bin2hex(random_bytes(8));
        return $requestId;
    }
}

if (!function_exists('adminCarrdCspNonce')) {
    function adminCarrdCspNonce(): string
    {
        static $nonce = null;
        if (is_string($nonce) && $nonce !== '') {
            return $nonce;
        }

        $nonce = base64_encode(random_bytes(18));
        return $nonce;
    }
}

if (!function_exists('adminCarrdConfigFingerprint')) {
    function adminCarrdConfigFingerprint(string $configFile): string
    {
        return \AdminCarrd\ConfigWriter::fingerprintFile($configFile);
    }
}

if (!function_exists('adminCarrdApplySecurityHeaders')) {
    function adminCarrdApplySecurityHeaders(array $config): void
    {
        if (headers_sent()) {
            return;
        }

        header('X-Frame-Options: DENY');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: no-referrer');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
        header('X-Request-Id: ' . adminCarrdRequestId());

        // HSTS — HTTPS-only so plain-HTTP local dev is never locked out; config-gated.
        $isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https')
            || (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_SSL']) === 'on');
        if ($isHttps && ($config['security']['hsts'] ?? true)) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }

        $cspCfg = (array) ($config['security']['csp'] ?? []);
        if (!($cspCfg['enabled'] ?? true)) {
            return;
        }

        $stylePolicy = ($cspCfg['allow_inline_style'] ?? true)
            ? "style-src 'self' 'unsafe-inline'"
            : "style-src 'self'";

        $nonce = adminCarrdCspNonce();
        $policy = implode('; ', [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "img-src 'self' data: blob:",
            $stylePolicy,
            "script-src 'self' 'nonce-" . $nonce . "'",
        ]);

        header('Content-Security-Policy: ' . $policy);
    }
}
