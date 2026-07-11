# Live Plugin Scenario Testing Plan

## Суть

Плагины можно тестировать детерминированно через связку `local contract tests → Builder draft mutation/readback → published browser smoke`. Нельзя считать один `mini.crd.co` полным тестовым стендом: текущая опубликованная страница содержит не все plugin fixtures.

## Ядро

### Текущий observed state

- Builder: `https://carrd.co/dashboard/4155176224428477/build`.
- Published: `https://mini.crd.co/`.
- Fresh readiness: `hasBuilder=true`, `hasComponents=true`, `hasUiPanel=true`.
- Builder component inventory: `123` components, `19` embeds.
- Published markers: slider `5`, switcher `3`, modal `1`, FAQ `1`, cookie `1`; accordeon `0`, shopping-cart markers `0`.
- `check:tabs-drift` reports drift: latest saved map `106` elements versus fresh Builder `123`.

Inference: `main-template` is usable for read-only audit and controlled draft experiments, but it is not a complete all-plugin production test fixture. Missing surfaces must be added only to an isolated test site or an explicitly approved draft fixture.

### Three test layers

1. **Local layer** — `npm run validate`, jsdom contracts, axe checks, bundle/runtime tests. Fast and repeatable; cannot prove Carrd Editor persistence, real CDN order, touch, browser focus or published markup.
2. **Local full-HTML browser lab** — serve a controlled copy of `carrd-source/index.html` (or the owner-provided full export), route repo-owned CDN refs to local `dist`, add missing plugin fixtures, and run real browser scenarios at every viewport. This is the preferred place for broad destructive and edge-case testing.
3. **Builder draft layer** — capture `window.app.builder.site.json()`, apply only allowlisted mutations from `mutation-catalog.json`/`mcp-targets.json`, read back component state and generated markup, then reload to rollback unless the operator explicitly saves.
4. **Published browser layer** — open the published URL in a clean browser context, capture console errors, uncaught exceptions, failed critical resources, DOM markers and user journeys at each viewport. Publish is an operator gate.

### Scenario lifecycle

```text
scenario manifest
  → preflight readiness
  → snapshot + hash
  → deterministic draft patch (optional)
  → builder readback
  → browser smoke
  → assertions + evidence artifact
  → reload rollback OR operator-approved save/publish
```

Every run records: `scenarioId`, site ref, Builder URL, published URL, commit/tag, before snapshot hash, mutation list, after readback, viewport, reduced-motion state, browser version, network failures, console errors, verdict and timestamp.

### Condition matrix

- Viewports: `1440x900`, `1024x768`, `768x1024`, `390x844`.
- Input: mouse, touch emulation, keyboard-only, Escape, Tab/Shift+Tab, Enter/Space.
- Motion: normal and `prefers-reduced-motion: reduce`.
- Runtime: clean storage, existing storage, malformed storage, duplicate init, late DOM refresh.
- Network: normal CDN, delayed CDN, failed optional asset, offline after load.
- Carrd state: draft readback, published readback, no-save rollback, approved save/publish.

### Plugin scenario inventory

- `accordeon`: open/close, hash target, multi-target group, default-open, scroll options, keyboard, missing target.
- `cards`: inherited padding, mobile token capture, legacy fallback, repeated init, empty/partial content.
- `cookie-banner`: first consent, existing consent, expiry, mobile position/indent, secure cookie, repeated init.
- `design-palette`: visible target, hidden-head fallback, unresolved token, refresh after token change.
- `faq`: single-open, multi-open, default-open, custom divider, keyboard, repeated init.
- `floating-cta`: scroll threshold, named clone, mobile/desktop visibility, invalid target/position, repeated init.
- `grid-cluster`: 2–6 columns, spans, breakpoint variants, oversized/invalid values, contiguous groups.
- `header-nav`: breakpoint collapse, Escape, focus restore, resize across breakpoint, no marker, reduced motion.
- `modal`: hash/open API, overlay, Escape, focus trap/restore, labels, dynamic refresh, cart conflict, invalid options.
- `no-loadwaiting`: early Head execution, loader present/absent, late loader insertion, observer timeout, resize pulses.
- `shopping-cart`: add/quantity/remove, duplicate products, persistence, malformed storage, empty state, checkout output, focus trap.
- `slider`: free/center modes, dots/arrows, mobile arrows, drag/swipe, autoplay, reduced motion, resize, boundaries, destroy.
- `stacker`: contiguous/non-contiguous groups, offsets, invalid names, hidden-overflow ancestors, repeated init.
- `switcher`: same-name controller sync, multiple targets, explicit indexes, DOM-order fallback, invalid default, keyboard.
- `typography`: headings/lists/hr conversion, nested markup, repeated init, malformed content, trusted/untrusted HTML policy.
- `theme-runtime`: bundle ordering, duplicate initialization, plugin fault isolation, token resolution, compatibility isolation.

