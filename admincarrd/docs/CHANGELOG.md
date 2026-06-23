# AdminCarrd Changelog

## [2.1.0] — 2026-04-30

### Structure
- **Root minimized**: public root now keeps only `index.php`, `router.php`, `.htaccess`, `AGENTS.md`, and folders. Page handlers moved to `app/pages`, libraries to `app/lib`, config to `app/config`, docs to `docs`, runtime state to `var`, and CSS to `assets`.
- **Legacy page URLs preserved**: `/login.php`, `/setup.php`, `/config-ui.php`, `/change-password.php`, `/process.php`, `/reset.php`, and `/logout.php` are routed through the front controller.
- **Remote browser installer**: добавлен сборщик `npm run build:admincarrd-installer`, который создаёт `install.php` и `admincarrd-package.zip` для установки/обновления на shared hosting без SSH.

### Compression Policy
- **HTML minification disabled by default**: `index.html` больше не минифицируется в штатном `transform_mode=3`; режим теперь означает `WebP + минификация CSS/JS`.
- **Regression tests for admincarrd optimizer**: добавлен автоматический test harness для CSS/JS compression policy и проверки, что HTML остаётся неизменным.

### Reset Semantics
- **Full reset now removes derived runtime artifacts**: удаляются `rate_limit.json`, `upload_rate_limit.json`, `sessions.json`, `logs/.tmp_sweep` и содержимое `uploads/tmp`, `uploads/original-backups`, `uploads/publish-backups`, при этом защитные `.htaccess` сохраняются.
- **Setup-token no longer auto-reappears after reset**: после полного reset редирект идёт на `setup.php?reset=1`, где новый `var/setup/setup-token.txt` создаётся только по явной кнопке пользователя.

### Безопасность
- **Optimistic locking для `config.php`**: setup, смена пароля, reset и Config UI теперь проверяют fingerprint конфигурации перед записью и не перетирают чужие изменения молча.
- **CSP и security headers**: через `lib/bootstrap.php` добавлены `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, а также `X-Request-Id`.
- **`logout.php` переведён на общий bootstrap flow**, чтобы entry points подчинялись единой инициализации и security headers.

### Надёжность
- **Runtime limit 120s**: добавлены `.user.ini` и guarded `.htaccess php_value` defaults для `max_execution_time=120`, `max_input_time=120`, upload/post limits; runtime report теперь показывает effective `php_max_execution_time` после `set_time_limit()`.
- **Observability**: у каждой операции появился `request_id`; он пишется в заголовок ответа, отчёт UI и runtime-логи.
- **Stage reporting**: отчёт и лог теперь содержат `stages` и `runtime`, включая диагностику `set_time_limit()` и риска внешнего таймаута PHP/FPM.
- **Консервативная минификация JS**: если код выглядит рискованным для упрощённого минификатора, минификация пропускается с предупреждением вместо возможной порчи output.
- **Retention policy для backup-артефактов**: можно сохранять предыдущую опубликованную версию в `var/uploads/publish-backups/`, а оригиналы изображений — в `var/uploads/original-backups/` с TTL-очисткой.
- **Locale/timezone теперь действительно применяются через bootstrap** из `config.php`.

### UX
- **Drag-and-drop загрузка ZIP** на `index.php`.
- **Более подробный post-run отчёт**: request ID, stage-by-stage статус, runtime-диагностика.

### Документация
- Добавлен локальный `admincarrd/AGENTS.md` как машиночитаемый канон модуля.
- Полностью обновлён `admincarrd/docs/README.md` под актуальный setup/auth/publish flow.

## [2.0.0] — 2026-04-30

### Безопасность
- **Атомарная запись `config.php`** через `ConfigWriter` (`flock` + `tempnam` + `rename`) — устраняет race conditions и риск повреждения файла.
- **Защита первого запуска**: страница `setup.php` требует одноразовый `setup-token.txt`. Файл создаётся автоматически при первом обращении и удаляется после успешной установки пароля.
- **IP-биндинг сессии**: `Auth::isLoggedIn()` отвергает сессию, если IP сменился (отключается через `security.bind_session_to_ip`).
- **Версия пароля в сессии**: при смене пароля все остальные активные сессии становятся невалидными.
- **Защита логов и rate-limit от прямого HTTP-доступа**: усиленный `logs/.htaccess`, новый `lib/.htaccess` и `router.php` для встроенного `php -S`.
- **Защита от zip bomb**: при распаковке `stream_copy_to_stream` заменён на потоковое чтение с проверкой фактического объёма (не доверяем `stat['size']`).
- **HTTPS за прокси**: cookie сессии помечается `secure` также при `X-Forwarded-Proto: https`.
- **`setup-token.txt`** теперь блокируется в `.htaccess` и в `router.php`.

### Надёжность
- **Atomic publish** с rollback: целевая папка переименовывается в `.bak`, копируется новое содержимое, при ошибке — возврат backup на место.
- **Cleanup `uploads/tmp/`**: автоматическая очистка zombie-файлов старше 24 часов (раз в час, маркер в `logs/.tmp_sweep`).
- **Лимит ввода `allowed_targets`**: 16 KB сырого текста, 100 записей; защита от ReDoS в `preg_replace_callback`.
- **Валидация `allowed_targets`**: предупреждение если папка не существует, но сохранение разрешено.

### UX
- Кнопки **«Показать пароль»** на формах входа и смены пароля.
- Подтверждение публикации с указанием конкретного пути.
- Состояние кнопки `Загружаем…` со спинером, защита от двойного submit.
- Страница **Config** объединяет: Allowed Targets, Логи (просмотр/скачивание/очистка), Опасную зону (общий сброс).

### Архитектура
- Новый `lib/bootstrap.php` — единая обвязка (config + session + auth gate + setup gate).
- Новый `lib/ConfigWriter.php` — безопасная замена значений в `config.php`.
- Новый `lib/SetupToken.php` — управление setup-токеном.
- Новый `router.php` для разработки (`php -S … router.php`).
- Удалён мёртвый код: `Auth::isInitialPassword`, `mustChangePassword`, `clearMustChangePassword`, `password_hash_initial`.
- Удалён устаревший `logs.php` (заменён страницей `config-ui.php`).

## [1.x]
- Базовая версия: загрузка ZIP, WebP-конвертация, минификация, публикация. Авторизация по паролю, CSRF, rate-limit.
