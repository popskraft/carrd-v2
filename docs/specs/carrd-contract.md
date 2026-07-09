# Carrd Plugins Contract

## Назначение
Этот документ задаёт единый контракт для source, docs, build outputs и release workflow репозитория Carrd Plugins.

## Где живёт канон
- `src/` — editable source плагинов и source README.
- `dist/` — generated distributive assets и public README.
- `README.md` — публичная ориентация и install guide для всей коллекции.
- `docs/` — durable internal docs.
- `scripts/templates/` — template-owned README scaffolding.
- `scripts/minify_plugins.py` — генератор `dist/` docs и assets.

## Theme и delivery
- `theme-design-system.html` — required base artifact для inline installs.
- `theme-design-tokens.css` — reference/default contract containing only global palette, roles, typography and shared UI tokens for site-owned `:root { --theme-* }` embeds.
- `theme-design-tokens-embed.html` — ready-to-paste full token layer for CDN installs.
- `theme-ui-runtime.css` — clean shared UI support file for new `CDN Individual` installs.
- `theme-ui.css` — compatibility shared UI artifact with the legacy token bridge for mutable `@main` consumers.
- `theme-runtime.min.css` и `theme-runtime.min.js` — canonical CDN bundle artifacts for new installs.
- `theme-runtime-cdn.html` — canonical Head/Body End helper.
- `theme-core.min.css` и `theme-core.min.js` — compatibility CDN bundle artifacts.
- `theme-core-cdn.html` — compatibility helper for legacy rollout only.
- `no-loadwaiting` остаётся вне bundle, потому что он должен работать первым.

Current install contract:
- New installs use `theme-runtime.min.css` + `theme-runtime.min.js` plus a separate full token layer from `theme-design-tokens-embed.html`.
- `theme-runtime.min.css` ships shared UI + bundled plugin CSS and the low-specificity defaults owned by those plugins, but never global token defaults.
- `theme-core.min.css` is a compatibility artifact that ships default tokens and the legacy token bridge for existing mutable `@main` installs.
- Site token values still belong in Carrd `Head` embeds as site-owned custom layers.
- `theme-design-tokens.css` remains published as a repo-owned reference/default set, not as a required CDN include.
- Every plugin CSS owns its public `--theme-<plugin>-*` defaults in a leading `:where(:root)` block. Optional plugin namespaces never leak into the global token layer or bundles that exclude that plugin.

## Runtime contract
- Canonical new-install artifacts: `theme-design-tokens-embed.html`, `theme-runtime.min.css`, `theme-runtime.min.js`.
- `theme-ui-runtime.css` остаётся shared UI support file только для `CDN Individual` / manual path и не документируется как обязательный include рядом с `theme-runtime.min.css`.
- `theme-core.*` и `theme-ui.css` сохраняются только как compatibility tail для already-live installs на mutable `@main`.
- Mutable `@main` draft installs допустимы только как development surface и только с единым ручным `?rev=...` во всех repo-owned CDN URLs.
- Если jsDelivr branch-cache продолжает отдавать stale `@main` snapshot даже после смены `?rev=...`, development draft временно переводится на конкретный commit SHA из `main` как аварийный exact-ref fallback.
- Custom site code не публикуется из `dist/` как `theme-custom-*` CDN artifacts и не считается частью repo-owned delivery surface.
- Canonical site-owned custom layers:
  - `Brand Token Override` — только `:root { --theme-* }`.
  - `Site CSS Override` — site-level selector overrides и layout fixes.
  - `Plugin Config` — `window.CarrdPluginOptions`.
  - `Site Custom JS` — site-only behavior после plugin runtime.
- Decision order для docs и rollout:
  1. Поменять brand/style system → `Brand Token Override`.
  2. Поменять только этот сайт → `Site CSS Override`.
  3. Поменять поведение plugin → `window.CarrdPluginOptions`.
  4. Добавить site-only behavior, который не решается CSS/config → `Site Custom JS`.
- User-facing docs должны явно говорить, что site custom layers добавляются в Carrd embeds и не редактируют jsDelivr files.
- User-facing docs не рекомендуют mutable refs (`@main`) для новых installs.

