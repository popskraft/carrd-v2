<?php

declare(strict_types=1);

define('ADMINCARRD_ROOT', __DIR__);
define('ADMINCARRD_APP', __DIR__ . '/app');

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$basename = substr($path, -1) === '/' ? 'index.php' : basename($path);

$routes = [
    '' => 'dashboard.php',
    'index.php' => 'dashboard.php',
    'login.php' => 'login.php',
    'logout.php' => 'logout.php',
    'setup.php' => 'setup.php',
    'process.php' => 'process.php',
    'reset.php' => 'reset.php',
    'config-ui.php' => 'config-ui.php',
    'change-password.php' => 'change-password.php',
];

$page = $routes[$basename] ?? null;
if ($page === null) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "404 Not Found\n";
    exit;
}

require ADMINCARRD_APP . '/pages/' . $page;
