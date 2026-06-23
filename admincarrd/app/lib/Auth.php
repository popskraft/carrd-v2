<?php

declare(strict_types=1);

namespace AdminCarrd;

final class Auth
{
    private $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public static function bootSession(array $config)
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $sessionName = (string) ($config['session']['name'] ?? 'ADMINCARRDSESSID');
        session_name($sessionName);

        $secure = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https')
            || (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_SSL']) === 'on');
        if (PHP_VERSION_ID >= 70300) {
            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'secure' => $secure,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        } else {
            session_set_cookie_params(0, '/; samesite=Lax', '', $secure, true);
        }

        session_start();
    }

    public function isLoggedIn(): bool
    {
        $loggedIn = !empty($_SESSION['admincarrd_auth']['ok']);
        if (!$loggedIn) {
            return false;
        }

        $ttl = (int) ($this->config['session']['ttl'] ?? 7200);
        $createdAt = (int) ($_SESSION['admincarrd_auth']['created_at'] ?? 0);
        if ($createdAt <= 0 || (time() - $createdAt) > $ttl) {
            $this->logout();
            return false;
        }

        // Проверяем привязку к IP (по умолчанию включено).
        if ((bool) ($this->config['security']['bind_session_to_ip'] ?? true)) {
            $sessionIp = (string) ($_SESSION['admincarrd_auth']['ip'] ?? '');
            $currentIp = $this->getClientIp();
            if ($sessionIp !== '' && !hash_equals($sessionIp, $currentIp)) {
                $this->logout();
                return false;
            }
        }

        // Проверяем версию пароля. Если в config.php pwd сменили — все старые сессии инвалидируются.
        $currentVersion = $this->currentPasswordVersion();
        $sessionVersion = (string) ($_SESSION['admincarrd_auth']['pwd_version'] ?? '');
        if ($sessionVersion !== '' && $currentVersion !== '' && !hash_equals($sessionVersion, $currentVersion)) {
            $this->logout();
            return false;
        }

        return true;
    }

    /**
     * Версия пароля = первые 16 символов sha256 от текущего bcrypt-хэша.
     * При смене пароля версия меняется → все живые сессии становятся невалидными.
     */
    public function currentPasswordVersion(): string
    {
        $hash = (string) ($this->config['password_hash'] ?? '');
        if ($hash === '') {
            return '';
        }
        return substr(hash('sha256', $hash), 0, 16);
    }

    public function requireLogin()
    {
        if ($this->isLoggedIn()) {
            return;
        }

        $adminUrl = rtrim((string) ($this->config['admin_url'] ?? '/admincarrd'), '/');
        $this->redirect($adminUrl . '/login.php');
    }

    public function login(string $password): array
    {
        if ($this->isDefaultPasswordHash()) {
            return [
                'ok' => false,
                'error' => 'В системе используется пароль по умолчанию. Смените password_hash в config.php.',
            ];
        }

        $password = trim($password);
        $ip = $this->getClientIp();

        $blocked = $this->getRateLimitState($ip);
        if ($blocked['is_blocked']) {
            return [
                'ok' => false,
                'error' => 'Слишком много попыток. Повторите через ' . $blocked['retry_after'] . ' сек.',
            ];
        }

        $hash = (string) ($this->config['password_hash'] ?? '');
        if ($password === '' || $hash === '' || !password_verify($password, $hash)) {
            $this->registerFailedAttempt($ip);
            return [
                'ok' => false,
                'error' => 'Неверный пароль.',
            ];
        }

        $this->clearRateLimit($ip);
        session_regenerate_id(true);
        $_SESSION['admincarrd_auth'] = [
            'ok' => true,
            'created_at' => time(),
            'ip' => $ip,
            'pwd_version' => $this->currentPasswordVersion(),
        ];
        $this->registerCurrentSessionId();

        return ['ok' => true];
    }

