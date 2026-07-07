# Открытые Вопросы

## Суть
Открытых вопросов нет. Новая линия `carrd-v2` использует clean source/runtime contract для новых installs и временные compatibility delivery tails только для безопасного rollout существующих `@main` consumers.

## Ядро
Нет открытых вопросов.

## Детали
Решённые архитектурные вопросы оформляются как ADR в `docs/decisions/` и удаляются из этой таблицы. Вопросы по tooling вне runtime repo ведутся в workspace, которому принадлежит этот tooling.

## Решённые
- Q005 → `docs/decisions/canonical-live-smoke-surface.md` (`main-template` Builder + `mini.crd.co` published являются единым canonical smoke surface; `faktura` остаётся secondary integration surface, `faktura-app` не считается Carrd smoke surface).
- Q002 → `docs/decisions/switcher-target-only-contract.md` (cluster mode удаляется полностью; сначала `main-template` переводится на `data-switcher-target` + explicit indexes, затем удаляются runtime/config/tests/docs).
- Q003 → `docs/decisions/shopping-cart-checkout-contract.md` (`data-shopping-cart-target` удалён как неиспользуемый marker; checkout contract — Section Break `shopping-cart`, form `form-shopping-cart`, textarea `data-shopping-cart-output="order-details"`).
- Q004 → `docs/decisions/clean-runtime-contract.md` (владелец выбрал clean source/runtime contract для `carrd-v2`; compatibility tails разрешены только как repo-owned rollout artifacts `theme-core.*` / `theme-ui.css` до завершения controlled migration, старая линия остаётся в `popskraft/carrd-plugins`).
- Q008 → `docs/decisions/legacy-alias-feature.md` (legacy `[data-*]` alias-фича завершена, закоммичена, опубликована и live-verified).
- Q009 → `test:cardbuilder` переведён в machine-independent режим: `tests-js/site-registry.test.js` больше не шьёт абсолютные repo paths, core entrypoints `cardbuilder/scripts/carrd/open-debug-chrome.sh` и `refresh-builder-plugins.mjs` вычисляют repo root динамически, а `test:cardbuilder` включён в default `npm run test`.
- Q011 → `tests-js/accordeon.test.js` снова зелёный (11/11); прежний fixture-дрейф carrd-source устранён. `tests/test_admincarrd_*` php-тесты теперь `skipUnless(shutil.which("php"))`, поэтому `npm run test` машинно-независим и без php (skipped, не error).
- Q010 → канонический атрибут `data-stacker` подтверждён как единственная активная форма; legacy alias `data-stacked` в runtime сохранён для внешних/устаревших разметок, но больше не используется в active markup. `main-template` Builder мигрирован (`container22`/`container23`/`container24`, группа `stack`): `data-stacked=stack` → `data-stacker=stack`, опубликовано и live-verified на `mini.crd.co` 2026-07-07.
- Q004-follow-up → theme token contract split (`theme-runtime` + `theme-design-tokens-embed.html`) опубликован на `main-template`/`mini.crd.co` 2026-07-07 (тег `v2.1.0`): `embed14`/`embed02` переведены с `theme-core@main` на `theme-runtime@2.1.0`, новый Head-embed `embed03` несёт токены-примитивы; live-verified — все `--theme-*` токены резолвятся, 6 slider / 3 switcher / 3 stacker / 1 modal без регрессий. Individual add-on plugins (`shopping-cart`, `cookie-banner`, `no-loadwaiting`) остаются на мутабельном `@main` — version-pin для них не в этом заходе.
