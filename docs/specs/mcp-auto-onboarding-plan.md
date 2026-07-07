# План: Автоматический онбординг сайта в Carrd MCP

- role: project-planner
- task: Auto-onboarding — Builder URL → инвентаризация → site-profile.json → полный mcp-targets.json → self-check → статус "site fully mapped, safe to control"
- status: planned
- owner: Brand
- date: 2026-07-02

## Scope

Автоматизировать targeting-pass целиком, поверх существующих слоёв (control core / profile knowledge / MCP adapter):

1. **T1 — Inventory core** (`lib/onboarding-core.mjs`).
   Одна CDP-сессия против открытой вкладки Builder:
   - Pass 1: enumerate — обход `window.app.builder.site.components` (авторитетный источник состояния): id, type, settings.element.{id,classes,attributes}, container groups/childIds, topLevelIndex по canvas.
   - Pass 2: panel probe — для каждого компонента `propertiesPanel.showById` → tabs (переиспользовать snapshot-логику `buildRuntimeExpression`/`cdp-tab-map-scan.js`).
   - Pass 3: stability check — повторный enumerate; инвентаризация считается детерминированной, когда два прохода дают идентичное множество `{id,type,childIds}`. При расхождении — до 3 повторов, потом fail `inventory-unstable`.
   Выход: raw inventory JSON в `projects/<slug>/data/snapshots/` (тот же формат-семейство, что builderScan/tabsMap — freshness-контракт readiness-core продолжает работать).

2. **T2 — Deterministic generation** (`lib/keygen.mjs` + `cardbuilder/data/mutation-catalog.json`).
   Без участия человека и без LLM — только детерминированные правила:
   - `semanticKey`: `<sectionScope>-<role>-<type>` из эвристик: позиция секции (section breaks / topLevelIndex), состав детей (container с image+links в index 0 → `site-header-container`), существующие classes/elementId, первые слова текста. Fallback: `<type>-<componentId>` (`text-text03`). Коллизии → детерминированный ординал по canvas-порядку. Повторный прогон на неизменном сайте даёт байт-в-байт тот же map (кроме timestamps).
   - `aliases`: existing classes, elementId, видимый текст (обрезка), человекочитаемая роль.
   - `allowedMutations`: из статического каталога по componentType (`mutation-catalog.json`): универсальный минимум `settings.element.id|classes` для всех типов + type-specific безопасные пути, перенесённые из проверенного ручного map main-template. Типы вне каталога → в `unmapped[]` с reason `unsupported-type`, не в targets.
   - Генерация/обновление `site-profile.json`, регистрация в `sites.json` (если siteRef новый; slug из Builder URL id либо `--slug`), обновление `knowledge-status.json`.

3. **T3 — Readiness v2** (расширение `readiness-core.mjs` / `checkProfile`).
   Помимо freshness — живая проверка контракта:
   - contract probes: `window.app.builder`, `site.components`, `propertiesPanel.showById`, `#properties-panel header li`, `#menu [data-action]`, `#canvas .component-wrapper[data-id]` — каждый probe отдаёт pass/fail, суммарно `contractCheck: pass|drift` (вместо будущего exception в read_target).
   - coverage: 100% componentIds покрыты targets либо явно в `unmapped[]`; все semanticKey уникальны; `resolve_target` exact для каждого; после sync `live.exists=true` для всех.
   - write probe: dry-run `update_target` по `settings.element.classes` первого target (dry-run ничего не мутирует) — подтверждает write-контракт до перевода `capabilities.contentPatch` в `state-write`.
   - Итоговый статус: `fully-mapped-safe-to-control` только при: contract pass + coverage 100% + freshness fresh + write probe ok. Иначе — конкретная причина.