    public function logout()
    {
        $this->unregisterCurrentSessionId();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 3600, $params['path'] ?? '/', $params['domain'] ?? '', (bool) ($params['secure'] ?? false), (bool) ($params['httponly'] ?? true));
        }

        session_destroy();
    }

    public function getClientIp(): string
    {
        $key = (string) ($this->config['security']['ip_header'] ?? 'REMOTE_ADDR');
        $ip = (string) ($_SERVER[$key] ?? '0.0.0.0');

        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return '0.0.0.0';
        }

        return $ip;
    }

    public function isDefaultPasswordHash(): bool
    {
        $default = (string) ($this->config['password_hash_default'] ?? '');
        $current = (string) ($this->config['password_hash'] ?? '');

        return $default !== '' && $current !== '' && hash_equals($default, $current);
    }

    private function getRateLimitFilePath(): string
    {
        return rtrim((string) $this->config['logs_dir'], '/\\') . '/rate_limit.json';
    }

    public function getSessionRegistryFilePath(): string
    {
        return rtrim((string) $this->config['logs_dir'], '/\\') . '/sessions.json';
    }

    private function getRateLimitConfig(): array
    {
        return [
            'window_sec' => (int) ($this->config['security']['rate_limit']['window_sec'] ?? 900),
            'max_attempts' => (int) ($this->config['security']['rate_limit']['max_attempts'] ?? 5),
            'lockout_sec' => (int) ($this->config['security']['rate_limit']['lockout_sec'] ?? 900),
        ];
    }

    private function getRateLimitState(string $ip): array
    {
        $cfg = $this->getRateLimitConfig();
        $now = time();

        $sessionRate = $_SESSION['admincarrd_login_rate'] ?? ['attempts' => [], 'blocked_until' => 0];
        $sessionRate['attempts'] = array_values(array_filter((array) $sessionRate['attempts'], static function ($ts) use ($now, $cfg) {
            return is_int($ts) && ($now - $ts) <= $cfg['window_sec'];
        }));
        $sessionBlockedUntil = (int) ($sessionRate['blocked_until'] ?? 0);
        $_SESSION['admincarrd_login_rate'] = $sessionRate;

        $ipRate = $this->readIpRate($ip);
        $ipBlockedUntil = (int) ($ipRate['blocked_until'] ?? 0);

        $blockedUntil = max($sessionBlockedUntil, $ipBlockedUntil);

        return [
            'is_blocked' => $blockedUntil > $now,
            'retry_after' => max(0, $blockedUntil - $now),
        ];
    }

    private function registerFailedAttempt(string $ip)
    {
        $cfg = $this->getRateLimitConfig();
        $now = time();

        $sessionRate = $_SESSION['admincarrd_login_rate'] ?? ['attempts' => [], 'blocked_until' => 0];
        $sessionRate['attempts'] = array_values(array_filter((array) $sessionRate['attempts'], static function ($ts) use ($now, $cfg) {
            return is_int($ts) && ($now - $ts) <= $cfg['window_sec'];
        }));
        $sessionRate['attempts'][] = $now;
        if (count($sessionRate['attempts']) >= $cfg['max_attempts']) {
            $sessionRate['blocked_until'] = $now + $cfg['lockout_sec'];
            $sessionRate['attempts'] = [];
        }
        $_SESSION['admincarrd_login_rate'] = $sessionRate;

        $this->updateIpRate($ip, true);
    }

    private function clearRateLimit(string $ip)
    {
        unset($_SESSION['admincarrd_login_rate']);
        $this->updateIpRate($ip, false);
    }

    private function readIpRate(string $ip): array
    {
        $cfg = $this->getRateLimitConfig();
        $now = time();

        $result = $this->withRateLimitStorage(function (array &$data) use ($ip, $cfg, $now): array {
            $entry = $data[$ip] ?? ['attempts' => [], 'blocked_until' => 0];
            $entry['attempts'] = array_values(array_filter((array) $entry['attempts'], static function ($ts) use ($now, $cfg) {
                return is_int($ts) && ($now - $ts) <= $cfg['window_sec'];
            }));
            $entry['blocked_until'] = (int) ($entry['blocked_until'] ?? 0);
            $data[$ip] = $entry;
            return $entry;
        });

        return is_array($result) ? $result : ['attempts' => [], 'blocked_until' => 0];
    }

    private function updateIpRate(string $ip, bool $failedAttempt)
    {
        $cfg = $this->getRateLimitConfig();
        $now = time();

        $this->withRateLimitStorage(function (array &$data) use ($ip, $cfg, $now, $failedAttempt) {
            $entry = $data[$ip] ?? ['attempts' => [], 'blocked_until' => 0];
            $entry['attempts'] = array_values(array_filter((array) $entry['attempts'], static function ($ts) use ($now, $cfg) {
                return is_int($ts) && ($now - $ts) <= $cfg['window_sec'];
            }));

            if ($failedAttempt) {
                $entry['attempts'][] = $now;
                if (count($entry['attempts']) >= $cfg['max_attempts']) {
                    $entry['blocked_until'] = $now + $cfg['lockout_sec'];
                    $entry['attempts'] = [];
                }
                $data[$ip] = $entry;
            } else {
                unset($data[$ip]);
            }

            return null;
        });
    }

    private function withRateLimitStorage(callable $callback)
    {
        $file = $this->getRateLimitFilePath();
        return $this->withJsonStorage($file, $callback);
    }

    private function registerCurrentSessionId(): void
    {
        $sid = session_id();
        if ($sid === '') {
            return;
        }

        $this->withJsonStorage($this->getSessionRegistryFilePath(), static function (array &$data) use ($sid) {
            $data[$sid] = [
                'updated_at' => time(),
            ];
            return null;
        });
    }

    private function unregisterCurrentSessionId(): void
    {
        $sid = session_id();
        if ($sid === '') {
            return;
        }

        $this->withJsonStorage($this->getSessionRegistryFilePath(), static function (array &$data) use ($sid) {
            unset($data[$sid]);
            return null;
        });
    }

    private function withJsonStorage(string $file, callable $callback)
    {
        $dir = dirname($file);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $handle = fopen($file, 'c+');
        if ($handle === false) {
            $data = [];
            return $callback($data);
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                fclose($handle);
                $data = [];
                return $callback($data);
            }

            rewind($handle);
            $raw = stream_get_contents($handle);
            $data = [];
            if (is_string($raw) && trim($raw) !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }

            $result = $callback($data);

            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            fflush($handle);
            flock($handle, LOCK_UN);
            fclose($handle);

            return $result;
        } catch (\Throwable $e) {
            flock($handle, LOCK_UN);
            fclose($handle);
            throw $e;
        }
    }

    public function redirect(string $path)
    {
        header('Location: ' . $path);
        exit;
    }
}
