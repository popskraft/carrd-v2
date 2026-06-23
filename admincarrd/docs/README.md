# AdminCarrd

Локальная точка входа для модуля: `admincarrd/AGENTS.md`.
Пользовательская документация хранится в `admincarrd/docs/`, чтобы корень модуля оставался минимальным.

`admincarrd` — отдельная мини-админка для безопасной загрузки ZIP-архивов Carrd-шаблонов, их проверки, опциональной оптимизации и публикации в разрешённые директории.

## Назначение

Модуль делает следующее:

1. принимает ZIP-архив;
2. проверяет обязательную структуру:
   - `index.html`
   - `assets/main.css`
   - `assets/main.js`
3. может конвертировать изображения `png/jpg/jpeg` в `webp`;
4. может обновлять ссылки в HTML/CSS/JS на `.webp`;
5. может минифицировать CSS/JS в безопасном режиме;
6. публикует результат только в разрешённый `target-path`.

## Архитектура

Основные entry points:

- `index.php` — front controller в корне;
- `app/pages/setup.php` — первый запуск;
- `app/pages/login.php` — вход;
- `app/pages/dashboard.php` — загрузка и публикация;
- `app/pages/change-password.php` — смена пароля;
- `app/pages/config-ui.php` — allowed targets, логи, reset;
- `app/pages/reset.php` — полный сброс состояния.

Основные библиотеки:

- `app/lib/bootstrap.php` — единая инициализация, security headers, locale/timezone, request id;
- `app/lib/Auth.php` — сессии, логин, rate-limit, IP-binding, password-version invalidation;
- `app/lib/Csrf.php` — CSRF-защита;
- `app/lib/ConfigWriter.php` — атомарная и потокобезопасная запись `app/config/config.php`, включая optimistic locking;
- `app/lib/Optimizer.php` — распаковка, проверка, конвертация, минификация, публикация, rollback, логи;
- `app/lib/SetupToken.php` — одноразовый setup-token первого запуска.

## Первый запуск

1. Откройте `https://YOUR-DOMAIN/admincarrd/setup.php`.
2. На сервере прочитайте файл `admincarrd/var/setup/setup-token.txt`.
3. Вставьте токен в форму `setup.php`.
4. Установите новый пароль.
5. После успешного setup:
   - `setup_complete` станет `true`;
   - `password_hash` запишется в `app/config/config.php`;
   - `setup-token.txt` удалится автоматически;
   - дальнейший вход пойдёт через `login.php`.

Важно:

1. `app/config/config.php` больше не предполагает ручную правку для штатной первичной установки.
2. `password_hash_default` — технический sentinel и не должен использоваться как рабочий пароль.
3. `app/*`, `var/*`, `docs/*`, legacy `setup-token.txt` и legacy `config.php` должны оставаться недоступными по HTTP.

## Работа через UI

1. Откройте `/admincarrd/login.php`.
2. Войдите установленным паролем.
3. На `/admincarrd/index.php`:
   - выберите ZIP или перетащите его в dropzone;
   - выберите путь публикации;
   - выберите режим обработки;
   - подтвердите публикацию.
4. После завершения проверьте отчёт:
   - request id;
   - timings по этапам;
   - предупреждения;
   - ошибки;
   - путь публикации;
   - статус backup/originals при наличии.

### Режимы обработки

1. `Без изменений: только размещение`
   - без WebP;
   - без минификации.
2. `Без минификации: WebP + замена ссылок`
   - WebP;
   - обновление ссылок;
   - без минификации HTML/CSS/JS.
3. `Полная обработка: WebP + минификация CSS/JS`
   - WebP;
   - обновление ссылок;
   - безопасная минификация CSS/JS.

Важно:

`index.html` сейчас по умолчанию не минифицируется. Политика модуля — не менять HTML страницы в штатном production flow.

Рекомендация:

Для очень тяжёлых архивов и shared hosting чаще безопаснее использовать режим `1`, чтобы уменьшить риск внешнего таймаута PHP/FPM.

## Runtime-лимиты

Модуль рассчитан на целевой лимит обработки `120` секунд:

1. `optimizer.target_timeout_sec = 120` в `app/config/config.php`;
2. `set_time_limit(120)` вызывается перед обработкой архива;
3. `.user.ini` задаёт `max_execution_time=120`, `max_input_time=120`, `upload_max_filesize=100M`, `post_max_size=110M` для PHP-FPM/CGI окружений;
4. `.htaccess` задаёт те же значения для Apache `mod_php7/mod_php8`, если сервер разрешает `php_value`.

Если хостинг запрещает локальные overrides, итоговый лимит всё равно задаётся глобальной конфигурацией сервера или панели хостинга.

## Самоустанавливающийся пакет

Для установки на удалённом сервере без SSH используйте browser installer.

Сборка свежего installer-пакета после правок:

```bash
npm run build:admincarrd-installer
```

Команда создаёт:

1. `_build/admincarrd-installer/install.php`;
2. `_build/admincarrd-installer/admincarrd-package.zip`.

Установка на сервере:

1. Загрузите оба файла в корень сайта рядом друг с другом.
2. Откройте `https://YOUR-DOMAIN/install.php`.
3. Оставьте путь установки `admincarrd` или задайте свой относительный путь.
4. Для новой установки задайте пароль администратора.
5. После успеха откройте `/admincarrd/login.php`.
6. Удалите с сервера `install.php`, `admincarrd-package.zip` и `admincarrd-install.lock`.

Обновление существующей установки:

1. Соберите свежий installer-пакет.
2. Загрузите новые `install.php` и `admincarrd-package.zip` на сервер.
3. Откройте `install.php`.
4. Укажите тот же путь установки.
5. Отметьте режим update.

