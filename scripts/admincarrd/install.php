<?php

declare(strict_types=1);

const ADMINCARRD_INSTALL_PACKAGE = 'admincarrd-package.zip';
const ADMINCARRD_INSTALL_LOCK = 'admincarrd-install.lock';
const ADMINCARRD_MIN_PHP = '7.4.0';

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function installerBaseDir(): string
{
    return __DIR__;
}

function normalizeInstallDir(string $value): string
{
    $value = trim(str_replace('\\', '/', $value));
    $value = trim($value, '/');
    if ($value === '') {
        return 'admincarrd';
    }
    if (preg_match('/(?:^|\/)\.\.(?:\/|$)/', $value) === 1 || preg_match('/^[A-Za-z]:/', $value) === 1) {
        throw new RuntimeException('Путь установки не должен быть абсолютным или содержать "..".');
    }
    if (preg_match('/^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/', $value) !== 1) {
        throw new RuntimeException('Путь установки может содержать только латиницу, цифры, ".", "_" и "-".');
    }
    return $value;
}

function rrmdir(string $dir): void
{
    if (!is_dir($dir) || is_link($dir)) {
        @unlink($dir);
        return;
    }
    $items = scandir($dir);
    if (!is_array($items)) {
        return;
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        rrmdir($dir . DIRECTORY_SEPARATOR . $item);
    }
    @rmdir($dir);
}

function copyTree(string $source, string $target, array $preserveRelative = []): void
{
    if (!is_dir($target) && !mkdir($target, 0755, true) && !is_dir($target)) {
        throw new RuntimeException('Не удалось создать каталог: ' . $target);
    }

    $source = rtrim($source, '/\\');
    $target = rtrim($target, '/\\');
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        $sourcePath = $item->getPathname();
        $relative = str_replace('\\', '/', substr($sourcePath, strlen($source) + 1));
        foreach ($preserveRelative as $preserve) {
            if ($relative === $preserve || strpos($relative, rtrim($preserve, '/') . '/') === 0) {
                continue 2;
            }
        }

        $targetPath = $target . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
        if ($item->isDir()) {
            if (!is_dir($targetPath) && !mkdir($targetPath, 0755, true) && !is_dir($targetPath)) {
                throw new RuntimeException('Не удалось создать каталог: ' . $targetPath);
            }
            continue;
        }
        if (!is_dir(dirname($targetPath)) && !mkdir(dirname($targetPath), 0755, true) && !is_dir(dirname($targetPath))) {
            throw new RuntimeException('Не удалось создать каталог: ' . dirname($targetPath));
        }
        if (!copy($sourcePath, $targetPath)) {
            throw new RuntimeException('Не удалось скопировать файл: ' . $relative);
        }
    }
}

function validateZipEntry(string $name): void
{
    $name = str_replace('\\', '/', $name);
    if ($name === '' || $name[0] === '/' || preg_match('/^[A-Za-z]:/', $name) === 1) {
        throw new RuntimeException('Пакет содержит небезопасный путь: ' . $name);
    }
    foreach (explode('/', $name) as $part) {
        if ($part === '..') {
            throw new RuntimeException('Пакет содержит path traversal: ' . $name);
        }
    }
}

function extractPackage(string $packagePath, string $workDir): string
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('PHP extension ZipArchive недоступен.');
    }
    if (!is_file($packagePath)) {
        throw new RuntimeException('Рядом с install.php не найден ' . ADMINCARRD_INSTALL_PACKAGE . '.');
    }

    $zip = new ZipArchive();
    if ($zip->open($packagePath) !== true) {
        throw new RuntimeException('Не удалось открыть пакет установки.');
    }

    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = (string) $zip->getNameIndex($i);
        validateZipEntry($name);
        if ($name !== 'admincarrd/' && strpos($name, 'admincarrd/') !== 0) {
            $zip->close();
            throw new RuntimeException('Пакет должен содержать корневую папку admincarrd/.');
        }
    }

    if (!$zip->extractTo($workDir)) {
        $zip->close();
        throw new RuntimeException('Не удалось распаковать пакет установки.');
    }
    $zip->close();

    $source = $workDir . DIRECTORY_SEPARATOR . 'admincarrd';
    if (!is_file($source . '/index.php') || !is_file($source . '/app/config/config.php')) {
        throw new RuntimeException('Пакет имеет некорректную структуру.');
    }

    return $source;
}

