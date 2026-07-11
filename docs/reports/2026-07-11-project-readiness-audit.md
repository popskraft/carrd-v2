# Аудит готовности carrd-v2 к запуску и продаже

Дата: `2026-07-11`

Роли: `project-reviewer` + `project-cleaner`

Режим: full technical, user, operational and commercial-readiness audit.

## 1. Итог

Проект готов к ограниченному техническому пилоту и внутреннему запуску, но не к полностью самостоятельной продаже без владельца. Runtime и delivery уже сильные: локальный release gate зелёный, `v2.1.0` опубликован, production site использует version-pinned CDN refs, а plugin surface покрыт тестами. Главные оставшиеся блокеры находятся на границе Carrd Editor → покупатель → поддержка.

**Итоговая оценка готовности к продаже: 3.5/5 — условно готов, требуется закрыть P1 до публичной продажи.**

## 1.1. Разделение вопросов

### Часть A — можно закрыть без owner/business approval

Эти пункты закрыты сейчас на уровне repository/process/documentation и имеют **5/5** в своей области:

- `A-01 Build reproducibility` — `npm run validate` зелёный; `dist` совпадает с clean rebuild.
- `A-02 Test/coverage gates` — 254 JS, 27 Cardbuilder и 37 Python tests; coverage/lint/dead-code/budget gates проходят.
- `A-03 Release immutability` — `VERSION=2.1.0`, release tags существуют, release contract запрещает moving tags.
- `A-04 Documentation placement` — readiness report находится в `docs/reports/`, index обновлён.
- `A-05 Browser-smoke definition` — создан [browser-smoke-contract.md](../specs/browser-smoke-contract.md) с конкретным PASS/FAIL/BLOCKED protocol.
- `A-06 Local link integrity` — относительные Markdown links проверены, missing targets: `0`.
- `A-07 Bundle fault isolation` — shared bundles изолируют plugin initialization errors, записывают их в `window.CarrdPluginRuntimeErrors` и не скрывают через `console.error`; добавлены contract tests.

Эти пункты не означают, что live site уже прошёл smoke. Они означают, что процесс проверки теперь определён и локальная инженерная база доказана.

### Часть B — требует owner/operator/business решения

- `B-01` — обновить stale Builder evidence package и снять fresh readback package: direct readiness уже подтверждает authenticated Builder, но canonical artifacts/manifests отстают.
- `B-02` — заменить live `no-loadwaiting@b910f70` на `@2.1.0` через operator-approved Builder update и publish; код commit-а совпадает по SHA256, но provenance сейчас неправильный.
- `B-03` — закрыть Q015 round-trip новых `data-*` атрибутов через Carrd Editor.
- `B-04` — выбрать license/EULA, цену, refund, privacy и support terms.
- `B-05` — выбрать delivery model: frozen snapshot или managed updates.
- `B-06` — определить, обещает ли Shopping Cart только order UI/form serializer или полноценный ecommerce.
- `B-07` — разрешить/спланировать security behavior `typography`: escape text или поддерживать trusted inline markup.
- `B-08` — разрешить production publish после исправления live drift.

## 1.2. Что делать с фразой про Carrd JavaScript

Фраза уточнена в [browser-smoke-contract.md](../specs/browser-smoke-contract.md). Практический смысл:

1. `npm run validate` проверяет source/build/contracts в локальной среде.
2. Browser smoke проверяет опубликованный Carrd DOM, порядок Embed-скриптов, реальный CDN, viewport и uncaught exceptions.
3. Только оба gate вместе дают достаточную pre-sale evidence.
4. Если browser smoke невозможен или live refs расходятся с release contract, verdict — `BLOCKED/FAIL`, а не «наверное работает».

- Технологическая готовность: **4.2/5**.
- Пользовательская готовность установки: **3.0/5**.
- Эксплуатационная готовность: **2.9/5**.
- Коммерческая готовность: **2.3/5**.
- Документальная/память проекта: **3.9/5**.

Это не означает, что продукт плохой. Это означает, что инженерная основа опережает customer-facing упаковку.

## 2. Доказательная база

