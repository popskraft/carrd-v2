<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';

use AdminCarrd\Csrf;

$ctx = adminCarrdBoot([
    'require_auth'    => false,
    'require_setup'   => true,
    'allow_pre_setup' => false,
]);
$config   = $ctx['config'];
$auth     = $ctx['auth'];
$adminUrl = $ctx['admin_url'];
$cspNonce = adminCarrdCspNonce();

if ($auth->isLoggedIn()) {
    $auth->redirect($adminUrl . '/index.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = isset($_POST['csrf_token']) ? (string) $_POST['csrf_token'] : '';
    if (!Csrf::validate('login_form', $token)) {
        $error = 'Ошибка CSRF. Обновите страницу и повторите попытку.';
    } else {
        $password = isset($_POST['password']) ? (string) $_POST['password'] : '';
        $result = $auth->login($password);

        if (!empty($result['ok'])) {
            $auth->redirect($adminUrl . '/index.php');
        }

        $error = (string) ($result['error'] ?? 'Ошибка авторизации.');
    }
}
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AdminCarrd: вход</title>
    <link rel="stylesheet" href="assets/style.css?v=2">
</head>
<body>
<div class="wrap">
    <div class="card" style="max-width:520px;margin:0 auto;">
        <h1>Вход в AdminCarrd</h1>
        <p>Загрузчик архивов carrd-шаблонов с автооптимизацией.</p>

        <?php if ($error !== ''): ?>
            <div class="msg msg-error"><?= adminCarrdEscape($error) ?></div>
        <?php endif; ?>

        <form method="post" class="grid">
            <?= Csrf::field('login_form') ?>
            <div class="row">
                <label for="password">Пароль</label>
                <div class="pwd-field">
                    <input id="password" name="password" type="password" required autocomplete="current-password">
                    <button type="button" class="pwd-toggle" data-pwd-toggle="password">Показать</button>
                </div>
            </div>
            <button type="submit">Войти</button>
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
