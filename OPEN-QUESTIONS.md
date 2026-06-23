# Открытые Вопросы

## Суть
Открытые вопросы касаются только live-проверок и долгосрочной политики fallback после v2 rollout.

## Ядро
| ID | Вопрос | Блокирует | Нужно к | Статус |
|---|---|---|---|---|
| Q001 | Остаётся ли `header-nav` approved structural exception без публичного `data-*` contract? | Финальный public contract `header-nav` | После live anti-jump проверки | open |
| Q002 | Является ли `data-switcher-v2-cluster` first-class primary path или advanced compatibility path? | Силу public docs для cluster mode | После live cluster smoke | open |
| Q003 | Должен ли `data-shopping-cart-v2-target` остаться public guidance или стать compatibility-only guidance? | Финальный checkout setup mental model | После live Builder checkout pass | open |
| Q004 | Какие legacy fallbacks остаются постоянными, а какие удаляются после freeze? | Финальную supported-vs-temporary policy | После live migration pass | open |
| Q005 | Какие реальные Carrd pages являются canonical smoke-test surfaces для hash/grouped/floating/structural plugin families? | Повторяемый live validation track | До следующего live migration pass | open |

## Детали
Решённые архитектурные вопросы оформляются как ADR в `docs/decisions/` и удаляются из этой таблицы. Вопросы по tooling вне runtime repo ведутся в workspace, которому принадлежит этот tooling.