- `npm run validate` — PASS: generated `dist`, bundle budget, clean contract, dead-code, Python tests `37/37`, JS runtime tests `254/254`, Cardbuilder tests `27/27`, coverage gates и lint.
- `VERSION` — `2.1.0`; tags `v2.0.0` и `v2.1.0` существуют; release contract запрещает перемещать опубликованные tags.
- `cardbuilder/projects/main-template/data/inventories/live-plugin-inventory.json` — последний сохранённый live/published inventory от `2026-07-07`, все 15 plugin entries обнаружены, published runtime version-pinned.
- `cardbuilder/projects/main-template/data/manifests/knowledge-status.json` — builder-static scan от `2026-06-29`, template-instance scan от `2026-07-07`; для текущего аудита это уже stale evidence.
- Fresh direct readiness check `2026-07-11` — `connected=true`, `authenticated=true`, `builder-ready=true`, `site-resolved=true`, но `profile-freshness=stale` и `safe-to-edit=false`, потому что builder-static scan устарел на `12` дней.
- Fresh direct Builder mutation/readback `2026-07-11` — draft temporarily accepted `embed08 -> @2.1.0`, `control03:data-shopping-cart-checkout-target=shopping-cart-section`, `container12:data-modal-close-on-overlay=off`, `container11:data-slider-arrows-mobile=on`, but all values disappeared after `location.reload()`. This proves current write path is not yet persistent enough to close Q015.
- Fresh direct publish attempt `2026-07-11` — `window.app.builder.ui.quickPublish()` reached the publish surface but ended with Carrd message `Publish Failed :(`; published site remained unchanged.
- `b910f70` — реальный commit `main` от `2026-07-09` (`Restore theme container background-color utilities`); SHA256 `no-loadwaiting.min.js` совпадает с `v2.1.0`, но commit ref нарушает immutable SemVer contract.
- `npm run check:published` — ожидаемый FAIL на текущем `mini.crd.co`: найден `@b910f70`, ожидается только `@2.1.0`.
- `check:tabs-drift` — DRIFT: baseline `96` elements против latest `106`, добавлено `11`, удалено `1`, изменились type-patterns для `3` типов.
- Health scorer — `7.9/10`, good; слабые зоны: `CLAUDE.md`, `docs/INDEX.md`, `OPEN-QUESTIONS.md`, actionability и governance alignment отдельных owner-docs.
- Внешняя проверка: Carrd разрешает custom HTML/CSS/JS через Embed, но официально предупреждает, что ошибка JavaScript может сломать загрузку сайта; jsDelivr рекомендует новый SemVer tag и purge при критическом исправлении. См. [Carrd custom code docs](https://carrd.co/docs/building/embedding-custom-code), [Carrd troubleshooting](https://carrd.co/docs/building/troubleshooting), [jsDelivr release guidance](https://github.com/jsdelivr/jsdelivr).

## 3. Полная таблица рисков и действий

Оценка: `0` — отсутствует, `5` — отлично. Priority: `P0` — немедленный blocker, `P1` — закрыть до публичной продажи, `P2` — закрыть в ближайшем цикле, `P3` — улучшение.

| ID | Область | Риск/сложность | Доказательство | Балл сейчас | Приоритет | Что сделать | Критерий готовности | Усилие |
|---|---|---|---|---:|---|---|---|---|
| R-01 | Live/Carrd | Canonical Builder evidence package stale, поэтому live readiness формально не закрыт | direct readiness `2026-07-11`: `connected/authenticated/builder-ready=true`, но `profile-freshness=stale`, `safe-to-edit=false` | 3/5 | P1 | Переснять component/readiness/tab scan и обновить snapshots/manifests/knowledge-status под текущий Builder | Все flags зелёные и freshness restored without unexplained drift | S |
| R-02 | Live/Carrd | `data-*` миграция ещё не подтверждена редактором Carrd на всех нужных типах | direct write/readback `2026-07-11`: attrs видны в draft runtime, но после `location.reload()` откатываются; published DOM unchanged | 2/5 | P1 | Найти persistent Carrd write path и повторить round-trip: write → save/draft readback → published DOM readback для modal/cart/slider attrs | Q015 закрыт только после сохранения значений через reload и published smoke | M |
| R-03 | Release | Published HTML использует mutable commit ref вместо SemVer | `b910f70` — реальный `main` commit после `v2.1.0`; bytes совпадают, provenance не совпадает | 2/5 | P1 | Через operator-approved Builder update заменить ref на `@2.1.0`; затем повторить `check:published` и browser smoke | Все repo-owned refs согласованы с `VERSION`, tag и release packet; smoke PASS | S |
| R-04 | Browser QA | jsdom/axe smoke не доказывает реальное mobile/browser/CDN поведение | `npm run validate` зелёный; browser-smoke contract и published-ref checker добавлены, full interactive matrix ещё не пройдена | 3/5 | P1 | Прогнать smoke matrix: Chrome/Safari, mobile width, keyboard, touch, reload, slow CDN, no-JS fallback | Все critical journeys проходят на реальном published site; ошибки console/network = 0 | M |
| R-05 | User onboarding | Установка требует ручного копирования нескольких embeds, точных атрибутов и Carrd-specific placement | root README и plugin READMEs; Carrd custom-code errors могут ломать сайт | 3/5 | P1 | Сделать один customer install guide: prerequisites, 10-minute path, screenshots/video, rollback, checklist | Новый пользователь без repo context устанавливает template по одному runbook и проходит smoke | M |
| R-06 | User onboarding | Нет единого «что входит / что не входит» пакета | README объясняет install, но не customer deliverables, support boundary, update policy | 2/5 | P1 | Создать sales/delivery pack: included assets, exclusions, compatibility, update policy, support SLA | Покупатель понимает результат, ограничения и следующий шаг до оплаты | S |
| R-07 | Commercial | В репозитории не найдено license/EULA, pricing, refund, terms, privacy/support policy | `rg` не нашёл отдельного commercial/legal слоя; есть только технический `LICENSE`-like сигнал отсутствует | 1/5 | P1 | Утвердить лицензию шаблона, scope использования, transfer/resale rules, refund/support terms и privacy notice | Legal/customer docs опубликованы и связаны с checkout/delivery; владелец подтвердил формулировки | M |
| R-08 | Commercial | Не доказан end-to-end sales funnel и delivery automation | ROADMAP фиксирует hero → proof → offer → comparison → FAQ → contact, но нет evidence оплаты, delivery и post-sale handoff | 2/5 | P1 | Прогнать тестовую покупку: payment/manual order → access → install → support request → update | Один тестовый customer journey полностью воспроизводим и измерим | M |
| R-09 | Support | Нет публичного troubleshooting/diagnostic protocol для покупателя | Технические READMEs есть, но support process и known failure signatures не оформлены | 2/5 | P1 | Добавить support checklist: URL, version, browser, screenshot, console error, embed inventory, rollback | Типовая проблема диагностируется за один ответ без доступа к приватному проекту | S |
| R-10 | Runtime security | `typography` вставляет авторский HTML без явного escaping при markdown-like conversion | `src/typography/typography.js`: `content` попадает в generated heading/list HTML | 3/5 | P2 | Либо escape text before conversion, либо явно документировать trusted-author boundary и добавить security tests | Untrusted text cannot create tags/handlers; intentional markup has отдельный sanitized path | M |
| R-11 | Runtime security | CDN JavaScript — внешний single delivery dependency; SRI/CSP для customer sites не оформлены | `dist/*-cdn.html` uses jsDelivr; site-owned Carrd policy varies | 3/5 | P2 | Зафиксировать threat model, fallback/rollback, optional SRI guidance и CDN outage behavior | Security decision documented; customer knows impact and recovery | S |
| R-12 | Ecommerce | Shopping cart — client-side cart/localStorage, не payment/order backend | `src/shopping-cart/shopping-cart.js`; no backend/database/payment integration detected | 2/5 | P1 | В продуктовой упаковке назвать его UI/order serializer, а не полноценным ecommerce; отдельно specify Carrd form/email limits | README, demo и sales copy одинаково описывают limitation; payment flow не обещается | S |
| R-13 | Data/privacy | Cart persists in browser localStorage; cookie banner stores consent cookie, but privacy/data retention guidance отсутствует | runtime uses `localStorage` and `document.cookie` | 3/5 | P1 | Описать keys, retention, consent scope, clearing path, no-sensitive-data rule | Privacy note и user-facing behavior согласованы; no personal/payment data in cart state | S |
| R-14 | Accessibility | Strong contract coverage, но axe охватывает не все interactive surfaces | `axe-a11y.test.js` covers modal/faq/accordeon/switcher; separate cart/header-nav browser proof absent | 4/5 | P2 | Расширить axe/real-browser checks на cart, header-nav, slider, cookie banner, reduced-motion | Critical surfaces pass axe + keyboard/mobile smoke | M |
| R-15 | Maintainability | Large owner files concentrate regression risk | prior audit: `minify_plugins.py` 1281 LOC, `onboarding-core` 802, cart 799, slider 716, modal 541 | 3/5 | P2 | Refactor only on touch: split validation/storage, navigation/drag, onboarding phases | No file grows beyond agreed hotspot threshold without owner decision | M/L |
| R-16 | Coverage | `src` and `cardbuilder` have numeric gates; `admincarrd` remains blind spot | prior audit and current package scripts | 3/5 | P2 | Add PHP smoke/static/security gate or document explicit exception | Admin module has repeatable minimum safety gate in CI | M |
| R-17 | Performance | Several bundles close to budget | validate: modal `10.8/12KB`, switcher `9.7/12KB`, cart `20.3/24KB`, slider `17.1/22KB` | 3/5 | P2 | Track gzip/transfer budgets and mobile performance on published demo; split only by measured ROI | No critical bundle regresses budget or mobile interaction | M |
| R-18 | Documentation | ROADMAP contains a long completed-task table; OPEN-QUESTIONS contains resolved history | current `ROADMAP.md`, `OPEN-QUESTIONS.md`; violates active-only/unresolved-only memory rule | 2/5 | P2 | Cleaner pass: preserve decisions in owner docs/archive, leave only active rows/questions | ROADMAP active-only; OPEN-QUESTIONS open-only; INDEX points to owners | M |
| R-19 | Documentation | Absolute local paths leak into active Cardbuilder docs and reduce portability | multiple `cardbuilder/docs/**` links contain `/Users/popskraft/Projects/carrd-v2` | 2/5 | P2 | Convert public/shared docs to repo-relative links; keep absolute paths only in local operational data where required | Shared docs work on another checkout and do not expose author filesystem paths | S |
| R-20 | Documentation | `CLAUDE.md`/some owner docs score weak on actionability/governance | health report: `CLAUDE.md 5.2`, `docs/INDEX.md 6.8`, several specs low actionability | 3/5 | P3 | Normalize only schema/actionability; keep CLAUDE as one-line bridge | Health scorer no longer flags root bridge/index actionability | S |
| R-21 | Product | Template quality depends on customer content, Carrd plan, fonts, forms, domain and brand assets | inferred from Carrd embed/install model and current funnel docs | 3/5 | P1 | Add compatibility matrix: Carrd plan, browsers, forms, custom domain, fonts, plugins, known conflicts | Customer prerequisites are explicit before purchase; unsupported combinations are rejected | S |
| R-22 | Operations | Publish/save is operator-only; customer self-service updates are not defined | `active-template.json`: `savePublishPolicy=operator-only` | 3/5 | P1 | Choose support model: delivered frozen snapshot vs managed updates; document exact ownership and rollback | Customer can tell who owns Carrd edit/publish and how updates are delivered | S |

## 4. Dimension scorecard

| Dimension | Score | Interpretation |
|---|---:|---|
| Goal clarity | 4.0 | Strong technical goal; commercial goal and target buyer are implicit rather than fully specified |
| Completeness | 3.0 | Runtime/release complete; sales, legal, support and browser proof incomplete |
| Consistency | 3.5 | Source/dist/release contracts align; live knowledge and active-memory docs drift |
| Feasibility | 4.0 | Existing tooling makes remediation practical; live Carrd dependency remains external |
| Testability | 4.2 | Excellent local tests and coverage; real browser/customer journey gap |
| Dependency awareness | 3.4 | CDN/Carrd/Builder dependencies documented technically, not yet in customer promise |
| Risk handling | 3.2 | Release risks are handled well; privacy, support, legal and outage risks under-specified |
| Operational practicality | 3.0 | Owner can operate it; a buyer cannot yet operate it independently |

## 5. Что уже можно продавать

Можно продавать как **managed pilot / founder-assisted template delivery**:

- frozen Carrd template on `@2.1.0`;
- limited number of buyers;
- installation performed or supervised by the owner;
- explicit statement that shopping-cart is a client-side order UI/form serializer, not a payment gateway;
- support includes one compatibility check and one post-install smoke.

Нельзя пока обещать как self-service product:

- «установится за 5 минут у любого пользователя»;
- «полноценный ecommerce»;
- «обновления без риска и участия владельца»;
- «работает на любом Carrd plan/browser/site structure»;
- «live-verified» без свежего Builder readback.

## 6. Приоритетный план перед публичной продажей

### День 1–2: снять технические P1

1. Восстановить Builder readiness и закрыть R-01/R-02 свежим readback.
2. Переснять published smoke: all CDN refs, console errors, form/modal/cart/slider/header-nav journeys.
3. Зафиксировать release packet для `2.1.0`: commit/tag, generated dist hash, live URLs, scan timestamps.

### День 3–4: сделать buyer-ready пакет

1. Написать один install runbook и compatibility matrix.
2. Добавить limitations/support/troubleshooting/privacy documents.
3. Утвердить license, refund, support and delivery terms.

### День 5–7: прогнать продажу как тестовый клиент

1. Провести test purchase/delivery.
2. Установить шаблон в чистый Carrd site без repo context.
3. Пройти mobile/desktop/keyboard smoke и собрать evidence.
4. После owner sign-off — только затем расширять продажи.

## 7. Reviewer result

- `role: project-reviewer`
- `task: full technical, user, operational and commercial readiness audit`
- `scope: src, dist, scripts, tests, cardbuilder, admincarrd, canon docs, published/live evidence`
- `status: FAIL for self-service public sale; PASS for limited owner-assisted pilot`
- `missing_evidence: fresh Builder artifact package; persistent Q015 round-trip through reload/publish; browser matrix; sales/delivery test; legal/privacy/support packet; admincarrd numeric/security gate; operator replacement of @b910f70`
- `required_fixes: R-01, R-02, R-03, R-05, R-06, R-07, R-08, R-09, R-12, R-13, R-21, R-22`
- `residual_risks: R-10, R-11, R-14, R-15, R-16, R-17, R-18, R-19, R-20`
- `handoff_to: project-builder for approved remediation; project-release after a PASS`
- `open_risks: Q015 and all P1 rows above`
- `deferred_issues: no product/runtime source changes made during review; direct Builder draft mutations were reproducible but non-persistent, and live publish attempt failed on Carrd side`

## 8. Cleaner result

- `role: project-cleaner`
- `task: lightweight memory-health scan after audit`
- `scope: ROADMAP, OPEN-QUESTIONS, docs/INDEX.md, active owner docs and path hygiene`
- `status: cleanup plan required; no meaning-changing archive performed`
- `memory_health_result: partial drift`
- `cleanup_patch_or_plan: keep ROADMAP active-only; keep OPEN-QUESTIONS unresolved-only; move resolved history to the project’s established archive convention; replace portable-doc absolute links; preserve Q015 as open`
- `docs_changed: this report and docs index`
- `status_sync_result: readiness findings are recorded; product roadmap status remains owner-controlled`
- `remaining_risks: resolved-history blocks and stale live evidence still need a dedicated cleanup/refresh pass`
- `next_action: close P1 readiness and commercial gates before release handoff`
- `handoff_to: project-builder, then project-reviewer re-review`
- `deferred_issues: no deletion/renumbering of decisions or key ideas; no archive move made because existing `docs/_archive/` convention conflicts with generic `docs/archive/` rule and needs owner confirmation`
