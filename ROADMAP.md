# ROADMAP.md

## CURRENT STATUS
- Where we are: `switcher` blockers закрыты, `dist` синхронизирован, в `cardbuilder` уже есть live-site registry, per-site profiles, `resolve-site`, `check-element-tabs-drift`, и `check-site-readiness`, а root docs system переехала на `docs/` как active durable-docs root.
- Latest change: repo architecture переопределена под two-runtime модель: `popskraft/carrd-v2` остаётся frozen legacy CDN repo для старых сайтов, а новая раздача v2 должна идти через отдельный `popskraft/carrd-v2` с v2 plugin names, artifacts, globals и snippets.
- Main risks: Нельзя переименовывать или заменять `popskraft/carrd-v2`, потому что старые Carrd-сайты уже завязаны на его jsDelivr paths; для v2 нужно не допустить смешивания legacy URLs, globals и markup attrs.
- Next step: подготовить `popskraft/carrd-v2`: создать repo, применить `*-v2` naming policy к plugin slugs/artifacts/globals/snippets и обновить build/purge config на `popskraft/carrd-v2@main`.

## GOALS
- Goal 1: Поддерживать единый канон документации в `docs/` и держать `_docs/` только как legacy bridge.
- Goal 2: Держать ссылки и правила актуальными после структурных изменений.
- Goal 3: Минимизировать дублирование и расхождение между operational docs.

## ROADMAP
### Phase 1
- [x] Зафиксировать `docs/` как active durable-docs root.
- [x] Добавить `docs/INDEX.md`, `docs/specs/`, `docs/templates/` и `docs/research/`.
- [x] Нормализовать root `AGENTS.md`, `README.md`, `CLAUDE.md` и `DEFINITION-OF-DONE.md` под mini-office layout.

### Phase 2
- [ ] Провести выборочную cleanup-ревизию historical/aux docs на legacy-ссылки `docs/`.
- [ ] При необходимости сверить legacy `_docs` bridge-пойнтеры с новыми owner-доками.
- [ ] Формализовать per-site profile contract и capability matrix для `cardbuilder`, чтобы multi-site Carrd automation не зависела от одного `active-template`.
- [ ] Создать `popskraft/carrd-v2` как отдельный runtime repo для второй версии.
- [ ] Формализовать v2 publication contract, не затрагивая legacy `popskraft/carrd-v2`.

### Phase 3
- [x] Спроектировать `switcher` plugin contract по реальной структуре `carrd-source`.
- [x] Реализовать `switcher` plugin, тесты, dist-сборку и включение в bundle.
- [x] Проверить `switcher` на рабочем Carrd-сайте, включая `cluster`-режим.
- [x] Задеплоить полный `switcher` plugin после live-теста.
- [x] Добавить per-instance настройки для разных `data-switcher-v2` наборов.
- [x] Добавить per-plugin CDN snippets в публичный `dist/` для индивидуального подключения через jsDelivr.
- [x] Упростить документацию CDN-установки: единый `*-cdn.html` на плагин и `theme-core-v2-cdn.html` вместо split `head/body` файлов.
- [x] Перевести общий CDN bundle на `core-first` состав и вынести тяжёлые/опциональные плагины в отдельное подключение.
- [ ] Проверить live-синхронизацию нескольких controllers с одинаковым `data-switcher-v2`.
- [ ] Проверить live cluster-переключение целых containers через `data-switcher-v2-cluster`.
- [ ] Проверить `accordeon` на рабочем Carrd-сайте на группе `ppf`.

### Phase 4
- [x] Зафиксировать v2 data-plugin contract как основной setup path для grouped plugins.
- [x] Добавить backward-compatible runtime поддержку `data-slider-v2`, `data-grid-v2`, `data-switcher-v2-target`, `#data-accordeon-v2-*`, `#data-modal-v2-*` и `data-cards-v2`.
- [x] Нормализовать public naming scheme: plugin-prefixed option attrs, `data-modal-v2-open`, named `data-cookie-v2` и named `data-floating-v2`, с legacy fallback.
- [x] Перевести `floating-cta` на named `data-floating-v2="<name>"`, шесть `data-floating-v2-position` значений и `data-floating-v2-hide`.
- [x] Добавить mobile-only override для `floating-cta` через `data-floating-v2-position-mobile`.
- [x] Поднять `header-nav` toggle выше `floating-cta` в stack order.
- [x] Перевести `cookie-banner` на named `data-cookie-v2="<name>"` и добавить data-driven indent для desktop/mobile.
- [x] Перевести `faq` на `data-faq-v2="<name>"` и убрать устаревший public config surface из docs/defaults.
- [x] Пересобрать generated `dist` после source README/runtime изменений.
- [ ] Проверить promoted `header-nav` anti-jump mobile collapse на рабочем Carrd-сайте.
- [ ] Создать legacy freeze branch/tag в `popskraft/carrd-v2` перед v2 rollout.
