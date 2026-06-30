# Дорожная Карта

## Суть
`carrd-v2` проходит трёхэтапный clean-runtime cycle: Stage 1 repo cleanup и Stage 2 test/remediation закрыты, Gate 2 пройден зелёным validation suite, следующий активный фронт — последовательная миграция `main-template` -> Carrd `faktura` -> export/install в `faktura-app`.

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
| 11 | Проверить live cluster-переключение целых containers через `data-switcher-cluster` | active |
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
| 31 | Начать миграционный этап: перевести `cardbuilder/main-template`, затем Carrd `faktura`, затем export/install в `faktura-app` с post-migration verify на каждом шаге | active |
| 32 | Синхронизировать `main-template` Builder draft `4155176224428477` с clean plugin contract: обновить CDN/embed paths без `*-v2`, заменить все live `data-*-v2` / FAQ helper text / modal hash, и добить automation fallback для `#data-modal-v2-contact` | done |
