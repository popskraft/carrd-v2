<?php

declare(strict_types=1);

namespace AdminCarrd;

use RuntimeException;

/**
 * Защита первого запуска: setup.php требует одноразовый токен.
 *
 * Токен генерируется автоматически при первом обращении к setup.php
 * и сохраняется в файле setup-token.txt рядом с config.php.
 * Доступ к этому файлу есть только у владельца сервера (FTP/SSH).
 *
 * После успешного завершения setup токен удаляется.
 */
final class SetupToken
{
    public static function path(): string
    {
        return (defined('ADMINCARRD_ROOT') ? ADMINCARRD_ROOT : dirname(__DIR__, 2)) . '/var/setup/setup-token.txt';
    }

    /**
     * Создаёт токен если его нет. Возвращает абсолютный путь к файлу.
     */
    public static function ensure(): string
    {
        $path = self::path();
        if (!is_file($path)) {
            $dir = dirname($path);
            if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
                throw new RuntimeException('Не удалось создать каталог для setup-token.txt.');
            }
            $token = bin2hex(random_bytes(16));
            $contents = "# AdminCarrd setup token\n"
                . "# Этот файл создан автоматически при первом запуске.\n"
                . "# Введите токен ниже на странице setup.php, чтобы установить первоначальный пароль.\n"
                . "# После успешной установки файл будет удалён.\n"
                . "#\n"
                . $token . "\n";
            if (@file_put_contents($path, $contents, LOCK_EX) === false) {
                throw new RuntimeException('Не удалось создать setup-token.txt — проверьте права на каталог admincarrd.');
            }
            @chmod($path, 0600);
        }
        return $path;
    }

    /**
     * Достаёт активный токен из файла. Игнорирует строки-комментарии.
     */
    public static function current(): string
    {
        $path = self::path();
        if (!is_file($path)) {
            return '';
        }
        $raw = (string) @file_get_contents($path);
        foreach (preg_split('/\r\n|\r|\n/', $raw) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            return $line;
        }
        return '';
    }

    /**
     * Сравнение с введённым пользователем токеном (constant-time).
     */
    public static function verify(string $userInput): bool
    {
        $expected = self::current();
        if ($expected === '') {
            return false;
        }
        return hash_equals($expected, trim($userInput));
    }

    public static function consume(): void
    {
        $path = self::path();
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
