# Полный аудит проекта — carrd-v2

Дата: `2026-07-07`

## Суть

Проект в сильном состоянии.
Критических runtime или release-blocking проблем не обнаружено.
Live-размещение `mini.crd.co` и admin/tooling-поверхность после текущего цикла аудита синхронизированы с репозиторием, а главные quality gates теперь замкнуты на единый `validate`.

Главные оставшиеся риски не аварийные, а инженерные:
- `admincarrd/**` всё ещё не имеет numeric coverage-owner слоя;
- несколько owner-файлов стали maintainability hotspots;
- code-level docs всё ещё слабее project-level docs, хотя базовый JSDoc-слой уже расширен.

## Ядро

### Итоговый вердикт

- Runtime / delivery: здоровый.
- Live Carrd placement: здоровый, version-pinned на `@2.1.0`, без `@main`.
- Admin / Builder automation: работоспособный и приведён к актуальному live state.
- Release discipline: сильная; CI теперь повторяет локальный `validate`.
- Code quality: выше среднего, особенно по тестам, dead-code gates, bundle discipline и a11y/security базовым практикам.

### Что подтверждено

- `npm run validate --silent` прошёл зелёно.
- JS tests: `235/235` runtime + `27/27` cardbuilder.
- Python tests: `32/32`.
- Coverage gate для `src/**`: `100%` lines / branches / functions.
- Coverage gate для `cardbuilder/**`: `54.79%` lines / `53.52%` branches / `68.63%` functions при порогах `50/50/65`.
- `knip`, bundle budget, clean contract, legacy consistency, lint — зелёные.
- Published `mini.crd.co` сидит на `popskraft/carrd-v2@2.1.0`.
- В live published markup нет `@main` и нет активных `data-*-v2` markers.
- Builder draft `4155176224428477` синхронизирован с обновлёнными knowledge/manifests.

### Top findings

1. `100%` coverage относится к `src/**`, а automation-код теперь защищён отдельным `cardbuilder` coverage-owner; единственный явный blind spot на этом уровне — `admincarrd/**`.
2. Самые вероятные будущие regression hotspots — [`scripts/minify_plugins.py`](../../scripts/minify_plugins.py), [`cardbuilder/scripts/carrd/lib/onboarding-core.mjs`](../../cardbuilder/scripts/carrd/lib/onboarding-core.mjs), [`src/shopping-cart/shopping-cart.js`](../../src/shopping-cart/shopping-cart.js), [`src/slider/slider.js`](../../src/slider/slider.js), [`src/modal/modal.js`](../../src/modal/modal.js).
3. Репозиторий лучше задокументирован на уровне project/process, чем на уровне публичного API конкретных runtime-файлов.

### Benchmark summary

| Surface | Score | Comment |
|---|---:|---|
| Code Coverage | 88 | `src/**` locked at `100%`, `cardbuilder/**` now has a separate numeric gate; `admincarrd/**` remains outside |
| Duplication | 76 | direct risk умеренный, но clone detector не запускался в этом прогоне |
| Coupling | 72 | plugin runtime хорошо изолирован, `cardbuilder` live-coupled сильнее |
| Cohesion | 68 | основная проблема — несколько больших owner-файлов |
| Cyclomatic Complexity | 84 | `src/**` защищён ESLint rule `complexity <= 10` |
| Dead Code | 90 | `knip` уже часть `validate` и зелёный |
| Error Handling | 78 | в целом дисциплинированно, особенно в tooling/admin |
| Documentation Coverage | 60 | базовый JSDoc уже добавлен на `switcher` / `faq` / `header-nav` / `slider`, но hotspots ещё не закрыты |
| Frontend Bundle Health | 86 | bundle budget + clean dist + version-pinned delivery |
| Accessibility | 90 | есть a11y-contract tests и новый `axe-core` smoke layer, который уже поймал и закрыл regression в `switcher` |
| Security Headers | 88 | strong `admincarrd` bootstrap defaults, без внешнего scan proof |

Средний балл по применимым quality benchmarks: `80/100`.

## Детали

### Источники полного отчёта

- Live/admin/runtime audit: [2026-07-07-code-live-audit.md](./2026-07-07-code-live-audit.md)
- Code quality audit: [QUALITY-AUDIT-2026-07-07.md](../audits/QUALITY-AUDIT-2026-07-07.md)

### Что было закрыто в текущем audit cycle

- Освежён `main-template` knowledge pack и все связанные manifests/inventories/scans.
- Исправлены 3 реальные дефекта в `cardbuilder` tooling:
  - snapshot schema handling,
  - Builder-tab prioritization,
  - properties-panel wait before tabs readback.
- CI доведён до parity с локальным `validate`.
- jsDelivr purge переведён на version-pinned default ref из `VERSION` с явным compatibility override для `@main`.
- В `validate` добавлен отдельный `cardbuilder` coverage gate.
- Подключён `axe-core` smoke layer для `modal` / `faq` / `accordeon` / `switcher`.
- Добавлен JSDoc на публичную поверхность `switcher`, `faq`, `header-nav`, `slider`; попутно закрыт semantic a11y defect в `switcher`.

### Где проект силён

- release gates реально работают, а не декларируются;
- plugin runtime покрыт тестами и coverage заметно лучше среднего;
- generated delivery discipline жёстко закреплена через `verify:dist`, bundle budget и clean contract checks;
- live Carrd deployment и local canon сейчас совпадают;
- accessibility и security уже встроены в engineering process, а не висят как “потом”.

### Где качество пока ниже целевого

- нет numeric coverage story для `admincarrd/**`;
- maintainability pressure концентрируется в нескольких больших owner-файлах;
- code-level docs/JSDoc всё ещё отстают от зрелости тестов и governance docs на оставшихся hotspot-файлах;
- внешний perf/security scanning layer не встроен в этот цикл.

### Приоритетный план

#### Quick wins

1. Один раз прогнать production security headers scan для `admincarrd` surface.
2. Зафиксировать в docs/README, что coverage split теперь двухслойный: `src/**` и `cardbuilder/**`.
3. Решить, нужен ли отдельный numeric test/coverage слой для `admincarrd`.

#### Medium-term

1. Разбивать `shopping-cart`, `slider`, `onboarding-core` по ROI-first кускам.
2. Расширить `axe-core` layer на `shopping-cart` и `header-nav`, если эти surfaces останутся наиболее чувствительными.
3. Решить, нужен ли отдельный static/coverage слой для `admincarrd`.

#### Strategic

1. Сохранять `validate` единым owner-ом release quality gates.
2. Любой новый owner-файл >500–700 строк считать кандидатом на design review.
3. Не ослаблять `knip`, complexity и bundle-budget checks при росте репозитория.

### Verification

Commands run:
- `npm run validate --silent`
- `python3 -m unittest tests.test_purge_jsdelivr`
- targeted `rg` / `python3` repo scans for tests, hotspots, JSDoc, security headers, lint rules

Limits:
- clone detector (`jscpd`) не запускался в этом прогоне
- внешний Lighthouse / `securityheaders.com` scan не запускался
- numeric coverage для `admincarrd/**` не измерялся
