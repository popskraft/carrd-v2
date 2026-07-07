# Открытые Вопросы

## Суть
Открыты два вопроса по `stacker` и по устаревшему accordeon-fixture. Новая линия `carrd-v2` остаётся clean-only, без V2/legacy compatibility tails.

## Ядро
- Q010 — `stacker`: канонический атрибут `data-stacker` принят, `data-stacked` поддержан как alias (текущая разметка `carrd-source` и Builder использует `data-stacked`). Мигрировать разметку на канон или закрепить alias постоянно? Решить после live-теста.
- Q011 — `tests-js/accordeon.test.js` (carrd-source ppf structure) падает: обновлённый `carrd-source/index.html` больше не содержит accordeon-разметку. Обновить fixture или тест. Дрейф возник до работ по stacker.

## Детали
Решённые архитектурные вопросы оформляются как ADR в `docs/decisions/` и удаляются из этой таблицы. Вопросы по tooling вне runtime repo ведутся в workspace, которому принадлежит этот tooling.

## Решённые
- Q005 → `docs/decisions/canonical-live-smoke-surface.md` (`main-template` Builder + `mini.crd.co` published являются единым canonical smoke surface; `faktura` остаётся secondary integration surface, `faktura-app` не считается Carrd smoke surface).
- Q002 → `docs/decisions/switcher-target-only-contract.md` (cluster mode удаляется полностью; сначала `main-template` переводится на `data-switcher-target` + explicit indexes, затем удаляются runtime/config/tests/docs).
- Q003 → `docs/decisions/shopping-cart-checkout-contract.md` (`data-shopping-cart-target` удалён как неиспользуемый marker; checkout contract — Section Break `shopping-cart`, form `form-shopping-cart`, textarea `data-shopping-cart-output="order-details"`).
- Q004 → `docs/decisions/clean-runtime-contract.md` (владелец выбрал clean-only runtime для `carrd-v2`; compatibility tails удаляются до live migration, старая линия остаётся в `popskraft/carrd-plugins`).
- Q008 → `docs/decisions/legacy-alias-feature.md` (legacy `[data-*]` alias-фича завершена, закоммичена, опубликована и live-verified).
- Q009 → `test:cardbuilder` переведён в machine-independent режим: `tests-js/site-registry.test.js` больше не шьёт абсолютные repo paths, core entrypoints `cardbuilder/scripts/carrd/open-debug-chrome.sh` и `refresh-builder-plugins.mjs` вычисляют repo root динамически, а `test:cardbuilder` включён в default `npm run test`.