4. **T4 — MCP adapter + CLI**.
   - Новый tool `onboard_site` (params: `siteRef|builderUrl`, `dryRun` default true — при dryRun пишет отчёт, не файлы) — оркестрация T1→T2→sync→T3.
   - `check_profile` возвращает `contractCheck`, `coverage`, `readinessStatus`.
   - CLI `onboard-site.mjs` + npm script `onboard:site`.
   - Идемпотентный re-run = drift-обработка: diff added/removed/changed componentIds; существующие semanticKey сохраняются по match componentId (стабильность ключей для агентов); removed → target помечается `live.exists=false` и уходит в отчёт; added → генерация ключа. Ручной аудит не нужен — тот же прогон.

5. **T5 — Предпосылки-фиксы (из прошлого ревью, блокируют массовые CDP-вызовы)**.
   - Таймаут WebSocket в `cdp-client.mjs` (иначе инвентаризация из N panel-probe вызовов может зависнуть навсегда) — High.
   - Экранирование U+2028/U+2029 в `buildRuntimeExpression` (произвольный контент сайта попадает в payload инвентаризации) — Medium.
   - ESLint покрытие `cardbuilder/scripts/**/*.mjs`.

6. **T6 — Тесты и докс**.
   - Unit: keygen (детерминизм, коллизии, fallback), mutation-catalog валидация, coverage-расчёт, drift-diff.
   - Integration: onboard-пайплайн на fixture-инвентаре (без live Chrome); MCP server tests для `onboard_site`.
   - Regression fixture: сгенерированный map для main-template должен покрывать все componentIds существующего ручного map (10 targets) — те же componentId присутствуют, allowedMutations ⊇ по каталогу.
   - Обновить `CARRD_MCP_V1_GUIDE.md` + ROADMAP.

## Out of scope

- `mutate_layout` (add/remove/reorder компонентов) — остаётся ui-automation.
- Автозапуск Chrome / автологин в Carrd — операторская предпосылка (существующий `open-debug-chrome.sh`).
- Любые save/publish — operator-only, без изменений.
- Автоприменение `proposedClass` к live-сайту (это мутация сайта → отдельное операторское решение).
- Мультисайтовая параллельность (один Chrome-инстанс = один сайт, как сейчас).

## Assumptions

- `builder.site.components` — полный и авторитетный список управляемых компонентов (подтверждено существующими сканерами).
- Каталог мутаций стартует консервативно (element.id/classes + проверенные пути из main-template); расширение каталога — отдельные инкременты, не блокер.
- Автоперевод `capabilities.contentPatch` → `state-write` после зелёного write probe допустим, т.к. defaults (dry-run, allowlist, preflight, readback) сохраняются. Если owner хочет ручное подтверждение флага — один параметр `--no-auto-enable-write`.
- Регистрация нового сайта в `sites.json` требует `chromeProfileDir`; при отсутствии — вопрос оператору (нет безопасного дефолта делить профили между сайтами).

## Dependencies

- Открытая авторизованная вкладка Builder на `127.0.0.1:9222` (операторская).
- Существующие: `site-registry.mjs`, `cdp-client.mjs`, `control-core.mjs`, `readiness-core.mjs`, `target-map.mjs`.
- T5.1 (timeout) — до T1.

## Acceptance criteria

1. Одна команда `npm run onboard:site -- --builder-url <url>` (при открытой вкладке Builder) без ручных шагов создаёт/обновляет: `sites.json` entry, `site-profile.json`, `mcp-targets.json` (непустой, semanticKey на каждый поддерживаемый компонент), snapshots, `knowledge-status.json`.
2. `mcp-targets.json` валиден по `validateTarget` для 100% targets; все semanticKey уникальны; `resolve_target` exact для каждого; coverage-отчёт: targets + unmapped = все componentIds.
3. `check_profile` возвращает `contractCheck: pass`, `coverage: 100%`, `readinessStatus: fully-mapped-safe-to-control` для onboard-нутого сайта; при погашенном probe (эмуляция дрейфа в тесте) — `drift` с именем сломанного probe, не exception.
4. Повторный прогон на неизменном сайте — идемпотентен (map байт-идентичен кроме timestamps); на изменённом — semanticKey существующих компонентов сохранены, diff-отчёт added/removed/changed.
5. Нигде в пайплайне не вызывается save/publish; write probe работает только в dry-run; `update_target` контракт (allowlist/preflight/readback/dry-run default) не изменён.
6. `cdp-client.mjs` имеет таймаут (проверяется тестом), U+2028/2029 экранируются (тест с payload-инъекцией).
7. `npm run validate` и `npm run test:cardbuilder` зелёные; существующие 13 MCP-тестов не сломаны; regression fixture main-template проходит.
8. Live-прогон на faktura: `mcp-targets.json` заполняется из `[]`, readiness зелёный, `read_target` работает — фиксируется в отчёте прогона.

