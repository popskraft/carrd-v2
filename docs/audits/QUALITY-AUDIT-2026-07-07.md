# Аудит качества кода — carrd-v2

Дата: `2026-07-07`

## Top findings

1. Репозиторий теперь хорошо защищён release-gates (`validate`, coverage, `knip`, bundle budget, CI parity): `src/**` закрыт на `100%`, а `cardbuilder/**` получил отдельный numeric coverage-owner. Главный оставшийся blind spot — `admincarrd/**`.
2. Главный техдолг не в тестовой дисциплине, а в maintainability hotspots: [`scripts/minify_plugins.py`](../../scripts/minify_plugins.py), [`cardbuilder/scripts/carrd/lib/onboarding-core.mjs`](../../cardbuilder/scripts/carrd/lib/onboarding-core.mjs), [`src/shopping-cart/shopping-cart.js`](../../src/shopping-cart/shopping-cart.js), [`src/slider/slider.js`](../../src/slider/slider.js), [`src/modal/modal.js`](../../src/modal/modal.js).
3. Кодовая документация всё ещё слабее проектной документации, но публичный API `switcher`, `faq`, `header-nav`, `slider` уже получил базовый JSDoc-слой; основной remaining gap теперь в крупных owner-файлах вроде `shopping-cart` и `modal`.
4. Accessibility и security находятся выше среднего: есть a11y-contract tests, `axe-core` smoke layer для критичных interactive widgets и CSP/HSTS/security headers в `admincarrd`.

## Stack Profile

```text
Backend:   product backend not detected; local tooling in Python 3; admin module in PHP
Frontend:  Vanilla JS + vanilla CSS plugins for Carrd
Admin:     Carrd Builder automation (`cardbuilder`) + PHP admin module (`admincarrd`)
Database:  none detected; browser LocalStorage in shopping-cart
Tests:     Node test runner + jsdom + Python unittest
Build:     pnpm scripts + Python build pipeline
CSS:       vanilla CSS with design tokens
CI/CD:     GitHub Actions (`pnpm run validate`)
```

## 1. Code Coverage — 88/100 🟢

**Что измеряет**: реальное тестовое покрытие выполняемого кода и наличие coverage-gates.

**Влияние**: plugin-runtime защищён очень хорошо, но automation/admin refactors всё ещё могут сломаться без числового coverage-сигнала.

**Текущее состояние**:
- [`package.json`](../../package.json) содержит `test:coverage` с порогами `lines=0.9`, `branches=0.85`, `functions=0.9`.
- Тот же файл теперь содержит `test:coverage:cardbuilder` с порогами `lines=0.5`, `branches=0.5`, `functions=0.65`, и этот gate входит в `validate`.
- `npm run validate --silent` прошёл зелёно; coverage report показал `100%` lines / branches / functions для `src/**`.
- Отдельный `cardbuilder` coverage report прошёл зелёно на `54.79%` lines, `53.52%` branches, `68.63%` functions.
- `admincarrd/**` по-прежнему не входит в numeric coverage-report.
- Отдельные тестовые поверхности присутствуют:
  - `tests-js/*.test.js` — plugin runtime и contracts
  - `tests-js/carrd-mcp-*.test.js` + `site-registry.test.js` — `cardbuilder`
  - `tests/test_*.py` — build/admin helpers

**Путь к 100**:
1. Держать `src/**` и `cardbuilder/**` как раздельные coverage owner-ы; не сливать их в один размытый отчёт.
2. Решить, нужен ли coverage для `admincarrd` PHP-слоя; если да — подключить phpunit/pcov или аналогичный smoke-coverage слой.
3. При росте `cardbuilder` повышать пороги поэтапно от текущего базового уровня, а не декларативно.

## 2. Duplication — 76/100 🟡

**Что измеряет**: структурное и концептуальное дублирование.

**Влияние**: прямой copy-paste риск умеренный, но семейство плагинов всё ещё несёт предсказуемую “параллельную” повторяемость.

**Текущее состояние**:
- Архитектура `src/<plugin>/` удерживает один плагин в одном owner-файле, без межплагинных импортов.
- Общие README/install scaffolds централизованы в [`scripts/templates/root_readme.md`](../../scripts/templates/root_readme.md) и [`scripts/templates/plugin_readme.md`](../../scripts/templates/plugin_readme.md).
- Сборка и public contract централизованы в [`scripts/minify_plugins.py`](../../scripts/minify_plugins.py).
- Инструмент clone-detection (`jscpd`/`phpcpd`) в этом прогоне не запускался, поэтому структурное дублирование не подтверждено числом.

