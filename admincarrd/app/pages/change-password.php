<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';

use AdminCarrd\ConfigWriter;
use AdminCarrd\Csrf;

$ctx = adminCarrdBoot([
    'require_auth'    => true,
    'require_setup'   => true,
    'allow_pre_setup' => false,
]);
$config   = $ctx['config'];
$auth     = $ctx['auth'];
$adminUrl = $ctx['admin_url'];
$configFile = ADMINCARRD_APP . '/config/config.php';
$configFingerprint = adminCarrdConfigFingerprint($configFile);
$cspNonce = adminCarrdCspNonce();

$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = isset($_POST['csrf_token']) ? (string) $_POST['csrf_token'] : '';
    if (!Csrf::validate('change_password_form', $token)) {
        $error = 'Ошибка CSRF. Обновите страницу и повторите попытку.';
    } else {
        $postedFingerprint = isset($_POST['config_fingerprint']) ? (string) $_POST['config_fingerprint'] : '';
        $currentPassword  = isset($_POST['current_password'])  ? (string) $_POST['current_password']  : '';
        $newPassword      = isset($_POST['new_password'])      ? (string) $_POST['new_password']      : '';
        $confirmPassword  = isset($_POST['confirm_password'])  ? (string) $_POST['confirm_password']  : '';

        $currentHash = (string) ($config['password_hash'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
            $error = 'Заполните все поля.';
        } elseif (!password_verify($currentPassword, $currentHash)) {
            $error = 'Текущий пароль введён неверно.';
        } elseif ($newPassword !== $confirmPassword) {
            $error = 'Новый пароль и подтверждение не совпадают.';
        } elseif (mb_strlen($newPassword) < 8) {
            $error = 'Новый пароль должен содержать не менее 8 символов.';
        } elseif (password_verify($newPassword, $currentHash)) {
            $error = 'Новый пароль совпадает с текущим. Придумайте другой.';
        } else {
            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            try {
                ConfigWriter::updateIfUnchanged($configFile, $postedFingerprint, static function (string $content) use ($newHash): string {
                    return ConfigWriter::replaceStringValue($content, 'password_hash', $newHash);
                });

                // После смены пароля все старые сессии станут невалидны (pwd_version изменится).
                // Текущую сессию обновим — иначе сразу же выкинет.
                $_SESSION['admincarrd_auth']['pwd_version'] = substr(hash('sha256', $newHash), 0, 16);

                $success = 'Пароль успешно изменён. Все остальные сессии будут завершены.';
            } catch (\Throwable $e) {
                $error = 'Не удалось обновить config.php: ' . $e->getMessage();
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
    <title>AdminCarrd: смена пароля</title>
    <link rel="stylesheet" href="assets/style.css?v=2">
</head>
<body>
<div class="wrap">
    <div class="card">
        <div class="toolbar">
            <div>
                <h1>Смена пароля</h1>
                <p>Обновите пароль для входа в AdminCarrd.</p>
            </div>
            <div style="display:flex;gap:8px;">
                <a class="btn btn-ghost" href="index.php">← Назад</a>
                <a class="btn btn-ghost" href="logout.php">Выйти</a>
            </div>
        </div>

        <?php if ($error !== ''): ?>
            <div class="msg msg-error"><?= adminCarrdEscape($error) ?></div>
        <?php endif; ?>

        <?php if ($success !== ''): ?>
            <div class="msg msg-ok"><?= adminCarrdEscape($success) ?></div>
        <?php endif; ?>

        <form method="post" class="grid" style="max-width:480px;">
            <?= Csrf::field('change_password_form') ?>
            <input type="hidden" name="config_fingerprint" value="<?= adminCarrdEscape($configFingerprint) ?>">

            <div class="row">
                <label for="current_password">Текущий пароль</label>
                <div class="pwd-field">
                    <input id="current_password" name="current_password" type="password" required autocomplete="current-password">
                    <button type="button" class="pwd-toggle" data-pwd-toggle="current_password">Показать</button>
                </div>
            </div>

            <div class="row">
                <label for="new_password">Новый пароль</label>
                <div class="pwd-field">
                    <input id="new_password" name="new_password" type="password" required autocomplete="new-password" minlength="8">
                    <button type="button" class="pwd-toggle" data-pwd-toggle="new_password">Показать</button>
                </div>
                <div class="small">Минимум 8 символов.</div>
            </div>

            <div class="row">
                <label for="confirm_password">Повторите новый пароль</label>
                <div class="pwd-field">
                    <input id="confirm_password" name="confirm_password" type="password" required autocomplete="new-password" minlength="8">
                    <button type="button" class="pwd-toggle" data-pwd-toggle="confirm_password">Показать</button>
                </div>
            </div>

            <button type="submit">Сохранить новый пароль</button>
        </form>
    </div>
</div>
<script nonce="<?= adminCarrdEscape($cspNonce) ?>">
document.querySelectorAll('[data-pwd-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var input = document.getElementById(btn.dataset.pwdToggle);
        if (!input) return;
        var isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.textContent = isPwd ? 'Скрыть' : 'Показать';
    });
});
</script>
</body>
</html>
