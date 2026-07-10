# Dual-Repo Migration Plan — carrd-v2 (private) + carrd-plugins-2 (public, dist-only)

## Проблема

`popskraft/carrd-v2` сейчас полностью публичный: в нём открыты `src/`, `cardbuilder/`, `admincarrd/`, `docs/`, весь исходный код и внутренние данные — не только `dist/`. Это неправильно, т.к. jsDelivr CDN раздаёт файлы прямо из GitHub, а значит весь репозиторий обязан быть публичным ради нескольких `dist/*.min.js` файлов.

Важное уточнение: легаси-репозиторий `popskraft/carrd-plugins` (v1) **тоже** содержит `src/` публично — это не образец схемы «наружу отдаём только dist». Т.е. паттерн «чистый dist-репозиторий» ещё не был реализован ни в v1, ни в v2. Его нужно построить с нуля для v2.

## Целевая архитектура

- `popskraft/carrd-v2` → **приватный**. Источник истины: `src/`, `docs/`, `cardbuilder/`, `admincarrd/`, скрипты, тесты. Здесь же собирается `dist/`.
- `popskraft/carrd-plugins-2` → **новый публичный** репозиторий. Содержит только снимок `dist/` (плюс минимальный public README). Это единственный репозиторий, с которого раздаётся jsDelivr CDN для v2-сайтов.
- Легаси `popskraft/carrd-plugins` (v1) не трогаем — остаётся замороженным как есть, старые сайты продолжают получать файлы оттуда.

```
carrd-v2 (private)              carrd-plugins-2 (public)
├── src/               build →  └── dist/  ← это и есть CDN root
├── docs/, cardbuilder/,                (jsDelivr: cdn.jsdelivr.net/gh/popskraft/carrd-plugins-2@X.Y.Z/*)
│   admincarrd/, scripts/, tests/
└── dist/  (тоже собирается тут,
    но не отдаётся наружу как публичный CDN)
```

## Критический риск: живые сайты уже используют CDN-ссылки на carrd-v2

`cdn.jsdelivr.net/gh/popskraft/carrd-v2@2.0.0/...` и `@2.1.0/...` — уже опубликованные immutable-теги, на них уже смотрит как минимум `main-template` (см. `cardbuilder/projects/main-template/...`). Если `carrd-v2` станет приватным без переноса этих версий в новый публичный репозиторий, jsDelivr перестанет отдавать эти файлы (кэш может продержаться какое-то время, но не гарантированно) — **опубликованные сайты сломаются**.

Поэтому перевод в private не может быть первым шагом. Порядок обязателен: сначала публичный dist-репозиторий и перенос действующих ссылок → потом приватность.

## Пошаговый план

### Фаза 0 — подготовка (можно сделать уже сейчас, без риска)
1. Создать GitHub-репозиторий `popskraft/carrd-plugins-2`, публичный, пустой.
2. Сгенерировать `DIST_PUSH_TOKEN` — fine-grained PAT с правом `contents:write` только на `carrd-plugins-2` — добавить как Actions secret в `carrd-v2`.

### Фаза 1 — перенос текущего и прошлых релизов dist/ в новый репозиторий
3. Вручную (одноразово) запушить в `carrd-plugins-2` содержимое `dist/` для каждого существующего release-тега `carrd-v2`: `v2.0.0` и `v2.1.0` — как отдельные коммиты + такие же git tags `v2.0.0`, `v2.1.0` в новом репозитории. Это гарантирует, что уже выданные ссылки `@2.0.0` / `@2.1.0` продолжат резолвиться, только из нового репо.
   - Реализация: `git checkout v2.0.0 -- dist` → закоммитить в `carrd-plugins-2` → тег `v2.0.0`; повторить для `v2.1.0`.
4. Обновить `dist/theme-*-cdn.html`, `dist/*/*-cdn.html` и все сгенерированные сниппеты, чтобы они ссылались на `carrd-plugins-2`, а не `carrd-v2` (правится в `scripts/templates/` и/или `scripts/minify_plugins.py`, где формируются CDN-URL).

