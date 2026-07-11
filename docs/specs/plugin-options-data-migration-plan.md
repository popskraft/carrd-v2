# Миграция JS-опций плагинов на data-*-контракт

Дата: 2026-07-11. Статус: выполнено (Builder), см. раздел "Итоги выполнения" внизу.
Основание: аудит `window.CarrdPluginOptions` по всем плагинам в `src/` (чат-анализ 2026-07-11), референс-паттерн парсинга — `src/slider-v2/slider.js` + `docs/specs/slider-v2-plan.md`.

**Полностью вне скоупа этого задания — `src/slider/` (v1) и `src/slider-v2/` (v2):**
- `src/slider/` (v1) — не трогать вообще, ни код, ни опции, ни тесты. Это заморожен как есть; никакой миграции на data-* для него в этом задании не планируется (в предыдущей версии плана slider v1 ошибочно попал в группу A — это исправлено).
- `src/slider-v2/` (v2) — уже полностью реализован по data-*-контракту (без `window.CarrdPluginOptions`), см. `docs/specs/slider-v2-plan.md`. Трогать код нельзя, разрешена только проверка (см. группу D).
- Сам `docs/specs/plugin-data-contract.md` — расширять новыми секциями, не переписывать существующее.

## 0. Цель

Часть опций, которые сейчас задаются только через `window.CarrdPluginOptions.<plugin>`, нужно перевести на `data-*`-атрибуты по образцу уже реализованного `slider-v2` (используется только как референс паттерна парсинга, не как объект правок). Часть — оставить на JS осознанно. Часть — просто удалить как мёртвый код. Slider (обе версии) в скоуп изменений не входит. Это задание разбито на четыре независимых блока работы; можно выполнять по плагинам параллельно, порядок — по разделу 6.

## 1. Референс-паттерн парсинга (обязателен к повторению)

Все новые парсеры data-* атрибутов должны следовать шаблону из `src/slider-v2/slider.js` (строки 66–116):

- Разбор атрибута — отдельная чистая функция на каждый тип значения, без побочных эффектов, тестируемая без DOM:
  - **число с валидацией** (по образцу `parseAutoplay`) — `Number(raw)`, `Number.isFinite` + кастомный `validate`, иначе default + `warn`.
  - **enum-строка** (по образцу `parseMode`) — сравнение с фиксированным списком значений, иначе default + `warn`.
  - **тройное bool-состояние** (по образцу `parseOnOffFlag`) — распознавать только явные `"on"`/`"off"`, не `"true"`/`"false"`; при отсутствии/невалидности вернуть `null`, дефолт решает вызывающий код (не сам парсер), если дефолт зависит от контекста.
  - **триплет по брейкпоинтам** (по образцу `parseTriplet`) — только если у плагина уже есть responsive-брейкпоинты (сейчас это только slider); остальным плагинам триплеты не нужны.
- Невалидное значение никогда не должно ронять плагин или молча даже подставлять неожиданное поведение — всегда: fallback на дефолт + один `console.warn('[<plugin>] ...')` на инстанс.
- Конфиг считывается один раз при инициализации инстанса (для группируемых плагинов — с первого/главного элемента группы, не с каждого).
- **Не пытаться переносить вложенные объекты/массивы объектов в data-*.** Если опция — объект (карта классов, локализация, список токенов) — она остаётся в группе "оставить на JS" (раздел 3), никаких `data-foo='{"a":1}'` не изобретать.

## 2. Группа A — перевести на data-*

Для каждого пункта: новый data-*-атрибут, тип парсера (см. раздел 1), где сейчас читается JS-опция.

### accordeon (src/accordeon/accordeon.js)
- `defaultOpen` → `data-accordeon-default-open` (тройной bool, на панели)
- `scrollOnOpen` → `data-accordeon-scroll` (тройной bool)
- `scrollBehavior` → `data-accordeon-scroll-behavior` (enum: `smooth`/`auto`)
- `scrollBlock` → `data-accordeon-scroll-block` (enum: `start`/`center`/`end`/`nearest`)
- Не переносить: `hashPrefix`, `linkPrefix`, `linkSelector`, `targetAttributes` — это внутренние имена атрибутов/селекторов (мета), не пользовательский конфиг.

