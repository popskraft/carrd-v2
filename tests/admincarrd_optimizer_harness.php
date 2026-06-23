<?php

declare(strict_types=1);

define('ADMINCARRD_ROOT', dirname(__DIR__) . '/admincarrd');
define('ADMINCARRD_APP', ADMINCARRD_ROOT . '/app');

require ADMINCARRD_APP . '/lib/Optimizer.php';

use AdminCarrd\Optimizer;

function readJsonInput(): array
{
    $raw = stream_get_contents(STDIN);
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        fwrite(STDERR, "Invalid JSON input\n");
        exit(2);
    }

    return $decoded;
}

function makeOptimizer(array $config): Optimizer
{
    return new Optimizer($config);
}

function invokePrivate(object $object, string $methodName, array $args = [])
{
    $ref = new ReflectionClass($object);
    $method = $ref->getMethod($methodName);
    if (PHP_VERSION_ID < 80100) {
        $method->setAccessible(true);
    }
    return $method->invokeArgs($object, $args);
}

$command = $argv[1] ?? '';
$input = readJsonInput();

if ($command === 'minify-css') {
    $optimizer = makeOptimizer([
        'project_root' => sys_get_temp_dir(),
        'logs_dir' => sys_get_temp_dir() . '/admincarrd-test-logs',
        'tmp_dir' => sys_get_temp_dir() . '/admincarrd-test-tmp',
        'optimizer' => [],
        'publish' => [],
    ]);
    $result = invokePrivate($optimizer, 'minifyCss', [(string) ($input['css'] ?? '')]);
    echo json_encode(['result' => $result], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

if ($command === 'minify-js') {
    $optimizer = makeOptimizer([
        'project_root' => sys_get_temp_dir(),
        'logs_dir' => sys_get_temp_dir() . '/admincarrd-test-logs',
        'tmp_dir' => sys_get_temp_dir() . '/admincarrd-test-tmp',
        'optimizer' => [
            'js_minify_mode' => (string) ($input['js_minify_mode'] ?? 'conservative'),
        ],
        'publish' => [],
    ]);
    $warnings = [];
    $result = invokePrivate($optimizer, 'minifyJsWithFallback', [(string) ($input['js'] ?? ''), &$warnings]);
    echo json_encode(['result' => $result, 'warnings' => $warnings], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

if ($command === 'run') {
    $config = [
        'project_root' => (string) ($input['project_root'] ?? ''),
        'logs_dir' => (string) ($input['logs_dir'] ?? ''),
        'tmp_dir' => (string) ($input['tmp_dir'] ?? ''),
        'upload' => [
            'max_bytes' => 100 * 1024 * 1024,
        ],
        'optimizer' => [
            'transform_mode_default' => 3,
            'minify_enabled_default' => true,
            'html_minify_enabled' => (bool) ($input['html_minify_enabled'] ?? false),
            'js_minify_mode' => (string) ($input['js_minify_mode'] ?? 'conservative'),
            'require_files' => ['index.html', 'assets/main.css', 'assets/main.js'],
            'target_timeout_sec' => 0,
            'delete_original_images' => false,
        ],
        'publish' => [
            'allowed_targets' => [(string) ($input['target_path'] ?? '/site/')],
            'keep_publish_backup' => false,
            'protected_root_files' => ['index.php', '.htaccess'],
            'reserved_root_entries' => ['admincarrd'],
        ],
    ];

    $optimizer = makeOptimizer($config);
    $report = $optimizer->run(
        (string) ($input['zip_path'] ?? ''),
        (string) ($input['target_path'] ?? '/site/'),
        ['transform_mode' => (int) ($input['transform_mode'] ?? 3)]
    );

    echo json_encode($report, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

fwrite(STDERR, "Unknown command\n");
exit(2);
