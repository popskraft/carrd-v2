# ROADMAP.md

## CURRENT STATUS
- Where we are: `carrd-v2` существует как отдельный runtime repo, source/dist используют `*-v2` slugs, `theme-core-v2`, `Carrd*V2` globals и `popskraft/carrd-v2@main` snippets.
- Latest change: применены audit fixes для `shopping-cart-v2`, `slider-v2`, `modal-v2`, `faq-v2`, `cookie-banner-v2`; root/docs canon очищен от legacy drift.
- Main risks: legacy `popskraft/carrd-plugins` нужно freeze/tag перед v2 rollout; публикация и jsDelivr purge требуют отдельного внешнего действия.
- Next step: после подтверждения выполнить publication gate: freeze legacy `popskraft/carrd-plugins`, затем push/purge validated `popskraft/carrd-v2`.

## GOALS
- Goal 1: Поддерживать единый канон документации в `docs/` и не возвращать legacy `_docs/`.
- Goal 2: Держать ссылки и правила актуальными после структурных изменений.
- Goal 3: Минимизировать дублирование и расхождение между operational docs.

## ROADMAP
### Phase 1
- [x] Зафиксировать `docs/` как active durable-docs root.
- [x] Добавить `docs/INDEX.md`, `docs/specs/`, `docs/templates/` и `docs/research/`.
- [x] Нормализовать root `AGENTS.md`, `README.md`, `CLAUDE.md` и `DEFINITION-OF-DONE.md` под mini-office layout.

### Phase 2
- [x] Провести cleanup-ревизию root/docs на legacy path drift.
- [x] Удалить obsolete root bridge `BREAKPOINTS.md`; owner is `docs/specs/breakpoints-contract.md`.
- [x] Создать `popskraft/carrd-v2` как отдельный runtime repo для второй версии.
- [x] Формализовать v2 publication contract, не затрагивая legacy `popskraft/carrd-plugins`.
- [ ] Freeze/tag legacy `popskraft/carrd-plugins` delivery state before public v2 rollout.
- [ ] Push validated `popskraft/carrd-v2` and purge only v2 jsDelivr paths.

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
- [x] Применить audit fixes: shopping-cart text escaping, slider ARIA region label, modal refresh API, FAQ rAF height adjustment, cookie Secure flag.
- [ ] Проверить promoted `header-nav` anti-jump mobile collapse на рабочем Carrd-сайте.
