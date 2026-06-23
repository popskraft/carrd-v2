<?php

declare(strict_types=1);

require ADMINCARRD_APP . '/lib/bootstrap.php';

$ctx = adminCarrdBoot([
    'require_auth' => false,
    'require_setup' => false,
    'allow_pre_setup' => true,
]);
$config = $ctx['config'];
$auth = new \AdminCarrd\Auth($config);
$auth->logout();

header('Location: ' . rtrim((string) ($config['admin_url'] ?? '/admincarrd'), '/') . '/login.php');
exit;