function setConfigValue(string $content, string $key, string $value): string
{
    $quoted = var_export($value, true);
    $updated = preg_replace_callback(
        "/'" . preg_quote($key, '/') . "'\\s*=>\\s*'[^']*'/",
        static function () use ($key, $quoted): string {
            return "'" . $key . "' => " . $quoted;
        },
        $content,
        1
    );
    return is_string($updated) ? $updated : $content;
}

function setConfigBool(string $content, string $key, bool $value): string
{
    return preg_replace("/'" . preg_quote($key, '/') . "'\\s*=>\\s*(?:true|false)/", "'" . $key . "' => " . ($value ? 'true' : 'false'), $content, 1) ?? $content;
}

function configureFreshInstall(string $targetDir, string $password): void
{
    $configFile = $targetDir . '/app/config/config.php';
    $content = (string) file_get_contents($configFile);
    $content = setConfigBool($content, 'setup_complete', true);
    $content = setConfigValue($content, 'password_hash', password_hash($password, PASSWORD_DEFAULT));
    if (file_put_contents($configFile, $content, LOCK_EX) === false) {
        throw new RuntimeException('Не удалось записать app/config/config.php.');
    }
    @unlink($targetDir . '/var/setup/setup-token.txt');
}

function ensureRuntimeDirs(string $targetDir): void
{
    $dirs = [
        'var/logs',
        'var/setup',
        'var/uploads/tmp',
        'var/uploads/original-backups',
        'var/uploads/publish-backups',
    ];
    foreach ($dirs as $dir) {
        $path = $targetDir . '/' . $dir;
        if (!is_dir($path) && !mkdir($path, 0755, true) && !is_dir($path)) {
            throw new RuntimeException('Не удалось создать runtime-каталог: ' . $dir);
        }
    }
}

function prepareUpdateTarget(string $targetDir): void
{
    $replace = [
        '.htaccess',
        'AGENTS.md',
        'index.php',
        'router.php',
        'assets',
        'docs',
        'app/.htaccess',
        'app/lib',
        'app/pages',
    ];
    foreach ($replace as $relative) {
        $path = $targetDir . '/' . $relative;
        if (file_exists($path) || is_link($path)) {
            rrmdir($path);
        }
    }
}

$errors = [];
$messages = [];
$baseDir = installerBaseDir();
$packagePath = $baseDir . DIRECTORY_SEPARATOR . ADMINCARRD_INSTALL_PACKAGE;
$lockPath = $baseDir . DIRECTORY_SEPARATOR . ADMINCARRD_INSTALL_LOCK;
$defaultDir = 'admincarrd';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (version_compare(PHP_VERSION, ADMINCARRD_MIN_PHP, '<')) {
            throw new RuntimeException('Нужен PHP ' . ADMINCARRD_MIN_PHP . ' или новее. Сейчас: ' . PHP_VERSION);
        }
        if (!is_writable($baseDir)) {
            throw new RuntimeException('Каталог с install.php недоступен для записи.');
        }

        $installDir = normalizeInstallDir((string) ($_POST['install_dir'] ?? $defaultDir));
        $targetDir = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $installDir);
        $isUpdate = is_dir($targetDir);
        $allowUpdate = isset($_POST['allow_update']) && (string) $_POST['allow_update'] === '1';
        $password = (string) ($_POST['admin_password'] ?? '');
        $confirm = (string) ($_POST['admin_password_confirm'] ?? '');

        if ($isUpdate && !$allowUpdate) {
            throw new RuntimeException('Каталог уже существует. Для обновления отметьте режим update.');
        }
        if (!$isUpdate) {
            if (strlen($password) < 8) {
                throw new RuntimeException('Пароль должен быть не короче 8 символов.');
            }
            if ($password !== $confirm) {
                throw new RuntimeException('Пароли не совпадают.');
            }
        }

        $workDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'admincarrd-install-' . bin2hex(random_bytes(6));
        if (!mkdir($workDir, 0700, true) && !is_dir($workDir)) {
            throw new RuntimeException('Не удалось создать временный каталог установки.');
        }

        try {
            $sourceDir = extractPackage($packagePath, $workDir);
            $preserve = $isUpdate ? ['app/config/config.php', 'var'] : [];
            if ($isUpdate) {
                prepareUpdateTarget($targetDir);
            }
            copyTree($sourceDir, $targetDir, $preserve);
            ensureRuntimeDirs($targetDir);
            if (!$isUpdate) {
                configureFreshInstall($targetDir, $password);
            }
        } finally {
            rrmdir($workDir);
        }

        file_put_contents($lockPath, "AdminCarrd installer completed at " . date('c') . "\n", LOCK_EX);
        $messages[] = $isUpdate
            ? 'AdminCarrd обновлён. Существующие config.php и var/ сохранены.'
            : 'AdminCarrd установлен. Пароль администратора записан.';
        $messages[] = 'Откройте: /' . $installDir . '/login.php';
        $messages[] = 'После проверки удалите install.php, ' . ADMINCARRD_INSTALL_PACKAGE . ' и ' . ADMINCARRD_INSTALL_LOCK . '.';
    } catch (Throwable $e) {
        $errors[] = $e->getMessage();
    }
}

