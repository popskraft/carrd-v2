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
| Q008 | **[ОЖИДАЕТ OPERATOR PUBLISH]** legacy `[data-*]` alias-фича завершена и закоммичена: CSS-половина (`1ac3dd4`: faq/cookie/modal), JS alias по всем плагинам + найденный switcher CSS-гэп (`eca34b3` feat), пересобранный dist (`ab0eee6` build). Полный systematic-скан подтвердил: faq/cookie/modal/switcher — единственные user-authored container-scoped селекторы; cards/floating киают на JS-stamped runtime-атрибуты (гэпа нет); остальные стилизуются через `.theme-*` классы. Живой Carrd Builder faktura DRAFT синхронизирован детерминированным `automation/sync-v2-embeds.mjs` (map по стабильным ID, сервисные embed01/11/12 и кастомные embed14/10 не тронуты): embed02/embed03/embed07 переписаны из `dist/*-v2/*-embed.html`, before-backup + hash-readback == dist (3/3 match), FAQ scope `:is([data-faq-v2],.FAQContainer)`×14 → `:is([data-faq-v2],[data-faq],.FAQContainer)`×14, Publish-кнопка dirty (`.alert`). **Остаётся:** (1) оператор жмёт Publish; (2) post-publish curl-проверка `faktura-dev.crd.co` показывает fixed scope. Контекст: faktura-app (Laravel) уже исправлен (commit c2294ed). | Post-publish подтверждение живого runtime | После operator publish | open |

## Детали
Решённые архитектурные вопросы оформляются как ADR в `docs/decisions/` и удаляются из этой таблицы. Вопросы по tooling вне runtime repo ведутся в workspace, которому принадлежит этот tooling.
