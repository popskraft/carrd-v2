# Открытые Вопросы

## Суть
Открытые вопросы касаются live-проверок и точной классификации отдельных clean-contract markers перед миграцией сайтов. Общая политика решена: новая линия `carrd-v2` становится clean-only, без V2/legacy compatibility tails.

## Ядро
| ID | Вопрос | Блокирует | Нужно к | Статус |
|---|---|---|---|---|
| Q002 | Является ли `data-switcher-cluster` first-class primary path или advanced compatibility path? | Силу public docs для cluster mode | После live cluster smoke | open |
| Q003 | Должен ли `data-shopping-cart-target` остаться public guidance или стать compatibility-only guidance? | Финальный checkout setup mental model | После live Builder checkout pass | open |
| Q005 | Какие реальные Carrd pages являются canonical smoke-test surfaces для hash/grouped/floating/structural plugin families? | Повторяемый live validation track | До следующего live migration pass | open |
| Q007 | Нужно ли считать `koryphey-online` историческим migration workspace или продвигать его в first-class live-site registry? | Финальную самостоятельность `cardbuilder` registry | Перед расширением registry scope | open |
| Q009 | `site-registry.test.js` содержит хардкодные абсолютные пути `/Users/popskraft/Projects/carrd-v2/...` и не проходит вне машины автора. Нужно решить: либо сделать эти assertions машинно-независимыми (вычислять ожидаемый путь через `path.resolve(__dirname, '..', ...)` вместо литерала), либо официально пометить файл как machine-only и исключить из CI/sandbox. Сейчас он уже исключён из `test:js`, но `test:cardbuilder` его включает без предупреждения. | Возможность запускать `test:cardbuilder` в CI или на другой машине | Перед подключением CI или передачей проекта | open |

## Детали
Решённые архитектурные вопросы оформляются как ADR в `docs/decisions/` и удаляются из этой таблицы. Вопросы по tooling вне runtime repo ведутся в workspace, которому принадлежит этот tooling.

## Решённые
- Q004 → `docs/decisions/clean-runtime-contract.md` (владелец выбрал clean-only runtime для `carrd-v2`; compatibility tails удаляются до live migration, старая линия остаётся в `popskraft/carrd-plugins`).
- Q008 → `docs/decisions/legacy-alias-feature.md` (legacy `[data-*]` alias-фича завершена, закоммичена, опубликована и live-verified).