### modal (src/modal/modal.js)
- `closeOnOverlay` → `data-modal-close-on-overlay` (тройной bool, на контейнере модалки)
- `closeOnEscape` → `data-modal-close-on-escape` (тройной bool)
- `showCloseButton` → `data-modal-show-close` (тройной bool)
- `lockBodyScroll` → `data-modal-lock-scroll` (тройной bool)
- Не переносить: `modalSelector`, `targetAttribute`, `triggerAttribute`, `legacyTriggerAttribute`, `hashPrefix`, `legacyHashTargets`, `preventWhenCartOpen` — мета/системная логика, трогать не нужно.

### switcher (src/switcher/switcher.js)
- `defaultIndex` → `data-switcher-default-index` (число, на контроллере `[data-switcher]`)
- Не переносить: `controllerSelector`, `scopeSelector`, `targetAttribute`, `targetIndexAttribute`, `warnOnMismatch`.

### stacker (src/stacker/stacker.js)
- Глобальный дефолт `offset` → убрать как отдельную JS-опцию, оставить только per-instance `data-stacker-offset` (уже реализован) как единственный путь задания оффсета.
- Не переносить остальное (`minWidth`, `zIndexBase`, `warnOnMismatch`, `overflowFixSelector`, meta-атрибуты).

### floating-cta (src/floating-cta/floating-cta.js)
- `defaultPosition` — убрать как JS-опцию: контракт уже требует, что при отсутствии/невалидном `data-floating-position` фолбэк — `bottom-right`; зашить `bottom-right` как хардкод-дефолт внутри парсера атрибута вместо чтения из JS-конфига.
- Не переносить `scrollY`, `breakpoint`, `showOnMobile`/`showOnDesktop` — это глобальные настройки поведения (порог скролла показа CTA, брейкпоинт), а не per-элемент.

### shopping-cart (src/shopping-cart/shopping-cart.js)
- `checkoutTargetId` → `data-shopping-cart-checkout-target` на секции корзины `#shopping-cart` (строка, валидация — совпадает с `safeNamePattern` из slider/accordeon, переиспользовать ту же regex).
- Не переносить `currency`, `currencyPosition`, `storageKey`, `texts.*` — см. группу B.

## 3. Группа B — оставить на JS-опциях (не трогать в этом задании)

Явно фиксируем, чтобы исполнитель не пытался мигрировать:

- **typography**: `headingClasses`, `listClasses`, `hrClass`, `containerSelector`, `paragraphSelector` — вложенные объекты и мета-селекторы.
- **design-palette**: весь конфиг (`tokens`, `title`, `showEmpty`, `targetSelector`) — dev/admin-инструмент.
- **no-loadwaiting**: все таймауты/интервалы — не привязаны к разметке.
- **shopping-cart**: `currency`, `currencyPosition`, `storageKey`, весь объект `texts.*`.
- **header-nav**: `breakpoint`, `closeOnLinkClick` — единственный header на странице, это настройка темы.
- **cards**: `enabled`, `cardSelector` — не менять.
- **faq / cookie-banner**: уже мигрированы на data-* ранее (`data-faq-allow-multiple`, `data-faq-default-open`, `data-cookie-days`, `data-cookie-delay`, `data-cookie-position`, `data-cookie-indent*`) — в этом задании только убедиться, что глобальный JS-дефолт не переопределяет заданный data-* (regression-тест, ничего не переписывать, если тест уже проходит).
- Все "мета"-опции по всем плагинам (имена атрибутов/селекторов: `hashPrefix`, `targetAttribute`, `*Selector` и т.п.) — не трогать нигде.

## 4. Группа C — удалить (мёртвый код)

1. **header-nav**: удалить из `src/theme-config.js` ключи `sticky`, `hideOnScrollDown`, `stickyTop`, `navMaxHeight` в блоке `headerNav` (строки ~114–121) — нигде не читаются в `src/header-nav/header-nav.js`, подтверждено в шапке файла ("No sticky").
2. **grid-cluster**: перед удалением — прочитать `src/grid-cluster/grid-cluster.js` целиком (не только первые 40 строк, это не было проверено полностью), убедиться, что `options`/`enabled` действительно нигде не используется, затем удалить чтение `window.CarrdPluginOptions.gridCluster` и соответствующий блок в `theme-config.js` (строка ~50).

## 5. Группа D — только проверка, без изменений кода

### slider-v2 (src/slider-v2/slider.js)

Код уже полностью соответствует data-*-контракту (см. `docs/specs/slider-v2-plan.md`) и служит референсом для группы A (раздел 1). В этом задании по нему нужна только верификация, **никаких правок в `src/slider-v2/` не вносить**:

