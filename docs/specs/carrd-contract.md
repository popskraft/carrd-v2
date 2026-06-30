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

## README build map
- `dist/README.md` собирается из root `README.md` через `scripts/templates/root_readme.md`.
- `[[CONTENT]]` — полный текст root README.
- `[[VERSION]]` и `[[BUILD_DATE]]` — build metadata.
- `## Included Plugins` строится автоматически из `src/*`.
- `dist/<plugin>/README.md` собирается из `src/<plugin>/README.md` через `scripts/templates/plugin_readme.md`.
- `src/<plugin>/README.md` не дублирует `## Installation`; install flow принадлежит шаблону.
- `scripts/minify_plugins.py` валидирует source README contract перед генерацией `dist`; нарушенный contract должен ломать build.
- Если меняется итоговый формат документации, править нужно шаблоны и source README, а не generated `dist/` вручную.

## Plugin README contract
- Source README пишутся для Carrd end user.
- Заголовок должен совпадать с folder name в Title Case.
- Required order: `What You Do in Carrd` → `How It Works in Carrd` → `How To Check That It Works` → `Configuration` → `Design` / `Advanced` sections.
- Install flow должен оставаться template-owned single-path: `theme-design-system.html` в `Head`, затем `<plugin>-embed.html` в `Body End`.
- `:root` overrides всегда показывать как отдельный `Head` embed below `theme-design-system.html`.
- CDN / jsDelivr / build commands не должны попадать в user-facing `dist/<plugin>/README.md` как основной install flow.

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