**Путь к 100**:
1. Добавить clone-detection baseline в quality workflow.
2. При следующем касании больших plugin-файлов вынести общие helper-паттерны только там, где это уменьшает сложность, а не ради абстракции.
3. Не разносить повторяющийся build/install contract по нескольким скриптам вне `minify_plugins.py`.

## 3. Coupling — 72/100 🟡

**Что измеряет**: зависимость модулей друг от друга и от внешнего состояния.

**Влияние**: plugin-runtime изолирован хорошо; основная связанность сконцентрирована в live-coupled `cardbuilder` knowledge/data surface.

**Текущее состояние**:
- `src/` плагины живут независимо и связываются только через shared token contract и `window.CarrdPluginOptions`.
- `cardbuilder/scripts/carrd/lib/` уже разбит по направлениям (`cdp-client`, `control-core`, `onboarding-core`, `readiness-core`, `keygen`, `target-map`).
- Однако operational truth в `cardbuilder/projects/*/data/**` и `site-profile.json` жёстко привязана к живому Carrd draft/site shape.
- Это снижает runtime coupling, но повышает operational coupling в automation-слое.

**Путь к 100**:
1. Сохранить `site-profile.json` и `mcp-targets.json` как единственных owner-ов live targeting contract.
2. Дальше дробить `onboarding-core.mjs` по стадиям процесса.
3. Не пускать новые live assumptions мимо manifest/data owners.

## 4. Cohesion — 68/100 🟡

**Что измеряет**: насколько один файл/модуль решает одну задачу.

**Влияние**: большая часть репозитория сфокусирована, но несколько owner-файлов перегружены и будут дорожать в сопровождении быстрее остальных.

**Текущее состояние**:
- Большинство plugin-файлов компактны и тематически цельны.
- Основные hotspots:
  - [`scripts/minify_plugins.py`](../../scripts/minify_plugins.py) — `1281` строка
  - [`cardbuilder/scripts/carrd/lib/onboarding-core.mjs`](../../cardbuilder/scripts/carrd/lib/onboarding-core.mjs) — `802`
  - [`src/shopping-cart/shopping-cart.js`](../../src/shopping-cart/shopping-cart.js) — `799`
  - [`src/slider/slider.js`](../../src/slider/slider.js) — `716`
  - [`src/modal/modal.js`](../../src/modal/modal.js) — `541`
- Это не баги сами по себе, но это явные точки будущих регрессий.

**Путь к 100**:
1. Разбивать hotspots только при целевом касании, а не “рефакторить ради рефакторинга”.
2. В `shopping-cart` первым кандидатом выносить validation/storage helpers.
3. В `slider` первым кандидатом выносить drag/navigation internals.
4. В `onboarding-core` первым кандидатом выносить отдельные phases/readiness stages.

## 5. Cyclomatic Complexity — 84/100 🟢

**Что измеряет**: количество независимых execution paths.

**Влияние**: на основной plugin-runtime complexity уже реально ограничен инструментом, а не договорённостью на словах.

**Текущее состояние**:
- [`/.eslintrc.json`](../../.eslintrc.json) задаёт `complexity: ["error", 10]` для `src/**/*.js`.
- `npm run lint --silent` прошёл зелёно, значит текущий `src/**` не нарушает этот лимит.
- Ограничение при этом не распространяется на `cardbuilder/scripts/**/*.mjs`, где orchestration-файлы остаются крупнее и сложнее по природе.

**Путь к 100**:
1. Сохранить `complexity <= 10` как обязательный gate для `src/**`.
2. Рассмотреть отдельный complexity gate для `cardbuilder/scripts/**/*.mjs`, но мягче, чем у plugin-runtime.
3. Не ослаблять правило в `src/**`.

## 6. Dead Code — 90/100 🟢

**Что измеряет**: неиспользуемые файлы, экспорты и переменные.

**Влияние**: по JS/MJS-поверхности репозиторий уже защищён статическим gate; остаточный риск в неохваченных этим gate PHP-файлах.

**Текущее состояние**:
- [`package.json`](../../package.json) включает `check:deadcode: knip`.
- [`knip.json`](../../knip.json) охватывает `src/**/*.js`, `tests-js/**/*.js`, `cardbuilder/scripts/**/*.mjs`.
- `npm run validate --silent` прошёл зелёно, значит `knip` по этим поверхностям чист.
- `admincarrd` PHP-слой этим инструментом не покрывается.

**Путь к 100**:
1. Оставить `knip` частью `validate`.
2. При желании добавить отдельный PHP static-audit pass для `admincarrd`.
3. Не исключать новые директории из `knip` без явной причины.

## 7. Error Handling — 78/100 🟢

