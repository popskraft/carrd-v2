<?php

declare(strict_types=1);

namespace AdminCarrd;

use RuntimeException;

/**
 * Атомарная и потокобезопасная запись config.php.
 *
 * Стратегия:
 *  1. flock() на сам config.php (LOCK_EX) — отсекает конкурирующие записи.
 *  2. Чтение свежего содержимого под локом.
 *  3. Применение всех мутаций в памяти (callback).
 *  4. Запись во временный файл рядом, fsync, rename() — атомарная замена.
 *  5. opcache_invalidate + clearstatcache.
 */
final class ConfigWriter
{
    public static function fingerprint(string $content): string
    {
        return hash('sha256', $content);
    }

    public static function fingerprintFile(string $configFile): string
    {
        if (!is_file($configFile)) {
            throw new RuntimeException('config.php не найден: ' . $configFile);
        }

        $content = @file_get_contents($configFile);
        if (!is_string($content)) {
            throw new RuntimeException('Не удалось прочитать config.php для fingerprint.');
        }

        return self::fingerprint($content);
    }

    /**
     * @param string $configFile абсолютный путь к config.php
     * @param callable $mutator function(string $content): string — должен вернуть новый контент
     * @return bool true при успешной записи; false если контент не изменился
     * @throws RuntimeException на любой сбой ввода-вывода или блокировки
     */
    public static function update(string $configFile, callable $mutator): bool
    {
        if (!is_file($configFile)) {
            throw new RuntimeException('config.php не найден: ' . $configFile);
        }

        $handle = @fopen($configFile, 'rb');
        if ($handle === false) {
            throw new RuntimeException('Не удалось открыть config.php для чтения.');
        }

        try {
            // Эксклюзивный лок — все остальные writers ждут.
            if (!@flock($handle, LOCK_EX)) {
                throw new RuntimeException('Не удалось получить эксклюзивную блокировку на config.php.');
            }

            // Читаем свежее содержимое (после получения лока).
            $content = stream_get_contents($handle);
            if (!is_string($content)) {
                throw new RuntimeException('Не удалось прочитать config.php.');
            }

            $newContent = $mutator($content);
            if (!is_string($newContent)) {
                throw new RuntimeException('Mutator должен вернуть строку.');
            }

            if ($newContent === $content) {
                @flock($handle, LOCK_UN);
                return false;
            }

            // Базовая защита от поломки файла: должен начинаться с <?php
            if (strncmp($newContent, '<?php', 5) !== 0) {
                throw new RuntimeException('Отказ записи: новый config не начинается с <?php');
            }

            // Атомарная замена: tmp-файл рядом + rename.
            $dir = dirname($configFile);
            $tmp = @tempnam($dir, 'cfgw_');
            if ($tmp === false) {
                throw new RuntimeException('Не удалось создать временный файл для config.php.');
            }

            $written = @file_put_contents($tmp, $newContent);
            if ($written === false || $written !== strlen($newContent)) {
                @unlink($tmp);
                throw new RuntimeException('Не удалось записать временный config-файл.');
            }

            // Сохраняем права исходного файла на tmp-файле.
            $perms = @fileperms($configFile);
            if ($perms !== false) {
                @chmod($tmp, $perms & 0777);
            }

            if (!@rename($tmp, $configFile)) {
                @unlink($tmp);
                throw new RuntimeException('Не удалось переименовать временный файл в config.php.');
            }

            // Сбрасываем кеши.
            if (function_exists('opcache_invalidate')) {
                @opcache_invalidate($configFile, true);
            }
            clearstatcache(true);

            @flock($handle, LOCK_UN);
            return true;
        } finally {
            @fclose($handle);
        }
    }