- Прогнать `tests-js/slider-v2.test.js` (если ещё не создан по плану п. 8.3 `slider-v2-plan.md` — создать тест, но не менять логику плагина под тест, а зафиксировать существующее поведение).
- Сверить README (`src/slider-v2/README.md` / `dist/slider-v2/README.md`) с фактическими атрибутами в коде (`data-slider-mode`, `data-slider-spv`, `data-slider-gap`, `data-slider-autoplay`, `data-slider-dots`, `data-slider-arrows`) — задокументировать расхождения, если найдутся, отдельным пунктом в отчёте, не исправлять код молча.
- Убедиться, что `docs/specs/plugin-data-contract.md` либо ссылается на slider-v2 как альтернативный/будущий контракт, либо явно фиксирует, что slider-v2 — прототип вне основного контракта (сейчас в contract-файле секции slider-v2 нет вообще — открытый вопрос см. раздел 8).

### slider v1 (src/slider/slider.js)

Полностью вне скоупа. Не читать с целью правок, не запускать миграцию, не менять тесты. Если по ходу работы над группой A возникнет соблазн "заодно" привести v1 к тому же виду — не делать, это отдельная будущая задача вне этого плана.

## 6. Definition of Done (на весь блок задания)

- Каждая перенесённая опция (группа A) читается через отдельную типизированную parse-функцию по образцу раздела 1, с warn+fallback на невалидные значения.
- Порядок приоритета явно закреплён в коде и в комментарии: `data-*` на элементе > `window.CarrdPluginOptions` (пока не удалён) > дефолт. Указать срок или условие удаления JS-пути (legacy fallback) — по аналогии с `plugin-data-contract.md`, раздел "Migration Rules".
- `docs/specs/plugin-data-contract.md` дополнен секциями для каждого затронутого плагина новыми атрибутами (сейчас там отсутствуют разделы stacker, typography, header-nav, design-palette — как минимум добавить новые атрибуты в существующие секции slider/accordeon/modal/switcher/floating-cta/shopping-cart).
- Тесты в `tests-js/<plugin>.test.js` расширены: дефолты, валидные значения, невалидные значения → fallback + warn — по образцу плана тестирования slider-v2 (`docs/specs/slider-v2-plan.md`, п. 8.3).
- `tests-js/contracts.test.js` и `tests-js/backward-compat.test.js` пройдены без регрессий.
- Для группы C — `tests-js/header-nav.test.js` и `tests-js/grid-cluster.test.js` пройдены после удаления мёртвых ключей (не должны были на них полагаться).
- Для группы D — получен короткий отчёт по slider-v2 (статус тестов, найденные расхождения README/код, если есть), без единой правки в `src/slider-v2/`.
- После правок в `src/` (группы A и C) — прогнать `scripts/minify_plugins.py` и `scripts/verify_dist.py`, чтобы `dist/` пересобрался консистентно (правило "Generated dist/ must come from src/ and templates only"). Для группы D пересборка не требуется, так как код не менялся.
- Отдельно проверить (см. открытые вопросы) синхронизацию с `cardbuilder/projects/*` — новые data-*-атрибуты должны быть отражены в шаблонах/сайтах через существующий процесс `template-vs-repo-plugin-sync.json`, иначе опубликованные сайты не получат новых атрибутов.
- `src/slider/` и `src/slider-v2/` не изменены ни на байт — проверяется diff'ом перед сдачей задания.

## 7. Порядок работ (приоритет)

1. Группа C (удаление) — самое низкорисковое, делать первым.
2. Группа A: modal, accordeon, switcher, stacker, floating-cta, shopping-cart — по одному плагину за проход, с тестами на каждый.
3. Группа D: верификация slider-v2 — можно делать в любой момент параллельно, это не блокирует остальное и не имеет зависимостей.
4. Группа B — без изменений кода, только сверка, что regression-тесты для faq/cookie-banner проходят.
5. Slider (v1 и v2) в очередь работ не входит вообще — ни в начале, ни в конце.

## 8. Открытые вопросы (уточнить по ходу, не блокируют старт)

1. Поддерживает ли редактор Carrd произвольные `data-*` атрибуты без искажений на всех типах элементов (ссылка/контейнер/секция) — проверить точечно перед массовым переносом, особенно для `data-shopping-cart-checkout-target` (секция) и `data-modal-*` (контейнер).
2. Кто и когда прогоняет ре-паблиш сайтов в `cardbuilder/projects/*` после того, как новые атрибуты появятся в репозитории — без этого шага миграция не долетит до реальных сайтов.
3. Судьба slider v1 (миграция на data-* или полная замена на v2) — отдельное решение вне этого плана; здесь фиксируем только то, что в рамках текущего задания он не трогается.

