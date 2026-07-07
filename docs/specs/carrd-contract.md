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
- `theme-design-tokens.css` и `theme-ui.css` — low-level support files.
- `theme-core.min.css` и `theme-core.min.js` — CDN bundle artifacts.
- `theme-core-cdn.html` — single helper для Head/Body End snippets.
- `no-loadwaiting` остаётся вне bundle, потому что он должен работать первым.

## Pre-release target theme contract
- До публичного v2 release delivery contract должен сойтись к трём canonical bundle artifacts: `theme-tokens.css` (tokens only), `theme-bundle.css` (shared UI + bundle plugin CSS без tokens) и `theme-bundle.js` (bundle plugin JS).
- `theme-ui.css` остаётся shared UI support file только для `CDN Individual` / manual path и не документируется как обязательный include рядом с `theme-bundle.css`.
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
- CSS variables используют префикс `--theme-` и всегда имеют fallback.
- Public plugin globals используют формат `window.Carrd<Plugin>`.
- Legacy globals `window.Carrd<Plugin>V2` допускаются только как backward-compat aliases.
- Configuration идёт через `window.CarrdPluginOptions`.
- Source JS/CSS не содержит HTML tag banners вверху файла.
- Commit messages — English, формат `Action Component: Description`.

## Release workflow
1. Править `src/<plugin>/...` и, если нужно, source README.
2. Запустить `npm run build:docs` или `python3 scripts/minify_plugins.py --docs-only`.
3. Проверить generated `dist/` и public README.
4. При code changes дополнительно прогнать `npm run verify:dist`, `npm run test`, `npm run lint`.
5. После push изменений, влияющих на CDN, запустить `npm run cdn:purge`.

## Related docs
- `docs/specs/carrd-markup-contract.md`
- `docs/specs/plugin-data-contract.md`
- `docs/specs/switcher-contract.md`
- `docs/specs/carrd-source-reference.md`
- `docs/templates/plugin-readme-template.md`
