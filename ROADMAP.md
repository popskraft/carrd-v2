# Дорожная Карта

## Суть
`carrd-v2` проходит трёхэтапный clean-runtime cycle. Архитектурные вопросы закрыты. Первый следующий шаг — безопасно удалить switcher cluster mode: сначала перевести `main-template` `cases` на `data-switcher-target` + explicit indexes, затем удалить cluster runtime/config/tests/docs. После этого продолжается миграция `main-template` -> Carrd `faktura` -> export/install в `faktura-app`.

## Ядро
| # | Работа | Статус |
|---|---|---|
| 1 | Зафиксировать `docs/` как active durable-docs root | done |
| 2 | Нормализовать root `AGENTS.md`, `README.md`, `CLAUDE.md`, `DEFINITION-OF-DONE.md`, `OPEN-QUESTIONS.md` и `docs/INDEX.md` под текущий documentation canon | done |
| 3 | Создать `popskraft/carrd-v2` как отдельный runtime repo для второй версии | done |
| 4 | Формализовать v2 publication contract без публикации v2 в legacy `popskraft/carrd-plugins` | done |
| 5 | Перевести source/dist на `*-v2` public identity, `theme-core`, `Carrd*V2` globals и `popskraft/carrd-v2@main` snippets | done |
| 6 | Применить audit fixes: shopping-cart text escaping, slider ARIA region label, modal refresh API, FAQ rAF height adjustment, cookie Secure flag | done |
| 7 | Сохранить legacy `popskraft/carrd-plugins` историческим freeze ref перед публичным v2 rollout | done |
| 8 | Опубликовать validated `popskraft/carrd-v2` main/tag `v2.0.0` и purge только v2 jsDelivr paths | done |
| 9 | Перенести `admincarrd` и `cardbuilder` из legacy workspace в `carrd-v2` и обновить локальные связи | done |
| 10 | Проверить live-синхронизацию нескольких controllers с одинаковым `data-switcher` | active |
| 11 | Проверить live cluster-переключение целых containers через `data-switcher-cluster` — проверка отменена решением Q002 в пользу полного удаления cluster mode | done |
| 12 | Проверить `accordeon` на рабочем Carrd-сайте на группе `ppf` | active |
| 13 | Проверить promoted `header-nav` anti-jump mobile collapse на рабочем Carrd-сайте | done |
| 14 | Закрепить `cardbuilder` operational canon без внешних workspace-зависимостей | done |
| 15 | Перевести canonical `main-template` Builder `4155176224428477` на явные v2 embeds и v2-разметку; затем выполнить operator publish и post-publish verify | done |
| 16 | Довести `faktura` до canonical scan package и обновить Builder draft на v2 plugins | done |
| 17 | Расширить broken-link/legacy-root проверку с operational canon на критические `cardbuilder/docs/` indexes и runbooks | active |
| 18 | Закрепить per-site Chrome-профили: добавить `chromeProfileDir` в `sites.json`, перевести `open-debug-chrome.sh` на чтение из реестра, задокументировать в quickstart | done |
| 19 | Добавить `CARRD_KNOWLEDGE_SOURCES.md` — инструкция по доступу к docs-rag-mvp RAG-сервису, ссылка из `cardbuilder/AGENTS.md` и `shared/INDEX.md` | done |
| 20 | После operator publish для `faktura` снять post-publish scan и подтвердить published runtime v2 plugins — закрыто live verify `faktura-dev.crd.co` в строке 26 | done |
| 21 | Добавить backward-compat слои во все 9 interactive plugin JS: поддержка v1-атрибутов и `CarrdPluginOptions` fallback | done |
| 22 | Заменить все plugin embeds в faktura draft на свежие v2 (backward-compat) и перевести `embed10` config на `CarrdPluginOptions`; publish остаётся operator-only | done |
| 23 | Полный readiness-аудит v2 (4 параллельные проверки + adversarial verify): расширить config-fallback на typography/header-nav/no-loadwaiting/shopping-cart, legacy data-attrs + `CarrdShoppingCart` alias для shopping-cart, modal lazy `[data-modal]` lookup | done |
| 24 | Добавить backward-compat тесты (`tests-js/backward-compat.test.js`, helper `setLegacyPluginOptions`): v1-атрибуты + v1-config + V2-precedence, 13 тестов | done |
| 25 | Закрыть container-scoped CSS alias-гэп: faq/cookie/modal (`1ac3dd4`) + найденный switcher гэп (`eca34b3`); systematic-скан подтвердил отсутствие других tails; пересобрать dist (`ab0eee6`); validate 189/189 | done |
| 26 | Синхронизировать faktura Builder с alias-fixed dist (`automation/sync-v2-embeds.mjs`, embed02/03/07, hash-readback 3/3); опубликовано оператором; live verify `faktura-dev.crd.co` подтверждает fixed FAQ/modal/cookie scope | done |
| 27 | Провести полный аудит remote-control поверхности Carrd Builder `4155176224428477`, устранить false-positive readiness, обновить live knowledge package и закрыть отсутствующие element-type fixtures | done |
| 28 | Собрать минимальный Carrd Builder MCP v1: deterministic control core, thin stdio MCP adapter, per-profile target maps, live sync/read/write safety и green validation | done |
| 29 | Снять публичный suffix `-v2` с plugin naming, source/dist docs, theme contract и public `data-*` markers, сохранив `popskraft/carrd-v2` runtime path и backward-compat aliases | done |
| 30 | Выполнить clean-runtime plan: Stage 1 repo cleanup + Stage 2 test/remediation завершены; clean runtime подтверждён (`npm run validate`, 187/187 JS/unit/integration tests, clean-contract green) | done |
| 31 | Продолжить миграционный этап: `cardbuilder/main-template` синхронизирован; `faktura` опубликован и post-publish verified 2026-07-02 на current clean runtime (`embed08/02/03/04/06/05/07/13/09` + `embed10`), clean markup подтверждён для Modal/Cookie/FAQ/Floating CTA/Grid/Slider/Header Nav; следующий шаг — export/install в `faktura-app` | active |
| 32 | Синхронизировать `main-template` Builder draft `4155176224428477` с clean plugin contract: обновить CDN/embed paths без `*-v2`, заменить все live `data-*-v2` / FAQ helper text / modal hash, и добить automation fallback для `#data-modal-v2-contact` | done |
| 33 | Сделать core `cardbuilder` validation machine-independent: убрать hardcoded repo root из `tests-js/site-registry.test.js` и entrypoints `open-debug-chrome.sh` / `refresh-builder-plugins.mjs`, включить `test:cardbuilder` в default `npm run test` | done |
| 34 | Зафиксировать pre-release theme/custom contract в governance и public README: repo-owned delivery assets отдельно от site-owned token overrides, site CSS, `window.CarrdPluginOptions` и site custom JS | done |
| 35 | Переписать public `README.md` как короткий English end-user guide: убрать `Key Ideas`, внутренние repo details и оставить только install/custom/troubleshooting guidance | done |
| 36 | Унифицировать все plugin README: ввести минимальный source contract, deterministic template generation, bundle/add-on и placement-aware install blocks, пересобрать `dist/` и закрепить contract tests | done |
| 37 | Первым делом удалить switcher cluster mode: `main-template` draft `cases` уже переведён на `data-switcher-target` + indexes `1..3`, runtime/config/tests/docs удалены и `npm run validate` зелёный; published `mini.crd.co` всё ещё на старом cluster markup и ждёт operator publish + post-publish live verify | active |
| 38 | Закрыть Q003: удалить неиспользуемый `data-shopping-cart-target` из runtime config, active contracts и `main-template` automation; закрепить единый Section Break/form/output checkout contract | done |
| 39 | Закрепить Q005: считать `main-template` Builder + `mini.crd.co` единым canonical smoke surface; после строки 37 добавить недостающие fixtures всех 13 plugins, smoke-матрицу и fresh desktop/mobile inventory | active |
| 40 | Удалить obsolete migration workspace, его snapshots, docs и active references; перенести скрытую Playwright dependency в `faktura` automation | done |
| 41 | Восстановить `shopping-cart` checkout на нативной Carrd custom form: runtime снова ищет textarea `name="order-details"` внутри `#form-shopping-cart` как fallback после `data-shopping-cart-output`, `dist/` пересобран, draft `4155176224428477` синхронизирован свежим JS; published `mini.crd.co` ждёт operator publish | active |
| 42 | Исправить CSS-минификатор: сохранять compound selectors после `:is()` без ложного descendant-пробела, усилить reset margin для `floating-cta`, полностью пересобрать `dist/` и подтвердить `npm run validate` | done |
| 42 | Автоматический MCP-онбординг сайта: `onboard_site` tool + `npm run onboard:site` (инвентаризация с stability-check, детерминированный keygen из `mutation-catalog.json`, coverage/contract self-check, write probe c auto-enable `state-write`, идемпотентный drift re-run); CDP timeout + U+2028/29 escaping + lint coverage `cardbuilder/scripts`; live-прогоны main-template/faktura ждут оператора | active |
| 43 | Новый плагин `stacker` (scroll-stack containers по `data-stacker` + alias `data-stacked`): реализован, 14 jsdom-тестов, live-verified оператором на `mini.crd.co` через inline embed; включён в CDN bundle `theme-core` (`bundle.config.json`), dist пересобран; остаётся push + jsDelivr purge | active |