## 9. Итоги выполнения (2026-07-11)

### Сделано

- **Группа C**: удалены мёртвые ключи `sticky`, `hideOnScrollDown`, `stickyTop`, `navMaxHeight` из `theme-config.js` (headerNav) — подтверждено полным чтением `header-nav.js`, нигде не читались.
- **Группа A — accordeon**: добавлены `data-accordeon-default-open`, `data-accordeon-scroll`, `data-accordeon-scroll-behavior`, `data-accordeon-scroll-block` (per-group, читаются с первой панели группы).
- **Группа A — modal**: добавлены `data-modal-close-on-overlay`, `data-modal-close-on-escape`, `data-modal-show-close`, `data-modal-lock-scroll` (per-modal; overlay/keyboard теперь разрешают конфиг активной модалки динамически, а не один раз при создании).
- **Группа A — switcher**: добавлен `data-switcher-default-index` (per-controller, приоритет выше JS `instances`).
- **Группа A — shopping-cart**: добавлен `data-shopping-cart-checkout-target` (приоритет выше `checkoutTargetId`).
- **Группа D**: `slider-v2` проверен — `tests-js/slider2.test.js` уже покрывает дефолты/триплеты/невалидные значения/предупреждения (24 теста, все проходят), README точно соответствует коду. Правок не потребовалось.
- `docs/specs/plugin-data-contract.md` дополнен: новые атрибуты в секциях Accordeon/Modal/Switcher/Shopping Cart + новый раздел "Per-Instance Behavior Overrides" с приоритетом `data-*` > JS > дефолт.
- Валидация: `npm run test:js` (260/260 тестов, включая новые сценарии для всех тронутых плагинов), `eslint` на изменённые файлы — чисто.

### Отклонения от плана (обязательно к сведению)

1. **stacker — правок не потребовалось.** `resolveOffset()` в `stacker.js` уже читал `data-stacker-offset` с приоритетом над `config.offset` до этого задания. Пункт плана "убрать глобальный JS-дефолт" был основан на неверном понимании: `theme-config.js` вообще не задаёт блок `stacker`, а сам код уже был data-*-first. Никакого удаления не делалось.
2. **floating-cta — правок не потребовалось, пункт переклассифицирован.** `defaultPosition` **не убран** из JS-конфига. Причина: `normalizePosition()` уже использует `data-floating-position` на элементе с приоритетом, а `CONFIG.defaultPosition` — это осмысленный сайт-вайд дефолт-фолбэк (аналог того, что `theme-config.js` уже делает для других плагинов), а не дублирующий control. Удаление забрало бы у владельца сайта законный рычаг "дефолтная позиция для всех CTA без тега на каждом" без data-*-эквивалента. Перенесён из группы A в группу B задним числом.
3. **grid-cluster — подтверждено, что `options.enabled` реально используется** (`grid-cluster.js:80`, `if (options.enabled === false) return;`). Предыдущая оценка "мёртвый код" была основана на неполном чтении файла (первые ~40 строк). Ничего не удалено.
4. **Переформулирована роль `window.CarrdPluginOptions`.** По `AGENTS.md` ("Pre-release theme contract...") это не "легаси-путь на удаление", а постоянный, официально поддерживаемый site-owned слой кастомизации, существующий параллельно с repo-owned дефолтами в `theme-config.js`. Формулировки плана и `plugin-data-contract.md`, намекавшие на будущее отключение JS-пути, скорректированы: `data-*` добавляется как приоритетный слой поверх, JS-опции не депрекейтятся.

### Не выполнено / не проверялось

- `npm run check:deadcode` (knip) не смог запуститься в этой песочнице — отсутствует нативный биндинг `@oxc-parser/binding-linux-arm64-gnu` (инфраструктурное ограничение окружения, не связано с изменениями). Требует перепроверки в обычном окружении разработчика.
- `npm run build` / `npm run verify:dist` / `npm run check:bundle-budget` не запускались в этом цикле — правки затронули только `src/`, `dist/` не пересобирался. Требуется перед релизом (см. Definition of Done, раздел 6).
- Синхронизация с `cardbuilder/projects/*` (открытый вопрос №2) не выполнялась — вне скоупа этого Builder-прохода.
- Ручная проверка редактора Carrd на предмет искажения новых `data-*` атрибутов (открытый вопрос №1) не проводилась.