## Required capabilities

- Node ESM (mjs), CDP/WebSocket, JSON-RPC stdio adapter, node:test.
- Live-проверка: доступ оператора к Chrome debug-сессии (пункт 8 — совместно с оператором).

## Validation commands

```bash
npm run test:cardbuilder
npm run validate
npm run onboard:site -- --site main-template --dry-run   # regression против ручного map
npm run onboard:site -- --site faktura                   # live acceptance (п.8)
node cardbuilder/scripts/carrd/check-element-tabs-drift.mjs --site main-template
```

## Review gate

- Reviewer сверяет: контракт safety не ослаблен (diff `control-core.mjs` по updateTarget), детерминизм keygen (двойной прогон fixture), coverage-логика, идемпотентность, тесты покрывают drift и таймаут.
- FAIL-условия: любое авто-включение publish/save; недетерминированный keygen; targets без allowlist; exception вместо `drift`-статуса.

## Release gate

- Оба сайта (main-template, faktura) в статусе `fully-mapped-safe-to-control`.
- ROADMAP: новая строка закрыта; guide обновлён; handoff-блок с итогами live-прогона.

## Deferred issues

- `initialize` без проверки protocolVersion клиента (Low, из ревью) — не в этом scope.
- `mutate_layout` allowlist-операции — отдельная задача после этой.
- 7 типов компонентов без fixtures (audio/widget/timer и частично video/gallery/slideshow/table) — идут в `unmapped[]`/минимальный каталог, расширение по мере надобности.
- `.mcp.json`/регистрация сервера в MCP-клиенте — отдельный шаг установки.
- Политика auto-enable `state-write` — принят дефолт "включать после зелёного write probe"; owner может потребовать ручной флаг.

## Open risks

- Carrd Builder — closed-source SPA: enumerate/panel probe могут деградировать при апдейте Carrd; митигация — contract probes + `inventory-unstable` fail-fast.
- Panel probe (showById на каждый компонент) на больших сайтах медленный (~140ms × N) — приемлемо для onboarding-операции, отметить в guide.
- Эвристики semanticKey дадут «технические» имена для нетипичных блоков — это честный fallback, алиасы компенсируют.

## Next action / handoff

- next_action: подтверждение owner'ом двух допущений (auto-enable `state-write` после write probe; источник `chromeProfileDir` для новых сайтов) → передать в `project-builder`.
- handoff_to: project-builder
- Порядок реализации: T5.1 → T1 → T2 → T3 → T4 → T6 (T5.2/5.3 параллельно с T6).

## Evidence

- Прочитано: `control-core.mjs`, `target-map.mjs`, `readiness-core.mjs`, `site-registry` (использование), `sites.json`, `site-profile.json` (main-template), `mcp-targets.json` (main-template), `cdp-tab-map-scan.js`, `carrd-dom-audit.js`, `check-element-tabs-drift.mjs`, `ROADMAP.md`, `OPEN-QUESTIONS.md`, `package.json` scripts.
- Факты: faktura `targets: []`, `contentPatch: ui-automation`; main-template — 10 ручных targets, `contentPatch: state-write`; freshness сейчас проверяет только возраст артефактов; snapshotComponent-логика уже пригодна для инвентаризации.