    /**
     * Оптимистическая блокировка: запись разрешена, только если текущий fingerprint
     * совпадает с ожидаемым значением, полученным при рендере формы.
     */
    public static function updateIfUnchanged(string $configFile, string $expectedFingerprint, callable $mutator): bool
    {
        if ($expectedFingerprint === '') {
            throw new RuntimeException('Не передан fingerprint config.php для optimistic locking.');
        }

        if (!is_file($configFile)) {
            throw new RuntimeException('config.php не найден: ' . $configFile);
        }

        $handle = @fopen($configFile, 'rb');
        if ($handle === false) {
            throw new RuntimeException('Не удалось открыть config.php для чтения.');
        }

        try {
            if (!@flock($handle, LOCK_EX)) {
                throw new RuntimeException('Не удалось получить эксклюзивную блокировку на config.php.');
            }

            $content = stream_get_contents($handle);
            if (!is_string($content)) {
                throw new RuntimeException('Не удалось прочитать config.php.');
            }

            $currentFingerprint = self::fingerprint($content);
            if (!hash_equals($expectedFingerprint, $currentFingerprint)) {
                throw new RuntimeException('config.php был изменён в другой сессии. Обновите страницу и повторите попытку.');
            }

            $newContent = $mutator($content);
            if (!is_string($newContent)) {
                throw new RuntimeException('Mutator должен вернуть строку.');
            }

            if ($newContent === $content) {
                @flock($handle, LOCK_UN);
                return false;
            }

            if (strncmp($newContent, '<?php', 5) !== 0) {
                throw new RuntimeException('Отказ записи: новый config не начинается с <?php');
            }

            $dir = dirname($configFile);
            $tmp = @tempnam($dir, 'cfgw_');
            if ($tmp === false) {
                throw new RuntimeException('Не удалось создать временный файл для config.php.');
            }

            $written = @file_put_contents($tmp, $newContent);
            if ($written === false || $written !== strlen($newContent)) {
                @unlink($tmp);
                throw new RuntimeException('Не удалось записать временный config-файл.');
            }

            $perms = @fileperms($configFile);
            if ($perms !== false) {
                @chmod($tmp, $perms & 0777);
            }

            if (!@rename($tmp, $configFile)) {
                @unlink($tmp);
                throw new RuntimeException('Не удалось переименовать временный файл в config.php.');
            }

            if (function_exists('opcache_invalidate')) {
                @opcache_invalidate($configFile, true);
            }
            clearstatcache(true);

            @flock($handle, LOCK_UN);
            return true;
        } finally {
            @fclose($handle);
        }
    }

    /**
     * Заменяет значение скалярной директивы `'key' => '...'` на новую строку.
     * Использует preg_replace_callback — безопасно для значений с $ внутри (bcrypt-хэши).
     */
    public static function replaceStringValue(string $content, string $key, string $newValue): string
    {
        $pattern = "/('" . preg_quote($key, '/') . "'\s*=>\s*)'[^']*'/";
        $result = preg_replace_callback(
            $pattern,
            static function (array $m) use ($newValue): string {
                return $m[1] . "'" . str_replace("'", "\\'", $newValue) . "'";
            },
            $content,
            1,
            $count
        );

        if ($result === null || $count === 0) {
            throw new RuntimeException("Ключ '" . $key . "' не найден в config.php.");
        }

        return $result;
    }

    /**
     * Заменяет булеву директиву `'key' => true|false`.
     */
    public static function replaceBoolValue(string $content, string $key, bool $newValue): string
    {
        $pattern = "/('" . preg_quote($key, '/') . "'\s*=>\s*)(true|false)/";
        $literal = $newValue ? 'true' : 'false';
        $result = preg_replace_callback(
            $pattern,
            static function (array $m) use ($literal): string {
                return $m[1] . $literal;
            },
            $content,
            1,
            $count
        );

        if ($result === null || $count === 0) {
            throw new RuntimeException("Ключ '" . $key . "' не найден в config.php.");
        }

        return $result;
    }

    /**
     * Заменяет массив-литерал `'key' => [ ... ]` на массив строк.
     * Защита от ReDoS: ограничиваем длину inner-блока 50 KB.
     */
    public static function replaceStringArrayValue(string $content, string $key, array $values, string $indent = '        '): string
    {
        $pattern = "/('" . preg_quote($key, '/') . "'\s*=>\s*)\[[^\]]{0,50000}\]/s";

        if (empty($values)) {
            $literal = '[]';
        } else {
            $lines = [];
            foreach ($values as $v) {
                $lines[] = $indent . '    ' . "'" . str_replace("'", "\\'", (string) $v) . "',";
            }
            $literal = "[\n" . implode("\n", $lines) . "\n" . $indent . ']';
        }

        $result = preg_replace_callback(
            $pattern,
            static function (array $m) use ($literal): string {
                return $m[1] . $literal;
            },
            $content,
            1,
            $count
        );

        if ($result === null || $count === 0) {
            throw new RuntimeException("Ключ '" . $key . "' не найден в config.php.");
        }

        return $result;
    }
}
