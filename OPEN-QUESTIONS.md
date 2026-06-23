# Открытые Вопросы

## Суть
Открытые вопросы касаются только live-проверок и долгосрочной политики fallback после v2 rollout.

## Ядро
| ID | Вопрос | Блокирует | Нужно к | Статус |
|---|---|---|---|---|
| Q001 | Остаётся ли `header-nav` approved structural exception без публичного `data-*` contract? | Финальный public contract `header-nav` | После live anti-jump проверки | open |
| Q002 | Является ли `data-switcher-v2-cluster` first-class primary path или advanced compatibility path? | Силу public docs для cluster mode | После live cluster smoke | open |
| Q003 | Должен ли `data-shopping-cart-v2-target` остаться public guidance или стать compatibility-only guidance? | Финальный checkout setup mental model | После live Builder checkout pass | open |
| Q004 | Какие legacy fallbacks остаются постоянными, а какие удаляются после freeze? Backward-compat слой теперь покрывает все interactive плагины (v1-атрибуты + `CarrdPluginOptions` fallback + `CarrdShoppingCart` alias) и закреплён тестами — нужно решить, это permanent contract или temporary migration aid | Финальную supported-vs-temporary policy | После live migration pass | open |
| Q005 | Какие реальные Carrd pages являются canonical smoke-test surfaces для hash/grouped/floating/structural plugin families? | Повторяемый live validation track | До следующего live migration pass | open |
| Q006 | Какой published URL является canonical для `lunar-auto-film`? | Полный `lunar-auto-film` site-package scan и published-site verification | Перед переводом site package в full-scan status | open |
| Q007 | Нужно ли считать `koryphey-online` историческим migration workspace или продвигать его в first-class live-site registry? | Финальную самостоятельность `cardbuilder` registry | Перед расширением registry scope | open |
| Q008 | **[RESOLVED]** legacy `[data-*]` alias-фича завершена, закоммичена и опубликована. Код: CSS-половина (`1ac3dd4`), JS alias по всем плагинам + найденный switcher CSS-гэп (`eca34b3`), пересобранный dist (`ab0eee6`), cardbuilder canon/sync (`fbadfd5`). Systematic-скан: faq/cookie/modal/switcher — единственные user-authored container-scoped селекторы (все покрыты alias); cards/floating киают на JS-stamped runtime-атрибуты (гэпа нет); остальные — через `.theme-*` классы. faktura Builder синхронизирован `automation/sync-v2-embeds.mjs` (embed02/03/07, hash-readback 3/3, сервисные/кастомные embeds не тронуты), опубликован оператором. **Live verify `faktura-dev.crd.co`:** FAQ 14× `:is([data-faq-v2],[data-faq],.FAQContainer)` / 0× old; modal 8× `:is([data-modal-v2],[data-modal])`; cookie 3× `[data-cookie]`. validate 189/189. | — | — | resolved |

## Детали
Решённые архитектурные вопросы оформляются как ADR в `docs/decisions/` и удаляются из этой таблицы. Вопросы по tooling вне runtime repo ведутся в workspace, которому принадлежит этот tooling.