В режиме update сохраняются существующие `app/config/config.php` и `var/`, поэтому пароль, allowed targets, логи и runtime-состояние не перетираются.

## Безопасность

В модуле должны сохраняться следующие инварианты:

1. Все page handlers загружаются через `app/lib/bootstrap.php`.
2. Все POST-формы защищены CSRF.
3. Смена и первичная установка пароля используют `ConfigWriter`, а не прямую запись в `app/config/config.php`.
4. Для чувствительных изменений используется optimistic locking по fingerprint `app/config/config.php`.
5. Сессия имеет:
   - `httponly`
   - `samesite=Lax`
   - `secure`, когда запрос идёт по HTTPS или через proxy headers
6. Авторизация включает:
   - rate-limit по сессии и IP;
   - TTL сессии;
   - optional IP-binding;
   - инвалидирование старых сессий после смены пароля.
7. Для HTTP-ответов добавляются security headers, включая CSP и `X-Request-Id`.
8. Доступ к чувствительным путям блокируется и через `.htaccess`, и через `router.php` для `php -S`.

## Требования к ZIP

Разрешено:

1. только `.zip`;
2. размер до лимита `upload.max_bytes`;
3. структура с `index.html`, `assets/main.css`, `assets/main.js`.

Запрещено и блокируется:

1. path traversal;
2. symlink внутри ZIP;
3. zip bomb / подозрительно большой распакованный объём;
4. публикация в путь вне allowlist/автоскан-правил.

## Публикация и backup-политика

1. Для обычных target-папок публикация идёт через `backup -> copy -> rollback on failure`.
2. Предыдущая версия целевой папки может сохраняться в `var/uploads/publish-backups/`.
3. Оригиналы изображений перед удалением могут сохраняться в `var/uploads/original-backups/`.
4. Старые backup-артефакты очищаются по TTL из `app/config/config.php`.
5. При публикации в `/` дополнительно блокируются dotfiles и `publish.protected_root_files`.

## Allowed Targets

1. Если `publish.allowed_targets` непустой, он является строгим allowlist.
2. Если список пустой, используется автоскан project root по правилам `discover_from_root`.
3. В UI действуют лимиты:
   - максимум 16 KB исходного текста;
   - максимум 100 путей.
4. Несуществующие директории допускаются к сохранению как предупреждение, а не как фатальная ошибка.

## Логи и наблюдаемость

1. Runtime logs: `admincarrd/var/logs/YYYY-MM-DD.log`
2. Login rate-limit: `admincarrd/var/logs/rate_limit.json`
3. Upload rate-limit: `admincarrd/var/logs/upload_rate_limit.json`
4. В логах и отчёте сохраняются:
   - `request_id`
   - итоговый `status`
   - `target_path`
   - `duration_sec`
   - `timings_sec`
   - `stages`
   - `runtime`
   - количество предупреждений и ошибок

## Config UI

`config-ui.php` — каноничная maintenance-страница модуля.

Там находятся:

1. редактирование `allowed_targets`;
2. просмотр и скачивание логов;
3. удаление логов;
4. полный reset состояния.

## Полный reset

`reset.php` делает следующее:

1. очищает login/upload rate-limit state;
2. удаляет все производные runtime-файлы:
   - `.log`
   - `rate_limit.json`
   - `upload_rate_limit.json`
   - `sessions.json`
   - `var/logs/.tmp_sweep`
3. очищает содержимое служебных каталогов:
   - `var/uploads/tmp/`
   - `var/uploads/original-backups/`
   - `var/uploads/publish-backups/`
   - защитные `.htaccess` при этом сохраняются
4. сбрасывает:
   - `setup_complete=false`
   - `password_hash=''`
   - `allowed_targets=[]`
5. удаляет `setup-token.txt`;
6. завершает текущую и файловые сессии AdminCarrd;
7. перенаправляет на `setup.php?reset=1`.

После такого перенаправления новый `setup-token.txt` не создаётся автоматически. Страница покажет, что сброс завершён, и предложит явно создать новый setup-token для следующей установки.

## Что проверять после изменений

Минимум:

```bash
php -l admincarrd/*.php
php -l admincarrd/app/pages/*.php
php -l admincarrd/app/lib/*.php
php -l admincarrd/app/config/config.php
```

Если менялась защита путей:

```bash
sed -n '1,200p' admincarrd/.htaccess
sed -n '1,200p' admincarrd/app/.htaccess
sed -n '1,200p' admincarrd/var/.htaccess
sed -n '1,200p' admincarrd/docs/.htaccess
sed -n '1,220p' admincarrd/router.php
```

Если менялись setup/auth/config flow:

1. `setup_complete=false` ведёт на `setup.php`;
2. успешный setup удаляет `setup-token.txt`;
3. успешный login ведёт на `index.php`;
4. защищённые страницы требуют активную сессию;
5. смена пароля инвалидирует старые сессии.

## Если что-то не работает

Проверьте:

1. расширения PHP:
   - `zip`
   - `gd`
   - `imagick` опционально
2. права записи на:
   - `admincarrd/var/logs`
   - `admincarrd/var/uploads/tmp`
   - `admincarrd/var/uploads/original-backups`
   - `admincarrd/var/uploads/publish-backups`
3. лимиты PHP:
   - `upload_max_filesize`
   - `post_max_size`
   - `memory_limit`
   - `max_execution_time`

## Regression Tests

Для compression policy и regression-проверок модуля есть автоматические тесты:

```bash
python3 -m unittest tests.test_admincarrd_optimizer
```

Они проверяют:

1. минификацию CSS;
2. консервативное поведение JS-минификатора;
3. пропуск risky JS;
4. что при `transform_mode=3` HTML остаётся неизменным, а CSS/JS обрабатываются.
