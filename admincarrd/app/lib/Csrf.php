<?php

declare(strict_types=1);

namespace AdminCarrd;

final class Csrf
{
    public static function token(string $formKey): string
    {
        if (!isset($_SESSION['admincarrd_csrf']) || !is_array($_SESSION['admincarrd_csrf'])) {
            $_SESSION['admincarrd_csrf'] = [];
        }

        if (empty($_SESSION['admincarrd_csrf'][$formKey])) {
            $_SESSION['admincarrd_csrf'][$formKey] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION['admincarrd_csrf'][$formKey];
    }

    public static function validate(string $formKey, $token): bool
    {
        if ($token === null || $token === '') {
            return false;
        }

        $sessionToken = (string) ($_SESSION['admincarrd_csrf'][$formKey] ?? '');
        if ($sessionToken === '') {
            return false;
        }

        return hash_equals($sessionToken, $token);
    }

    public static function field(string $formKey): string
    {
        $token = self::token($formKey);
        $safeToken = htmlspecialchars($token, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        return '<input type="hidden" name="csrf_token" value="' . $safeToken . '">';
    }
}
