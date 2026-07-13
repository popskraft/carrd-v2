# Stacker — Backlog

## Purpose
Плагин `stacker`: группа Carrd-контейнеров с общим признаком превращается в scroll-stack — при скролле первый контейнер фиксируется у верхней точки (верх экрана + настраиваемый offset), следующий наезжает поверх, фиксируется там же, и так по цепочке. После прохода последнего контейнера вся группа уезжает вверх вместе с нижней границей последнего элемента.

Референс поведения: видео `Agentic - Design Agency Template.mp4` (секция WORK: карточки проектов наезжают друг на друга).

## Mechanics (принятая модель)
- Каждый элемент группы получает `position: sticky; top: <offset>`.
- Все элементы — с одинаковым `top` → полное перекрытие предыдущего следующим.
- Runtime оборачивает подряд идущие элементы группы в общий wrapper `.stacker-group`; sticky-containment заканчивается на wrapper — поэтому после последней карточки группа целиком уходит вверх. Без wrapper sticky работал бы до конца всей Carrd-секции.
- `z-index` по порядку следования (следующий выше предыдущего).
- JS минимальный: группировка, wrapper, offset, конфиг. Само поведение — чистый CSS sticky, без scroll-listener в MVP.

## Contract
- Канонический атрибут по `plugin-data-contract`: `data-stacker="<name>"`.
- Текущая тестовая разметка (`carrd-source/index.html`, containers 22–24) использует `data-stacked="stack"` — поддержать как alias на время теста, канон — `data-stacker`. Решение зафиксировать в OPEN-QUESTIONS (Q: alias оставить или мигрировать разметку).
- Вторичные атрибуты: `data-stacker-offset` (px, на группу через первый элемент).
- Глобальный/instance-конфиг: `window.CarrdPluginOptions.stacker` + `instances.<name>` (offset, enabled, minWidth).

## Known Risks
| Риск | Митигация |
|---|---|
| `.site-wrapper { overflow: hidden }` в Carrd ломает sticky (ancestor становится scroll container) | Runtime-fix: `overflow: clip` на `.site-wrapper` (clip не создаёт scroll container); проверить `#main`/section на те же свойства |
| `transform`/`filter` на предках ломает sticky | Аудит Carrd-разметки на пути группы; задокументировать ограничение |
| Карточка выше viewport | Sticky деградирует штатно (карточка скроллится до низа, потом липнет) — проверить и описать в README |
| Элементы группы не подряд (разделены другим контентом) | MVP: группировать только подряд идущие siblings, при разрыве — warn в консоль |
| Мобильные/низкие экраны | Опция `minWidth` (отключение ниже breakpoint) + `prefers-reduced-motion` не критичен (нет анимаций), но деколларация в README |

## Backlog

### P1 — MVP (core)
| # | Задача | Критерий приёмки |
|---|---|---|
| 1 | Скелет `src/stacker/` (stacker.js, stacker.css, README.md) по конвенциям репо (IIFE, DEFAULTS, CarrdPluginOptions) | Структура идентична `switcher`/`slider` |
| 2 | Сканирование DOM: сбор групп по `data-stacker` (+alias `data-stacked`), валидация имени по `^[a-zA-Z][a-zA-Z0-9_-]*$` | 3 контейнера в `carrd-source/index.html` находятся как группа `stack` |
| 3 | Runtime wrapper `.stacker-group` вокруг подряд идущих элементов группы | Wrapper не ломает layout Carrd (ширина/паддинги контейнеров сохраняются) |
| 4 | Sticky-механика: `position: sticky`, `top: offset`, `z-index` по порядку | Скролл: карточки наезжают друг на друга, после последней группа уходит вверх |
| 5 | Fix `overflow: hidden` → `overflow: clip` на `.site-wrapper` (и других предках при необходимости) | Sticky работает в реальной Carrd-разметке |
| 6 | Конфиг: `offset` (default 0), `enabled`, per-instance overrides, `data-stacker-offset` | Offset меняется через конфиг и атрибут без правки CSS |

### P2 — Устойчивость
| # | Задача | Критерий приёмки |
|---|---|---|
| 7 | Edge cases: 1 элемент в группе (no-op), разрыв группы (warn), несколько групп на странице | Консоль-warn по контракту, независимая работа групп |
| 8 | `minWidth`: отключение sticky ниже breakpoint (mobile fallback = обычный поток) | На узком экране карточки скроллятся обычно |
| 9 | jsdom-тесты в `tests-js/`: группировка, wrapper, offset, alias, edge cases | Тесты проходят в repo-native прогоне |

### P3 — Тестирование live
| # | Задача | Критерий приёмки |
|---|---|---|
| 10 | Локальная проверка на `carrd-source/index.html` (секция Stacked) | Поведение соответствует видео-референсу |
| 11 | Тест на Carrd: код в embed-элементе (без jsDelivr), сайт `mini.crd.co`, Builder `4155176224428477` | Эффект работает на живом draft/publish |
| 12 | Верификация после live: зафиксировать найденные отличия Carrd-рендера от carrd-source | Отчёт в OPEN-QUESTIONS/бэклог-обновление |

### P4 — Полировка (после подтверждения MVP)
| # | Задача | Критерий приёмки |
|---|---|---|
| 13 | Опциональные визуальные эффекты: scale/dim нижних карточек при перекрытии (scroll-driven, progressive enhancement) | Off by default; не влияет на MVP |
| 14 | README по `docs/templates/plugin-readme-template.md`; решение по включению в bundle/jsDelivr — отдельно, не сейчас | README без hardcode bundle-статуса |

## Out of Scope (сейчас)
- Подключение в общий CDN bundle / jsDelivr.
- Горизонтальный stack, кастомные easing/анимации.
- Поддержка элементов группы в разных секциях.

## Status (2026-07-07)
- P1 (задачи 1–6): done. `src/stacker/` реализован, dist собран, `data-stacked` работает как alias, overflow-fix через `.theme-stacker-overflow-fix` (селектор `.site-wrapper` + computed-check остальных предков).
- P2 (задачи 7–9): done. 18 jsdom-тестов в `tests-js/stacker.test.js`, включая smoke на реальном `carrd-source/index.html`, сохранение Carrd `content` / `Full` / `Full Screen` width-mode и fail-safe для mixed-width групп.
- P3 (задачи 10–12): исходный live-тест оператором на `mini.crd.co` пройден; уточнение по итогам: default offset не пишется inline, `:root`-переопределение `--theme-stacker-offset` работает. Инспекция `2026-07-13` выявила, что deployed wrapper сужает `Full Screen` до content width; repo-side fix готов и ждёт установки обновлённого inline embed, operator publish и повторного desktop/mobile width-smoke.
- P4: README done; rollout into the version-pinned runtime delivery is still pending operator publish/purge. Опциональные scale/dim эффекты — не начаты.

## Open Questions
1. `data-stacked` vs `data-stacker` → вынесен в `OPEN-QUESTIONS.md` как Q010; решить после live-теста.
2. Default offset: 0 или токен темы (например `--stacker-offset`)? Пока default `0`, переопределяется конфигом/атрибутом/CSS-переменной.
3. Нужен ли видимый «peek» (каскад с шагом offset на карточку), как в некоторых референсах, или строго полное перекрытие? Видео показывает полное перекрытие — MVP так.

## Done
Плагин считается готовым по `DEFINITION-OF-DONE.md` + критерии P1–P3 выше.
