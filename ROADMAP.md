# Дорожная Карта

## Суть
`carrd-v2` готов как runtime repo версии `2.0.0`: source/dist используют `*-v2`, `theme-core-v2`, `Carrd*V2` globals и `popskraft/carrd-v2@main` snippets. `cardbuilder` перенесён в `carrd-v2` и закреплён как самостоятельный рабочий workspace. Все 9 plugin JS-ов получили backward-compat слои: поддержку v1-атрибутов (`data-slider`, `data-switcher`, `data-modal` и т.д.) и fallback на `CarrdPluginOptions` — v2 плагины теперь работают на сайтах без обновления секций в Carrd Builder.

## Ядро
| # | Работа | Статус |
|---|---|---|
| 1 | Зафиксировать `docs/` как active durable-docs root | done |
| 2 | Нормализовать root `AGENTS.md`, `README.md`, `CLAUDE.md`, `DEFINITION-OF-DONE.md`, `OPEN-QUESTIONS.md` и `docs/INDEX.md` под текущий documentation canon | done |
| 3 | Создать `popskraft/carrd-v2` как отдельный runtime repo для второй версии | done |
| 4 | Формализовать v2 publication contract без публикации v2 в legacy `popskraft/carrd-plugins` | done |
| 5 | Перевести source/dist на `*-v2` public identity, `theme-core-v2`, `Carrd*V2` globals и `popskraft/carrd-v2@main` snippets | done |
| 6 | Применить audit fixes: shopping-cart text escaping, slider ARIA region label, modal refresh API, FAQ rAF height adjustment, cookie Secure flag | done |
| 7 | Сохранить legacy `popskraft/carrd-plugins` историческим freeze ref перед публичным v2 rollout | done |
| 8 | Опубликовать validated `popskraft/carrd-v2` main/tag `v2.0.0` и purge только v2 jsDelivr paths | done |
| 9 | Перенести `admincarrd` и `cardbuilder` из legacy workspace в `carrd-v2` и обновить локальные связи | done |
| 10 | Проверить live-синхронизацию нескольких controllers с одинаковым `data-switcher-v2` | active |
| 11 | Проверить live cluster-переключение целых containers через `data-switcher-v2-cluster` | active |
| 12 | Проверить `accordeon` на рабочем Carrd-сайте на группе `ppf` | active |
| 13 | Проверить promoted `header-nav` anti-jump mobile collapse на рабочем Carrd-сайте | active |
| 14 | Закрепить `cardbuilder` operational canon без внешних workspace-зависимостей | done |
| 15 | Довести `lunar-auto-film` до full scan: published URL, published-site scan, post-scan status | active |
| 16 | Довести `faktura` до canonical scan package и обновить Builder draft на v2 plugins | done |
| 17 | Расширить broken-link/legacy-root проверку с operational canon на критические `cardbuilder/docs/` indexes и runbooks | active |
| 23 | Закрепить per-site Chrome-профили: добавить `chromeProfileDir` в `sites.json`, перевести `open-debug-chrome.sh` на чтение из реестра, задокументировать в quickstart | done |
| 24 | Добавить `CARRD_KNOWLEDGE_SOURCES.md` — инструкция по доступу к docs-rag-mvp RAG-сервису, ссылка из `cardbuilder/AGENTS.md` и `shared/INDEX.md` | done |
| 18 | После operator publish для `faktura` снять post-publish scan и подтвердить published runtime v2 plugins | active |
| 19 | Добавить backward-compat слои во все 9 interactive plugin JS: поддержка v1-атрибутов и `CarrdPluginOptions` fallback | done |
| 20 | Заменить все plugin embeds в faktura draft на свежие v2 (backward-compat) и перевести `embed10` config на `CarrdPluginOptionsV2`; publish остаётся operator-only | done |
| 21 | Полный readiness-аудит v2 (4 параллельные проверки + adversarial verify): расширить config-fallback на typography/header-nav/no-loadwaiting/shopping-cart, legacy data-attrs + `CarrdShoppingCart` alias для shopping-cart, modal lazy `[data-modal]` lookup | done |
| 22 | Добавить backward-compat тесты (`tests-js/backward-compat.test.js`, helper `setLegacyPluginOptions`): v1-атрибуты + v1-config + V2-precedence, 13 тестов | done |
| 25 | Закрыть container-scoped CSS alias-гэп: faq/cookie/modal (`1ac3dd4`) + найденный switcher гэп (`eca34b3`); systematic-скан подтвердил отсутствие других tails; пересобрать dist (`ab0eee6`); validate 189/189 | done |
| 26 | Синхронизировать faktura Builder с alias-fixed dist (`automation/sync-v2-embeds.mjs`, embed02/03/07, hash-readback 3/3); опубликовано оператором; live verify `faktura-dev.crd.co` подтверждает fixed FAQ/modal/cookie scope | done |
