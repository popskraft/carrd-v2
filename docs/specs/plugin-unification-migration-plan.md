# План clean-runtime и миграции плагинов

## Суть

Привести `/Users/popskraft/Projects/carrd-v2` к самостоятельному clean-only runtime второй версии, проверить каждый плагин до любых изменений реальных сайтов и затем выполнить миграцию строго по цепочке:

1. Репозиторий и все плагины.
2. Отдельная полная тестовая и remediation-сессия.
3. `main-template` -> Carrd `faktura` -> экспорт и установка в `/Users/popskraft/Projects/faktura-app`.

Следующий этап начинается только после PASS предыдущего. Старый `/Users/popskraft/Projects/carrd` и `popskraft/carrd-plugins` остаются замороженной legacy-линией и в эту работу не входят.

## Ядро

### Целевой контракт

- Repo/CDN path остаётся `popskraft/carrd-v2`.
- Public bundle: `theme-core.min.css`, `theme-core.min.js`, `theme-core-cdn.html`.
- Plugin paths: `src/<plugin>/` и `dist/<plugin>/<plugin>.min.*`.
- Config: только `window.CarrdPluginOptions`.
- API globals: только `window.Carrd<Plugin>`.
- Markup: только утверждённые clean `data-*`, classes и hashes из `docs/specs/plugin-data-contract.md` и `docs/specs/carrd-markup-contract.md`.
- Поведение и исправления второй версии сохраняются. Код первой версии не переносится обратно.
- Active source, delivery, docs, tests, automation, manifests и текущие site inventories не содержат `*-v2`, `Carrd*V2`, `CarrdPluginOptionsV2` или `data-*-v2`.
- Исторические snapshots, backups и raw imports не переписываются задним числом, но не участвуют в build, runtime, docs guidance и current-state checks.

### Этап 1. Исправление репозитория и всех плагинов

#### 1.1 Зафиксировать baseline

- Снять `git status`, текущие validation results и inventory запрещённых legacy/V2 references.
- Не смешивать clean-runtime изменения с уже существующими изменениями `cardbuilder`/MCP.
- Зафиксировать список 13 active plugins: `accordeon`, `cards`, `cookie-banner`, `faq`, `floating-cta`, `grid-cluster`, `header-nav`, `modal`, `no-loadwaiting`, `shopping-cart`, `slider`, `switcher`, `typography`.

#### 1.2 Закрепить автоматический clean-contract check

- Добавить `npm run check:clean-contract`.
- Проверять active `src/`, `dist/`, `scripts/`, `tests-js/`, `docs/` и operational `cardbuilder/`.
- Запретить V2 suffixes, V2 globals, V2 config namespace, V2 data attributes и старые generated paths.
- Явно исключить только historical evidence folders.
- Добавить check в основной validation/CI path.

#### 1.3 Очистить runtime

- Удалить `window.CarrdPluginOptionsV2` bridge из `src/theme-config.js` и всех plugins.
- Удалить `window.Carrd<Plugin>V2` aliases.
- Удалить `data-*-v2`, `#data-*-v2-*`, V2 initialization markers и CSS selectors.
- Удалить compatibility-only typo/generic/class fallbacks, если они не входят в утверждённый clean contract.
- Сохранить accessibility, idempotency, API, responsive behavior и исправления второй версии.
- Для каждого fallback сначала проверить, что `main-template`, `faktura` и `faktura-app` будут переведены на его clean replacement.

#### 1.4 Отдельно очистить ecommerce

- Оставить `CarrdShoppingCart` и `CarrdPluginOptions.shoppingCart`.
- Оставить Section Break `shopping-cart`, form ID `form-shopping-cart`, `data-shopping-cart-output="order-details"` и optional `checkoutTargetId` config.
- Удалить `CarrdShoppingCartV2`, `data-shopping-cart-v2-*`, `data-cart-v2-*` и migration-only lookup paths.
- Проверить cart persistence, quantity changes, totals, order serialization, checkout routing, focus trap и empty-cart cleanup.

#### 1.5 Очистить build, delivery и документацию

- Перевести build scripts, templates, purge logic и generated README на clean names.
- Пересобрать `dist/` только из `src/`.
- Удалить active `*-v2` automation и заменить её clean migration tooling.
- Синхронизировать `README.md`, plugin README, contracts, CHANGELOG и current manifests.
- Не публиковать и не менять Carrd Builder на этом этапе.