$checks = [
    'PHP >= ' . ADMINCARRD_MIN_PHP => version_compare(PHP_VERSION, ADMINCARRD_MIN_PHP, '>='),
    'ZipArchive' => class_exists('ZipArchive'),
    'Пакет рядом с installer' => is_file($packagePath),
    'Каталог доступен для записи' => is_writable($baseDir),
];
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AdminCarrd Installer</title>
    <style>
        :root { color-scheme: light; --bg:#f4efe7; --ink:#241f1a; --muted:#756b61; --card:#fffaf2; --line:#dbcdbd; --ok:#0f7a4f; --bad:#a62929; --accent:#835c2e; }
        body { margin:0; font:16px/1.5 Georgia, "Times New Roman", serif; background:radial-gradient(circle at top left,#fff7df,transparent 34rem),var(--bg); color:var(--ink); }
        .wrap { max-width:760px; margin:48px auto; padding:0 20px; }
        .card { background:var(--card); border:1px solid var(--line); border-radius:22px; padding:28px; box-shadow:0 18px 50px rgba(73,52,28,.12); }
        h1 { margin:0 0 10px; font-size:34px; }
        p { color:var(--muted); }
        label { display:block; font-weight:700; margin:16px 0 6px; }
        input[type=text], input[type=password] { width:100%; box-sizing:border-box; border:1px solid var(--line); border-radius:12px; padding:12px 14px; font:16px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; background:#fff; }
        button { margin-top:20px; border:0; border-radius:999px; padding:13px 22px; background:var(--accent); color:#fff; font-weight:700; cursor:pointer; }
        .check { display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:8px 0; }
        .ok { color:var(--ok); font-weight:700; }
        .bad { color:var(--bad); font-weight:700; }
        .msg { padding:12px 14px; border-radius:14px; margin:12px 0; }
        .msg.okbox { background:#e8f5ee; color:#155f42; }
        .msg.badbox { background:#fdecec; color:#842020; }
        .small { color:var(--muted); font-size:14px; }
        code { background:#f0e5d6; padding:.15em .35em; border-radius:6px; }
    </style>
</head>
<body>
<main class="wrap">
    <section class="card">
        <h1>AdminCarrd Installer</h1>
        <p>Загрузите этот файл рядом с <code><?= h(ADMINCARRD_INSTALL_PACKAGE) ?></code>, затем установите или обновите модуль.</p>

        <?php foreach ($checks as $label => $ok): ?>
            <div class="check"><span><?= h((string) $label) ?></span><span class="<?= $ok ? 'ok' : 'bad' ?>"><?= $ok ? 'OK' : 'FAIL' ?></span></div>
        <?php endforeach; ?>

        <?php foreach ($errors as $error): ?>
            <div class="msg badbox"><?= h($error) ?></div>
        <?php endforeach; ?>
        <?php foreach ($messages as $message): ?>
            <div class="msg okbox"><?= h($message) ?></div>
        <?php endforeach; ?>

        <form method="post">
            <label for="install_dir">Путь установки</label>
            <input id="install_dir" name="install_dir" type="text" value="<?= h($defaultDir) ?>" placeholder="admincarrd">
            <div class="small">По умолчанию: <code>admincarrd</code>. Можно указать вложенный относительный путь, например <code>tools/admincarrd</code>.</div>

            <label>
                <input name="allow_update" type="checkbox" value="1">
                Обновить существующую установку и сохранить её <code>app/config/config.php</code> и <code>var/</code>
            </label>

            <label for="admin_password">Пароль администратора для новой установки</label>
            <input id="admin_password" name="admin_password" type="password" autocomplete="new-password" minlength="8">
            <label for="admin_password_confirm">Повторите пароль</label>
            <input id="admin_password_confirm" name="admin_password_confirm" type="password" autocomplete="new-password" minlength="8">
            <div class="small">Для update существующей установки пароль не требуется.</div>

            <button type="submit">Установить / обновить AdminCarrd</button>
        </form>
    </section>
</main>
</body>
</html>