## Детали

### Локальная лаборатория — готово

Полный export из `carrd-source/` запускается в изолированном headless Chrome без изменения исходного HTML:

```bash
npm run lab:plugins:list
npm run lab:plugins
npm run lab:plugins:base
npm run lab:plugins:matrix
npm run lab:plugins -- --scenario slider-parameter-mobile
```

Сценарии находятся в `cardbuilder/projects/main-template/data/scenarios/local-plugin-lab.json`. Каждый сценарий может задавать:

- `viewport` и `reducedMotion`;
- `mutations` — только allowlisted `data-*`-атрибуты с обязательной проверкой числа совпавших элементов;
- `pluginOptions` — раннюю изолированную инъекцию `window.CarrdPluginOptions` до plugin scripts;
- `fixtures` — временную HTML-разметку для плагинов, которых нет в скачанном шаблоне;
- `actions` и `assertions` — детерминированные browser steps и проверки.

Runner в памяти добавляет `<base href="/">`, направляет repo-owned jsDelivr-ссылки на локальный `dist/`, обслуживает `carrd-source/assets/` и сохраняет screenshot/result JSON в ignored-каталог `_temp/local-plugin-lab/`. Ошибка selector, неожиданное число совпадений, browser exception или запись в `window.CarrdPluginRuntimeErrors` дают `FAIL`.

Исходный `carrd-source/index.html` не переписывается. Carrd Builder, draft, save и publish этим runner не затрагиваются.

Первая generated matrix описана в `plugin-matrix-contract.json`: `320` изолированных Chrome-сценариев для slider, grid, cookie-banner, cards, modal, FAQ, switcher и stacker. Генератор создаёт single-value и pairwise случаи, равномерно выбирая сценарии по плагинам до установленного лимита. Каждый изменённый атрибут получает обязательный DOM readback assertion; каждый запуск также блокируется при uncaught exception или `CarrdPluginRuntimeErrors`.

`npm run lab:plugins:matrix` запускает matrix параллельно (по умолчанию шесть workers). Успешные generated cases сохраняют компактный JSON; screenshot создаётся только при `FAIL`. Итоговое покрытие находится в `_temp/local-plugin-lab/matrix-coverage.json`.

К базовой matrix добавлены сложные пользовательские flows в `local-plugin-lab.json`: modal + Escape, pricing/cases switcher, FAQ keyboard/state, cookie acceptance, mobile header + Escape, floating CTA after scroll и Shopping Cart API + panel rendering. Они запускаются командой `npm run lab:plugins:base`; текущий результат — `12/12 PASS`.

### Safe mutation policy

Safe by default: read-only inspection, snapshots, dry-run mutations, local fixture changes, draft mutation followed by reload rollback.

Operator approval required: save, replace/delete live embeds, add user-facing IDs/classes/data attributes, publish, CDN purge, or testing on the only customer-facing site.

### Required evidence gates

- `local-pass`: native validation is green.
- `builder-pass`: readiness flags green; mutation readback matches requested state; no unexpected components changed.
- `browser-pass`: critical journeys pass at all required viewports; no uncaught exceptions; no critical failed resources; refs match release version.
- `release-pass`: published scan matches draft and release packet; operator signs off.

No scenario may report `PASS` when a prerequisite layer is missing. Use `BLOCKED` for unavailable auth/fixture and `FAIL` for a reproducible behavior or contract defect.

### Recommended fixture strategy

Use the implemented local full-HTML browser lab for the complete plugin matrix. It serves `carrd-source/index.html` with `carrd-source/assets/` through a generated controlled fixture and never edits the reference file in place. Keep a dedicated Carrd test site as the second-line integration test for Carrd serialization. Keep `mini.crd.co` as the canonical smoke surface for the approved sales template. If a dedicated site is unavailable, add a temporary fixture section only after snapshotting and obtaining operator approval; remove it before customer-facing publish.

### Existing implementation to reuse

- `cardbuilder/scripts/carrd/lib/control-core.mjs` — allowlisted deterministic reads/writes and dry-run support.
- `cardbuilder/data/mutation-catalog.json` — component-type mutation capabilities.
- `cardbuilder/projects/main-template/data/manifests/mcp-targets.json` — semantic target map.
- `cardbuilder/scripts/carrd/cdp-tab-map-scan.js` — real CDP mouse events for Builder panels.
- `cardbuilder/scripts/carrd/carrd-published-site-plugin-scan.js` — published asset/global inventory.
- `cardbuilder/scripts/carrd/cdp-eval.mjs` — read/evaluate against a selected tab.
- `npm run check:published` — immutable CDN/version contract checker.
