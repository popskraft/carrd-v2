# Repository Architecture Plan

## Purpose

Зафиксировать схему, при которой старые Carrd-сайты продолжают получать старые CDN-файлы по прежним URL, а новая версия плагинов получает отдельный репозиторий, отдельные CDN-ссылки и отдельную public identity.

## Decision

Использовать два runtime repo:

1. `popskraft/carrd-v2`
   Frozen legacy CDN repo.
   Его имя, ветка `main` и существующие paths нельзя переименовывать, потому что на них уже ссылаются опубликованные Carrd-сайты.

2. `popskraft/carrd-v2`
   Новый основной repo для второй версии.
   Все новые сайты и новые install snippets должны ссылаться только на него.

Локальный workspace `/Users/popskraft/Projects/CARRD` сейчас остаётся местом проектирования и подготовки v2 до создания/публикации нового repo.

## Non-Negotiables

- Не переименовывать `popskraft/carrd-v2`.
- Не переносить старые CDN files на новый repo.
- Не полагаться на GitHub redirects для runtime delivery.
- Не обновлять старые сайты автоматически на v2.
- Не менять существующие legacy paths вида `https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/...`.

## Target Runtime Model

### Legacy: `popskraft/carrd-v2`

Роль:
- обслуживает уже опубликованные сайты;
- хранит legacy `dist/...` files по старым именам;
- остаётся доступным по тем же jsDelivr URL.

Правила:
- только критические fixes, если старые сайты сломаны;
- никаких v2 plugin renames;
- никаких новых install docs для новых проектов;
- после freeze repo считается legacy runtime surface.

### V2: `popskraft/carrd-v2`

Роль:
- основной repo для новой версии;
- источник новых CDN links;
- место, где v2 plugins получают новые names, paths, globals и docs.

Пример новой CDN-ссылки:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.css">
<script src="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-core-v2.min.js"></script>
```

## V2 Naming Policy

Чтобы v1 и v2 могли сосуществовать на уровне CDN, globals и markup, v2 получает явный suffix.

### Repo and package

- Repo: `popskraft/carrd-v2`
- Package name: `carrd-v2` или `carrd-v2`
- Public docs title: `Carrd Plugins V2`

### Bundle artifacts

- `dist/theme-core-v2.min.css`
- `dist/theme-core-v2.min.js`
- `dist/theme-core-v2-cdn.html`

### Plugin slugs and files

Preferred v2 pattern:

- `src/slider-v2/`
- `dist/slider-v2/slider-v2.min.css`
- `dist/slider-v2/slider-v2.min.js`
- `dist/slider-v2/slider-v2-cdn.html`

Apply the same pattern to every plugin:

- `accordeon-v2`
- `cards-v2`
- `cookie-banner-v2`
- `faq-v2`
- `floating-cta-v2`
- `grid-cluster-v2`
- `header-nav-v2`
- `modal-v2`
- `no-loadwaiting-v2`
- `shopping-cart-v2`
- `slider-v2`
- `switcher-v2`
- `typography-v2`

### JavaScript globals

Use v2 globals, not legacy globals:

- `window.CarrdSliderV2`
- `window.CarrdModalV2`
- `window.CarrdPluginOptionsV2`

### Markup contract

Use v2-prefixed public attrs where collision with v1 is possible:

- `data-slider-v2`
- `data-modal-v2`
- `data-modal-v2-open`
- `data-switcher-v2`
- `data-switcher-v2-target`
- `data-shopping-cart-v2-output`

If a plugin cannot collide with v1 on the same page, it may keep the simpler semantic marker only after explicit approval in `plugin-v2-data-contract.md`.

## Migration Policy

Old sites:
- stay on `popskraft/carrd-v2`;
- keep old snippets;
- receive only emergency legacy fixes.

New sites:
- use only `popskraft/carrd-v2`;
- use v2 bundle and v2 plugin snippets;
- use v2 names in docs, attrs and globals.

Migrated sites:
- are migrated manually;
- replace old CDN snippets with v2 snippets;
- replace legacy markup attrs/classes/hashes with v2 contract;
- are validated before old snippets are removed.

## Implementation Steps

1. Freeze legacy repo.
   Record current `popskraft/carrd-v2@main` state with a tag or branch.

2. Create `popskraft/carrd-v2`.
   New repo starts from the current v2-ready source, not from the frozen legacy state.

3. Rename v2 plugin identities.
   Apply `*-v2` slugs, bundle names, globals and docs in the new repo.

4. Update v2 generators.
   Change build scripts/templates so generated snippets point to `popskraft/carrd-v2@main`.

5. Generate v2 `dist`.
   Confirm every generated CDN snippet uses v2 repo and v2 artifact names.

6. Validate v2.
   Run build, dist verification, tests and lint in the v2 repo.

7. Publish v2.
   Push `popskraft/carrd-v2@main`, then purge only the v2 jsDelivr paths.

8. Keep legacy untouched.
   Do not update legacy docs/snippets except to mark them as legacy if needed.

## What Not To Do

- Не создавать `popskraft/carrd-v2-archive` вместо сохранения старого `popskraft/carrd-v2`.
- Не переиспользовать старые CDN paths для v2.
- Не публиковать v2 bundle в `popskraft/carrd-v2`.
- Не менять old snippets на live Carrd-сайтах без ручной migration checklist.
- Не держать v1 и v2 под одинаковыми globals, если они могут оказаться на одной странице.

## Done

Архитектура считается внедрённой, когда:

- `popskraft/carrd-v2@main/dist/...` продолжает обслуживать старые сайты;
- `popskraft/carrd-v2@main/dist/...` обслуживает новые v2 сайты;
- все v2 plugins имеют `*-v2` public identity;
- v2 snippets не содержат ссылок на `popskraft/carrd-v2`;
- legacy repo frozen и не используется для новой разработки;
- v2 repo имеет отдельные build, verify, purge и release instructions.
