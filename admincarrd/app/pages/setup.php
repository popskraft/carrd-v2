<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';
require ADMINCARRD_APP . '/lib/SetupToken.php';

use AdminCarrd\ConfigWriter;
use AdminCarrd\Csrf;
use AdminCarrd\SetupToken;

$ctx = adminCarrdBoot([
    'require_auth'    => false,
    'require_setup'   => false,
    'allow_pre_setup' => true,
]);
$config         = $ctx['config'];
$adminUrl       = $ctx['admin_url'];
$setupComplete  = $ctx['setup_complete'];
$configFile     = ADMINCARRD_APP . '/config/config.php';
$configFingerprint = adminCarrdConfigFingerprint($configFile);
$tokenRelativePath = 'admincarrd/var/setup/setup-token.txt';
$resetComplete = $_SERVER['REQUEST_METHOD'] === 'GET'
    && isset($_GET['reset'])
    && (string) $_GET['reset'] === '1';

// Если setup уже завершён — на логин
if ($setupComplete) {
    header('Location: ' . $adminUrl . '/login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET'
    && isset($_GET['create_token'])
    && (string) $_GET['create_token'] === '1'
) {
    SetupToken::ensure();
    header('Location: ' . $adminUrl . '/setup.php?token_created=1');
    exit;
}

// После полного reset не пересоздаём setup-token автоматически.
// Иначе пользователь сразу видит новый файл и reset выглядит как неуспешный.
$deferTokenCreation = $resetComplete && !is_file(SetupToken::path());
if (!$deferTokenCreation) {
    SetupToken::ensure();
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = isset($_POST['csrf_token']) ? (string) $_POST['csrf_token'] : '';
    if (!Csrf::validate('setup_form', $token)) {
        $error = 'Ошибка CSRF. Обновите страницу и повторите попытку.';
    } else {
        $postedFingerprint = isset($_POST['config_fingerprint']) ? (string) $_POST['config_fingerprint'] : '';
        $setupTokenInput = isset($_POST['setup_token']) ? (string) $_POST['setup_token'] : '';
        $newPassword     = isset($_POST['new_password']) ? (string) $_POST['new_password'] : '';
        $confirmPassword = isset($_POST['confirm_password']) ? (string) $_POST['confirm_password'] : '';

        if (!SetupToken::verify($setupTokenInput)) {
            $error = 'Неверный setup-token. Откройте файл ' . $tokenRelativePath . ' и скопируйте токен.';
        } elseif ($newPassword === '' || $confirmPassword === '') {
            $error = 'Заполните оба поля.';
        } elseif (mb_strlen($newPassword) < 8) {
            $error = 'Пароль должен содержать не менее 8 символов.';
        } elseif ($newPassword !== $confirmPassword) {
            $error = 'Пароли не совпадают.';
        } else {
            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            try {
                ConfigWriter::updateIfUnchanged($configFile, $postedFingerprint, static function (string $content) use ($newHash): string {
                    $content = ConfigWriter::replaceStringValue($content, 'password_hash', $newHash);
                    $content = ConfigWriter::replaceBoolValue($content, 'setup_complete', true);
                    return $content;
                });
                SetupToken::consume();
                header('Location: ' . $adminUrl . '/login.php');
                exit;
            } catch (\Throwable $e) {
                $error = 'Не удалось записать config.php: ' . $e->getMessage();
            }
        }
    }
}
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AdminCarrd: первый запуск</title>
    <link rel="stylesheet" href="assets/style.css?v=2">
</head>
<body>
<div class="wrap">
    <div class="card" style="max-width:560px;margin:0 auto;">
        <h1>Добро пожаловать в AdminCarrd</h1>
        <p>Первый запуск. Установите пароль для входа в панель управления.</p>

        <?php if ($deferTokenCreation): ?>
            <div class="msg msg-ok">
                <b>Сброс завершён.</b><br>
                Runtime-файлы удалены, включая <code><?= adminCarrdEscape($tokenRelativePath) ?></code>.
                Чтобы начать новую установку, создайте свежий setup-token.
            </div>
            <p>
                <a class="btn" href="<?= adminCarrdEscape($adminUrl) ?>/setup.php?create_token=1">Создать новый setup-token</a>
            </p>
        <?php else: ?>
            <?php if (isset($_GET['token_created']) && (string) $_GET['token_created'] === '1'): ?>
                <div class="msg msg-ok">Новый setup-token создан.</div>
            <?php endif; ?>
            <div class="msg msg-warn">
                <b>Защита первого запуска.</b><br>
                Откройте на сервере файл <code><?= adminCarrdEscape($tokenRelativePath) ?></code> и скопируйте токен в поле ниже. Без него установка пароля невозможна.
                После успешной установки файл удалится автоматически.
            </div>
        <?php endif; ?>

        <?php if ($error !== ''): ?>
            <div class="msg msg-error"><?= adminCarrdEscape($error) ?></div>
        <?php endif; ?>

        <?php if (!$deferTokenCreation): ?>
        <form method="post" class="grid">
            <?= Csrf::field('setup_form') ?>
            <input type="hidden" name="config_fingerprint" value="<?= adminCarrdEscape($configFingerprint) ?>">

            <div class="row">
                <label for="setup_token">Setup-token</label>
                <input id="setup_token" name="setup_token" type="text" required autocomplete="off"
                       placeholder="Содержимое файла setup-token.txt"
                       style="font-family: ui-monospace, 'SF Mono', Menlo, monospace;">
            </div>

            <div class="row">
                <label for="new_password">Новый пароль</label>
                <input id="new_password" name="new_password" type="password" required autocomplete="new-password" minlength="8">
                <div class="small">Минимум 8 символов.</div>
            </div>

            <div class="row">
                <label for="confirm_password">Повторите пароль</label>
                <input id="confirm_password" name="confirm_password" type="password" required autocomplete="new-password" minlength="8">
            </div>

            <button type="submit">Установить пароль и войти</button>
        </form>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