**Что измеряет**: качество обработки ошибок и отсутствие “тихих” сбоев.

**Влияние**: для Carrd automation и admin tooling это критичнее, чем для чисто клиентских декоративных плагинов.

**Текущее состояние**:
- В `cardbuilder` и release tooling ошибки в основном либо пробрасываются, либо возвращаются в явной форме:
  - [`cardbuilder/scripts/carrd/lib/cdp-client.mjs`](../../cardbuilder/scripts/carrd/lib/cdp-client.mjs)
  - [`scripts/purge_jsdelivr.py`](../../scripts/purge_jsdelivr.py)
- В `admincarrd` используется defensive bootstrap + auth/config helpers:
  - [`admincarrd/app/lib/bootstrap.php`](../../admincarrd/app/lib/bootstrap.php)
  - [`admincarrd/app/lib/Auth.php`](../../admincarrd/app/lib/Auth.php)
  - [`admincarrd/app/lib/ConfigWriter.php`](../../admincarrd/app/lib/ConfigWriter.php)
- В части automation helper-кода остаются мягкие `catch`/best-effort ветки, что допустимо, но требует дисциплины вокруг логирования и retries.

**Путь к 100**:
1. Сохранять правило: external I/O либо fail-fast, либо explicit degraded mode.
2. При касании automation helpers убирать “тихие” recovery-ветки без контекстного сообщения.
3. Для `admincarrd` поддерживать typed/semantic exceptions там, где идёт filesystem/config mutation.

## 8. Documentation Coverage — 60/100 🟡

**Что измеряет**: наличие кодовой документации на публичной/сложной поверхности.

**Влияние**: проектная документация сильная, но инженерный онбординг в конкретный runtime-файл всё ещё слишком зависит от чтения тестов и самого кода.

**Текущее состояние**:
- Кодовые docblocks в `src/` уже есть в:
  - [`src/modal/modal.js`](../../src/modal/modal.js)
  - [`src/shopping-cart/shopping-cart.js`](../../src/shopping-cart/shopping-cart.js)
  - [`src/typography/typography.js`](../../src/typography/typography.js)
- [`src/switcher/switcher.js`](../../src/switcher/switcher.js)
- [`src/faq/faq.js`](../../src/faq/faq.js)
- [`src/header-nav/header-nav.js`](../../src/header-nav/header-nav.js)
- [`src/slider/slider.js`](../../src/slider/slider.js)
- Но крупные owner-файлы вроде `shopping-cart` и `modal` всё ещё несут существенную часть неочевидных invariants без равномерного code-doc слоя.
- При этом repo-level docs, README generation contract и internal canon покрыты хорошо — проблема именно на code-doc level, а не на project-doc level.

**Путь к 100**:
1. Продолжить JSDoc по hotspot-файлам: сначала `shopping-cart`, затем `modal`, затем `cardbuilder` orchestration owners.
2. Документировать не “что делает строка”, а входы/выходы и неочевидные invariants.
3. Не пытаться покрыть JSDoc весь repo разом; идти по hotspot-файлам.

## 14. Frontend Bundle Health — 86/100 🟢

**Что измеряет**: размер/контроль JS-CSS delivery и влияние на web runtime.

**Влияние**: для Carrd deployment это особенно важно, потому что весь runtime приходит через CDN embeds.

**Текущее состояние**:
- Сборка централизована в [`scripts/minify_plugins.py`](../../scripts/minify_plugins.py).
- `validate` включает:
  - `verify:dist`
  - `check:bundle-budget`
  - `check:clean-contract`
- Live placement уже version-pinned на `@2.1.0`, без `@main` в canonical install path.
- Бюджеты бандлов валидацией подтверждены зелёно.
- Не наблюдались Lighthouse/web-vitals измерения в этом прогоне.

**Путь к 100**:
1. Сохранить bundle budget как обязательный gate.
2. Если нужен следующий уровень — добавить реальный Web Vitals/Lighthouse pass для published surfaces.
3. Отдельно следить за ростом `shopping-cart` и `slider` как самых насыщенных runtime owners.

## 15. Accessibility (a11y) — 90/100 🟢

**Что измеряет**: keyboard/ARIA/semantic доступность интерактивных поверхностей.

**Влияние**: для modal/accordeon/faq/switcher/cart regressions здесь пользовательски заметны сразу.

