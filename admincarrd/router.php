<?php

declare(strict_types=1);

/**
 * Router for PHP's built-in server:
 * php -S localhost:8081 admincarrd/router.php
 */

$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = parse_url($uri, PHP_URL_PATH) ?: '/';
$path = '/' . ltrim((string) $path, '/');
$lower = strtolower($path);

$blocked = [
    '~^/admincarrd/config\.php$~',
    '~^/admincarrd/setup-token\.txt$~',
    '~^/admincarrd/app(/|$)~',
    '~^/admincarrd/var(/|$)~',
    '~^/admincarrd/docs(/|$)~',
    '~^/admincarrd/[^/]*\.htaccess$~',
    '~^/admincarrd/\.user\.ini$~',
    '~^/admincarrd/(?:AGENTS\.md|router\.php)$~',
];

foreach ($blocked as $pattern) {
    if (preg_match($pattern, $lower)) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo "403 Forbidden\n";
        return true;
    }
}

if (preg_match('~^/admincarrd/(?:login|logout|setup|process|reset|config-ui|change-password)\.php$~', $lower)) {
    require __DIR__ . '/index.php';
    return true;
}

return false;