#### Gate 1

- `npm run build` проходит.
- `npm run verify:dist` подтверждает чистую воспроизводимую сборку.
- `npm run check:clean-contract` не находит запрещённых references на active surfaces.
- Все 13 plugins имеют clean source/dist artifacts.
- Реальные сайты ещё не изменялись.

### Этап 2. Полная тестовая и remediation-сессия

Этот этап выполняется отдельной сессией после завершения repo cleanup и до любой миграции реальных сайтов.

#### 2.1 Проверить каждый plugin

- `accordeon`: hash isolation, group toggle, scroll, API, refresh, idempotency.
- `cards`: grouping, colors, borders, padding, resize sync, idempotency.
- `cookie-banner`: consent, delay, position, responsive indent, cookie lifetime, повторная загрузка.
- `faq`: структура вопросов, single/multiple open, default open, keyboard/a11y, idempotency.
- `floating-cta`: cloning, positions, mobile/desktop visibility, resize, duplicate prevention.
- `grid-cluster`: consecutive grouping, columns, responsive attrs, gaps, widths, idempotency.
- `header-nav`: mobile collapse, Escape/focus, resize, close-on-link, no-flash/anti-jump.
- `modal`: hash/data triggers, overlay/Escape, focus, scroll lock, refresh API, cart interaction.
- `no-loadwaiting`: loader removal, body lifecycle, observers, resize pulses.
- `shopping-cart`: полный ecommerce flow из пункта 1.4.
- `slider`: grouping, gestures, links, breakpoints, loop, autoplay, resize, destroy/refresh, stress test.
- `switcher`: multiple controllers, target indexes, whole-container targets, isolation, API, missing targets.
- `typography`: parsing, nested classes, partial config, repeated initialization.

#### 2.2 Проверить систему целиком

- Theme bundle содержит только разрешённые plugins и clean globals.
- Standalone CDN snippets загружают только собственный plugin namespace.
- Split embeds `shopping-cart` и `slider` собираются и исполняются в правильном порядке.
- Все plugins совместимы между собой и не перезаписывают Carrd `main.js` globals/body lifecycle.
- Повторная инициализация не создаёт дубликаты wrappers, listeners, overlays, clones или controls.
- Legacy/V2 markers не являются скрытым обязательным условием успешных tests.
- Build, docs и generated `dist` воспроизводимы из чистого checkout.

#### 2.3 Исправить найденные дефекты и справки

- Каждый defect сначала воспроизвести тестом, затем исправить runtime.
- После исправлений повторить plugin test и полный suite.
- Обновить plugin README и contracts только по подтверждённому поведению.
- Повторять remediation максимум два полных круга; повторяющийся defect передать Reviewer как blocker.

#### Команды этапа 2

```bash
npm run build
npm run verify:dist
npm run check:clean-contract
npm run test:py
npm run test:js
npm run test:cardbuilder
npm run lint
npm run validate
```

#### Gate 2

- Каждый из 13 plugins имеет индивидуальные PASS tests.
- Integration, bundle, idempotency, contract и negative legacy tests проходят.
- Нет skipped/known-failing tests по migration scope.
- Reviewer выдаёт PASS для repo cleanup и test evidence.
- Подготовлен immutable clean release candidate для безопасной проверки CDN без немедленной замены `@main`.

### Этап 3. Последовательная миграция реальных потребителей

#### 3.1 Мигрировать `cardbuilder/main-template`

1. Выполнить fresh read-only Builder scan и проверить `connected`, `authenticated`, `builder-ready`, `state-mapped`, `docs-sync-status`, `safe-to-edit`.
2. Снять полный pre-change snapshot через `window.app.builder.site.json()` и inventory embeds/attrs/globals/CDN paths.
3. Сравнить live state с clean RC artifacts и составить точный replacement map.
4. После operator approval заменить plugin embeds, config namespace, data attributes и CDN paths в draft.
5. Выполнить hash/content readback, plugin smoke и regression checks без публикации.
6. При ошибке не публиковать и перезагрузить Builder для отката незакоммиченных изменений.
7. После operator publish выполнить fresh published-site scan на `https://mini.crd.co/`.
8. Проверить все реально установленные plugins, console errors, desktop/mobile behavior и отсутствие V2 references.

Gate `main-template`: draft и published site совпадают с clean contract; post-publish scan PASS. Только после этого разрешена работа с `faktura`.