## README build map
- `dist/README.md` собирается из root `README.md` через `scripts/templates/root_readme.md`.
- `[[CONTENT]]` — полный текст root README.
- `[[VERSION]]` и `[[BUILD_DATE]]` — build metadata.
- `## Included Plugins` строится автоматически из `src/*`.
- `dist/<plugin>/README.md` собирается из `src/<plugin>/README.md` через `scripts/templates/plugin_readme.md`.
- `src/<plugin>/README.md` не содержит install flow, version или build metadata; эти части принадлежат генератору и шаблону.
- Bundle/add-on wording вычисляется из `bundle.config.json`, необходимость shared theme — из наличия plugin CSS, placement — через общий helper, split inline path — через `SPLIT_EMBED_PLUGINS`.
- Generated plugin README содержит version, но не build date: одинаковые source/config/version дают одинаковый результат независимо от даты запуска.
- `scripts/minify_plugins.py` валидирует source README contract перед генерацией `dist`; нарушенный contract должен ломать build.
- Если меняется итоговый формат документации, править нужно шаблоны и source README, а не generated `dist/` вручную.

## Plugin README contract
- Source README пишутся для Carrd end user.
- Заголовок должен совпадать с folder name в Title Case.
- После заголовка обязателен один короткий paragraph, описывающий user-visible result.
- Required order: `Carrd Setup` → `Configuration` → `Verify`.
- После required flow разрешены только `Design`, `Advanced: ...`, `API`, `Troubleshooting`.
- Generated install flow показывает `CDN Bundle` или `Bundle Add-on`, затем `CDN Individual` и `Inline Embed`.
- `no-loadwaiting` всегда документируется в `Head`; split plugins перечисляют обе inline parts в правильном порядке.
- `:root` overrides всегда показываются как отдельный `Head` embed после theme files.
- Custom guidance должна оставаться короткой и однозначной: brand/theme changes через token override, site-only styling через site CSS, plugin behavior через `window.CarrdPluginOptions`, site-only behavior через custom JS.
- Source README не содержит repo maintenance, build commands и повторяющиеся CDN URLs.

## Coding и config rules
- Vanilla JS only, без внешних runtime dependencies.
- Global/shared CSS variables используют `--theme-color-*`, `--theme-button-*`, `--theme-link-*`, `--theme-nav-*`, `--theme-ui-*`, `--theme-font-*`, `--theme-focus-*` или `--theme-overlay-*` и определяются только в `theme-design-tokens.css`.
- Public component variables используют namespace `--theme-<plugin>-*` и определяются только в leading `:where(:root)` block соответствующего plugin CSS.
- Canonical CSS использует обязательные `var(--theme-*)` без fallback argument. Fallback chains разрешены только в rollout-only `theme-compat.css`; private optional variables без `--theme-` могут использовать fallback.
- Public plugin globals используют формат `window.Carrd<Plugin>`.
- Legacy globals `window.Carrd<Plugin>V2` допускаются только как backward-compat aliases.
- Configuration идёт через `window.CarrdPluginOptions`.
- Source JS/CSS не содержит HTML tag banners вверху файла.
- Commit messages — English, формат `Action Component: Description`.

## Release workflow
Полный owner процесса: `docs/specs/release-contract.md`.

- Разработка идёт в `main`; активный Carrd draft может временно быть подключён к `@main` во время доработки.
- Если draft подключён к `@main`, все repo-owned CDN refs обязаны иметь один и тот же ручной cache-buster `?rev=YYYYMMDD-XX`.
- Голый `@main` без `?rev=...` считается невалидным development contract.
- Freeze, release candidate, опубликованный продаваемый шаблон и клиентская поставка никогда не подключаются к `@main`.
- Pre-sale validation обязана отдельно проверить отсутствие `@main` и `?rev=...` в финальном Carrd решении.
- Каждый публичный runtime получает новый SemVer, immutable Git tag и version-pinned jsDelivr URL.
- Старые release tags не изменяются и не удаляются.
- Release candidate готовится через `npm run release:prepare`; публикация tag, purge и переключение Carrd выполняются отдельными явными шагами.

## Related docs
- `docs/specs/carrd-markup-contract.md`
- `docs/specs/release-contract.md`
- `docs/specs/plugin-data-contract.md`
- `docs/specs/switcher-contract.md`
- `docs/specs/carrd-source-reference.md`
- `docs/templates/plugin-readme-template.md`