**Текущее состояние**:
- Есть отдельный owner-файл тестов [`tests-js/a11y-contract.test.js`](../../tests-js/a11y-contract.test.js).
- Во многих runtime files явно используются `aria-*`, `role`, `aria-controls`, `aria-expanded`, `aria-hidden`, `aria-pressed`.
- `validate` проходит эти тесты зелёно.
- Добавлен `axe-core` smoke layer в [`tests-js/axe-a11y.test.js`](../../tests-js/axe-a11y.test.js) для `modal`, `faq`, `accordeon`, `switcher`.
- В рамках этого слоя исправлена реальная semantic regression в `switcher`: list-controller `ul` больше не получает forced `role="group"`, поэтому `li` остаются валидными listitem-узлами.

**Путь к 100**:
1. Расширить `axe-core`-слой на `shopping-cart` и `header-nav`, если они останутся критичными interactive owners.
2. Держать a11y-contract tests owner-ами ARIA invariants.
3. При добавлении новых plugins требовать keyboard/ARIA story сразу, а не post-factum.

## 17. Security Headers — 88/100 🟢

**Что измеряет**: наличие и корректность HTTP security headers на серверной поверхности.

**Влияние**: применимо прежде всего к `admincarrd`.

**Текущее состояние**:
- [`admincarrd/app/lib/bootstrap.php`](../../admincarrd/app/lib/bootstrap.php) выставляет:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Strict-Transport-Security` при HTTPS
  - CSP через config-gated policy
- Внешняя проверка через `securityheaders.com` в этом прогоне не выполнялась.

**Путь к 100**:
1. Сохранить HSTS/CSP как bootstrap defaults.
2. Один раз прогнать production endpoint через внешний security headers scanner.
3. Не размывать CSP ради convenience без documented reason.

## Сводка

| # | Benchmark | Score | Status |
|---|---|---:|---|
| 1 | Code Coverage | 88/100 | 🟢 |
| 2 | Duplication | 76/100 | 🟡 |
| 3 | Coupling | 72/100 | 🟡 |
| 4 | Cohesion | 68/100 | 🟡 |
| 5 | Cyclomatic Complexity | 84/100 | 🟢 |
| 6 | Dead Code | 90/100 | 🟢 |
| 7 | Error Handling | 78/100 | 🟢 |
| 8 | Documentation Coverage | 60/100 | 🟡 |
| 14 | Frontend Bundle Health | 86/100 | 🟢 |
| 15 | Accessibility | 90/100 | 🟢 |
| 17 | Security Headers | 88/100 | 🟢 |

Средний балл по применимым бенчмаркам: `80/100`.

## План улучшений

### 🚀 Quick wins (≤ 1 day, high ROI)
1. Зафиксировать repo-level оговорку: `100%` coverage относится к `src/**`, а automation-код живёт в отдельном `cardbuilder` coverage-owner.
2. При желании подключить внешний security headers check для `admincarrd` production surface.
3. Сохранить `tests-js/axe-a11y.test.js` owner-ом smoke-a11y для критичных widgets и расширять его только при реальном росте surface.

### 📅 Medium-term (1–2 weeks)
1. Решить numeric coverage story для `admincarrd/**`.
2. Начать дробление `shopping-cart`, `slider`, `onboarding-core` по ROI-first частям.
3. При необходимости расширить `axe-core` или сопоставимый automated a11y pass на остальные interactive owners.

### 🏗 Strategic (ongoing)
1. Держать `validate` единым owner-ом release quality gates.
2. Не размывать `knip`, bundle budget и complexity rules при росте репозитория.
3. Любые новые hotspot-файлы >500–700 строк считать поводом для дополнительного design review.

## Scope

Проанализировано:
- `src/`
- `tests-js/`
- `tests/`
- `cardbuilder/scripts/carrd/`
- `admincarrd/app/`
- `.github/workflows/ci.yml`
- `package.json`
- `knip.json`
- `.eslintrc.json`

Не анализировалось в этом прогоне:
- `node_modules/` — сторонний код
- `dist/` — generated delivery, оценивался через `verify:dist` и bundle gates
- `cardbuilder/projects/*/data/**` — runtime/site data, не owner source code
- внешние network scanners (`securityheaders.com`, Lighthouse) — не запускались

## Verification

Commands run:
- `npm run validate --silent`
- `python3 -m unittest tests.test_purge_jsdelivr`
- `rg -n "complexity" .eslintrc* package.json src tests-js cardbuilder/scripts -S`
- `rg -n "@typedef|/\\*\\*|aria-|role=|axe|knip|test:coverage|check:deadcode" src tests-js scripts admincarrd/app .github package.json knip.json -S`
- targeted `python3` line-count and source-scan helpers for hotspots/tests/plugins

Limits:
- clone detector (`jscpd`) не запускался в этом прогоне
- repo-level numeric coverage для `admincarrd` не измерялось
- внешний browser perf/security scan не выполнялся