#### 3.2 Мигрировать Carrd template `faktura`

1. Выполнить отдельный fresh read-only scan Builder `4778178033233108` и снять snapshot.
2. Повторно инвентаризировать все plugin/theme embeds; старые inventories не использовать как единственное доказательство.
3. Заменить V2 titles/content/config/attrs на clean artifacts, сохранив service embeds Jivo, Metrika и Callibri.
4. Выполнить exact hash readback и plugin smoke в draft.
5. После operator approval опубликовать template.
6. Выполнить post-publish scan на `https://faktura-dev.crd.co/`, desktop/mobile smoke и проверку console/runtime globals.

Gate `faktura`: Carrd draft и published site работают на том же clean contract, который прошёл `main-template`.

#### 3.3 Экспортировать `faktura` и установить в `faktura-app`

1. Только после PASS Carrd `faktura` экспортировать актуальный шаблон.
2. Поместить экспорт в canonical source `/Users/popskraft/Projects/faktura-app/resources/design-system/_redesign/carrd-faktura/`.
3. Не редактировать generated `_extracted/`, `public/carrd/` и generated embeds вручную; обновить source export и запустить sync.
4. Выполнить `npm run carrd:sync`, чтобы регенерировать extracted blocks, `plugins.js`, theme assets, manifest и `head.blade.php`.
5. Перевести app-owned Blade markup и verification rules на clean contract, включая FAQ `data-faq`.
6. Выполнить code tests и локальный browser smoke интернет-магазина: главная, каталог, товар, формы, FAQ, slider, modal, cookie, navigation и ecommerce path.
7. Не выполнять production deploy без отдельного operator approval.

Команды `faktura-app`:

```bash
npm run carrd:sync
npm run carrd:check
npm run design:check
php artisan test
```

Gate `faktura-app`: generated assets соответствуют clean Carrd export, storefront tests и browser smoke проходят, V2 references отсутствуют на active surfaces.

#### 3.4 Финализировать release

- Повторно просканировать `/Users/popskraft/Projects` на consumers `popskraft/carrd-v2` и V2 contract references.
- Убедиться, что старые сайты продолжают использовать только `popskraft/carrd-plugins`.
- После PASS всех трёх consumers продвинуть clean release в `main`.
- Удалить obsolete `*-v2` delivery paths и выполнить scoped jsDelivr purge только после operator approval.
- Повторить smoke `mini.crd.co`, `faktura-dev.crd.co` и локального `faktura-app` после переключения на финальный ref.

## Детали

### Scope

- Runtime, tests, build, generated delivery и active docs в `/Users/popskraft/Projects/carrd-v2`.
- Carrd site packages `cardbuilder/main-template` и `cardbuilder/faktura`.
- Carrd export и integration layer в `/Users/popskraft/Projects/faktura-app`.

### Out of scope

- Любые изменения runtime в `/Users/popskraft/Projects/carrd` или `popskraft/carrd-plugins`.
- Автоматическая миграция неизвестных старых сайтов.
- Production deploy `faktura-app` без отдельного решения владельца.
- Переписывание historical snapshots/raw imports ради нулевого текстового совпадения.

### Operator gates

- Замена или удаление live embeds.
- Добавление новых user-facing classes, IDs или `data-*`.
- Save/publish в Carrd.
- Push/tag/main promotion и jsDelivr purge.
- Production deploy `faktura-app`.

### Риски

- Удаление `*-v2` из `@main` до миграции текущих CDN consumers может сломать опубликованные сайты.
- Старые inventories `main-template` и `faktura` не заменяют fresh pre-change scans.
- Inline plugins в `faktura-app` не наследуют изменения `carrd-v2` автоматически.
- Clean names совпадают с именами первой версии, поэтому нельзя одновременно загружать оба runtime на одной странице.
- `carrd-admin-ops` содержит устаревший hardcoded root `/Users/popskraft/Projects/CARRD`; live execution должно использовать current registry `/Users/popskraft/Projects/carrd-v2/cardbuilder/data/sites.json`.

### Done

- `carrd-v2` является clean-only runtime и проходит полный Reviewer audit.
- Все plugins протестированы до первой live migration.
- `main-template` мигрирован и подтверждён первым.
- Carrd `faktura` мигрирован только после PASS `main-template`.
- Новый экспорт `faktura` установлен и проверен в `faktura-app`.
- Финальная публикация не оставляет active V2/legacy contract tails в новой линии.
