# Открытые Вопросы

## Суть
Открытые вопросы касаются только live-проверок и долгосрочной политики fallback после v2 rollout.

## Ядро
| ID | Вопрос | Блокирует | Нужно к | Статус |
|---|---|---|---|---|
| Q002 | Является ли `data-switcher-v2-cluster` first-class primary path или advanced compatibility path? | Силу public docs для cluster mode | После live cluster smoke | open |
| Q003 | Должен ли `data-shopping-cart-v2-target` остаться public guidance или стать compatibility-only guidance? | Финальный checkout setup mental model | После live Builder checkout pass | open |
| Q004 | Какие legacy fallbacks остаются постоянными, а какие удаляются после freeze? Backward-compat слой теперь покрывает все interactive плагины (v1-атрибуты + `CarrdPluginOptions` fallback + `CarrdShoppingCart` alias) и закреплён тестами — нужно решить, это permanent contract или temporary migration aid | Финальную supported-vs-temporary policy | После live migration pass | open |
| Q005 | Какие реальные Carrd pages являются canonical smoke-test surfaces для hash/grouped/floating/structural plugin families? | Повторяемый live validation track | До следующего live migration pass | open |
| Q007 | Нужно ли считать `koryphey-online` историческим migration workspace или продвигать его в first-class live-site registry? | Финальную самостоятельность `cardbuilder` registry | Перед расширением registry scope | open |

## Детали
Решённые архитектурные вопросы оформляются как ADR в `docs/decisions/` и удаляются из этой таблицы. Вопросы по tooling вне runtime repo ведутся в workspace, которому принадлежит этот tooling.

## Решённые
- Q008 → `docs/decisions/legacy-alias-feature.md` (legacy `[data-*]` alias-фича завершена, закоммичена, опубликована и live-verified).