### Фаза 2 — автопубликация dist/ в CI (выбранный вариант: GitHub Action)
5. В `carrd-v2` добавить job в `.github/workflows/ci.yml` (или отдельный workflow `publish-dist.yml`):
   - Триггер: push в `main` с изменениями в `dist/**`, и отдельно — push git tag `v*` (релиз).
   - Шаги: checkout `carrd-v2`, checkout `carrd-plugins-2` в соседнюю папку с `DIST_PUSH_TOKEN`, `rsync -a --delete dist/ ../carrd-plugins-2/dist/`, commit + push. На релизный тег — дополнительно создать такой же git tag в `carrd-plugins-2`.
   - Синк — чистый снепшот (без переноса истории коммитов `carrd-v2`, как договорено): один коммит "sync dist @ <version>" каждый раз.

### Фаза 3 — обновить канон-документы
6. `docs/specs/repository-architecture-plan.md` — заменить схему на three-repo model: `carrd-plugins` (legacy, public, frozen), `carrd-v2` (private, source), `carrd-plugins-2` (public, CDN delivery only).
7. `docs/specs/release-contract.md` — все `cdn.jsdelivr.net/gh/popskraft/carrd-v2@...` примеры заменить на `carrd-plugins-2`; добавить шаг «после `git push origin vX.Y.Z` в `carrd-v2` дождаться, что Action синхронизировал `dist/` и tag в `carrd-plugins-2`, прежде чем открывать jsDelivr URL».
8. `AGENTS.md`, `README.md`, `dist/README.md`, generated CDN snippets (`scripts/templates/*.html`) — обновить repo-имя.

### Фаза 4 — перенести живые ссылки на сайтах
9. Найти все Carrd-сайты (начиная с `main-template`, см. `cardbuilder/projects/main-template/`), у которых есть embed-ссылки на `carrd-v2` — заменить на такой же тег в `carrd-plugins-2`, опубликовать, пройти post-publish smoke (см. `release-contract.md`).

### Фаза 5 — сделать carrd-v2 приватным
10. Только после того как Фазы 1–4 подтверждены (новые ссылки резолвятся, старые сайты обновлены) — переключить видимость `popskraft/carrd-v2` на Private в Settings → General → Danger Zone.
11. Проверить: `cdn.jsdelivr.net/gh/popskraft/carrd-v2@...` теперь недоступен (ожидаемо), а `cdn.jsdelivr.net/gh/popskraft/carrd-plugins-2@...` отдаёт тот же контент.

### Фаза 6 — валидация
12. Прогнать `pnpm run validate`, `pnpm run verify:dist` в `carrd-v2`.
13. Открыть в браузере пару CDN-урлов из `carrd-plugins-2` для каждого существующего тега.
14. Обновить `ROADMAP.md` / `OPEN-QUESTIONS.md` статусом миграции.

## Что не трогаем
- `popskraft/carrd-plugins` (v1, legacy) — остаётся публичным и как есть.
- Существующие release-теги/immutable ссылки — не перемещаем, не force-push.

## Что нужно сделать вне этой сессии (Claude Code / вручную)
- Создание репозитория `carrd-plugins-2` на GitHub (`gh repo create`).
- Генерация и добавление `DIST_PUSH_TOKEN` в Settings → Secrets.
- Переключение видимости `carrd-v2` в Private (ручное действие в GitHub UI, требует финального подтверждения владельца — это publication/production action).
- Правки в Carrd Builder (публикация сайтов) — через `cardbuilder` automation или руками в самом Carrd.

## Открытые вопросы
- Нужно ли также ограничить видимость `cardbuilder/`, `admincarrd/` отдельно (например, если когда-то потребуется отдать доступ подрядчику только к `src/` плагинов) — не в скоупе этой миграции, можно отдельным вопросом в `OPEN-QUESTIONS.md`.
