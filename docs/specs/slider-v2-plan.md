# Slider v2 — план реализации прототипа

Дата: 2026-07-11. Статус: план для исполнителя (Builder).
Основание: `docs/reports/2026-07-11-slider-analysis.md`.
Исходники v1 (не трогать): `src/slider/slider.js`, `src/slider/slider.css`.

## 0. Цель и ключевые решения

Прототип второй версии слайдера со следующими принципиальными изменениями:

1. **Движок — нативный CSS scroll-snap**, а не ручной drag/momentum/transform. Скроллер = `overflow-x: auto` + `scroll-snap-type`. Вся плавность (тач, трекпад, инерция) — нативная, от ОС.
2. **Два режима**: `center` (скролл с фиксацией слайда по центру кадра) и `free` (свободный скролл без доводки). Режим по умолчанию — `center`.
3. **Вся конфигурация — через data-атрибуты на первом слайде кластера.** JS-опций (`window.CarrdPluginOptions`) в v2 нет вообще.
4. Прототип живёт в **`src/slider-v2/`** и не затрагивает v1. Никакой обратной совместимости не требуется — это тестовая версия.

Целевые метрики: JS ≤ 400 строк исходника, min ≤ 8 KB; CSS ≤ 150 строк.

## 1. Файлы

Создать:

```
src/slider-v2/slider.js      — движок
src/slider-v2/slider.css     — стили
src/slider-v2/README.md      — документация (формат как у v1)
src/slider-v2/demo.html      — локальная демо-страница (см. раздел 8)
```

Ничего в `src/slider/` и `bundle.config.json` не менять (подключение v2 в бандл — отдельная задача после приёмки прототипа).

## 2. Конфигурация через data-атрибуты

### 2.1 Группировка (как в v1)

`data-slider="name"` на каждом контейнере кластера. Логику обнаружения кластеров (соседние элементы с одинаковым именем) **перенести из v1 без изменений**: функции `normalizeName`, `getSliderName`, `isSameSliderCluster`, `findSliderClusters`, включая `safeNamePattern` и защиту `data-slider-initialized`.

### 2.2 Настройки — только на ПЕРВОМ слайде кластера

| Атрибут | Значения | Default | Смысл |
|---|---|---|---|
| `data-slider-mode` | `free` \| `center` | `free` | Режим фиксации |
| `data-slider-spv` | 1–3 числа через пробел, дробные допустимы: `"1.2 3 4"` | `"1.2 3 4"` | slidesPerView: мобайл / ≥737px / ≥1280px |
| `data-slider-gap` | px, 1–3 числа: `"12 16 24"` | `"16"` | Зазор между слайдами по тем же брейкпоинтам |
| `data-slider-autoplay` | миллисекунды: `"5000"`; отсутствие атрибута = выключено | off | Автопрокрутка |
| `data-slider-dots` | `off` | on | Точки пагинации |
| `data-slider-arrows` | `off` | on | Стрелки (только desktop, как в v1) |

Правила парсинга:

- Читать атрибуты только с `cluster[0]`; на остальных слайдах игнорировать.
- Невалидные значения → default + `console.warn('[slider-v2] …')` один раз на инстанс.
- Триплеты «1–3 значения»: одно значение = на все брейкпоинты; два = мобайл + (≥737 и ≥1280); три = полный набор. Брейкпоинты `737` и `1280` — константы модуля, не настраиваются.
- В `free`-режиме дробный `spv` — норма (край всегда «подрезан», это фича режима).

### 2.3 Что исключено из v1 намеренно

`slideSelector`, `sliderAttribute`, `peek` (заменён дробным spv), `snapThreshold`, `maxSlideWidth`, `hideOverflow` (нативный скроллер всегда клипует — режима overflow-visible в v2 нет), `equalHeight` (всегда включён), `freeScroll`/`wheelScroll` (заменены `mode`; колесо/трекпад работают нативно), `loop`, `breakpoints`-объект, весь `window.CarrdPluginOptions` и `instances`. Исполнителю: не добавлять ничего из этого списка «на всякий случай».

## 3. DOM и CSS

### 3.1 Структура

```html
<div class="theme-slider2" role="region" aria-roledescription="carousel">
  <div class="theme-slider2-scroller">          <!-- overflow-x: auto -->
    <div class="theme-slider2-slide">…</div>    <!-- исходный контейнер внутри -->
    …
  </div>
  <button class="theme-slider2-nav …">          <!-- prev/next -->
  <div class="theme-slider2-dots">…</div>
</div>
```

Построение — как в v1 (`init()`): создать wrapper перед первым слайдом, переместить слайды внутрь. `destroy()` возвращает всё назад — перенести механизм cleanup из v1 (реестр `eventHandlers`, `destroyById`, `destroyAll`, `refresh`, публичный API `window.CarrdSlider2`).

### 3.2 Ключевой CSS

```css
.theme-slider2-scroller {
  display: flex;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;          /* mode=center */
  gap: var(--s2-gap);                     /* вместо marginRight из JS */
  scrollbar-width: none;                  /* + ::-webkit-scrollbar { display:none } */
  -webkit-overflow-scrolling: touch;
}
.theme-slider2[data-mode="free"] .theme-slider2-scroller {
  scroll-snap-type: none;
}
.theme-slider2-slide {
  flex: 0 0 var(--s2-slide-w);
  scroll-snap-align: center;
  scroll-snap-stop: always;               /* не пролетать больше одного слайда за жест */
}
.theme-slider2-scroller.is-grabbing { scroll-snap-type: none; }  /* на время mouse-drag */
```

- Ширина слайда: JS считает только CSS-переменные на wrapper: `--s2-slide-w: calc((100% - N*gap)/spv)` и `--s2-gap` — при init и смене брейкпоинта (matchMedia listeners на 737/1280, не resize-поллинг). Больше никаких стилей на слайды из JS.
- **Центровка краёв**: НЕ добавлять inline-padding — первый слайд прижат к левому краю, последний к правому, промежуточные центруются (нативное поведение clamp). Это осознанное решение, зафиксировать в README.
- Equal height: `align-items: stretch` на flex-скроллере + перенос текущих правил `.is-equal-height` (сделать их безусловными).
- Токены `--theme-slider-*` из v1 CSS переиспользовать как есть (dots/arrows выглядят идентично v1).
- `prefers-reduced-motion: reduce` → `scroll-behavior: auto` для программных прокруток.

## 4. JS-логика (что остаётся от движка)

### 4.1 Слежение за активным слайдом (dots/arrows/aria)

Не вычислять индекс из `scrollLeft` вручную. Использовать **IntersectionObserver** с root = scroller:

- `center`: threshold ~0.6, активный = слайд с максимальным intersectionRatio.
- `free`: dots по умолчанию видимы; активная точка синхронизируется через тот же IO.

Обновлять: активную точку, `disabled` у стрелок (первый/последний слайд), `aria-label="Slide X of N"` на wrapper.

Дополнительно слушать `scrollend` c fallback: если `'onscrollend' in window` — использовать его; иначе debounce `scroll` 150 мс. Только для финальной синхронизации, не на каждый scroll-кадр.

### 4.2 Стрелки, точки, клавиатура

- Стрелка/точка/ArrowLeft/ArrowRight → `scrollToSlide(index)`:
  - `center`: `slide.scrollLeft`-цель = `slide.offsetLeft - (scroller.clientWidth - slide.offsetWidth) / 2`, clamp в `[0, scrollWidth - clientWidth]`, `scroller.scrollTo({ left, behavior: 'smooth' })`.
  - `free`: то же самое (стрелки в free листают на ширину слайда).
- Никаких CSS-transition на transform — их больше нет.

### 4.3 Mouse drag (единственный ручной кусок)

Нативный скролл не даёт drag мышью на desktop. Реализовать компактно (~60 строк) на **Pointer Events**:

- `pointerdown` (только `pointerType === 'mouse'`, не на `button/a/input/select/textarea/[role=button]`) → `setPointerCapture`, запомнить `startX`, `startScrollLeft`, `performance.now()`; класс `is-grabbing` (снимает snap, cursor: grabbing).
- `pointermove` → `scroller.scrollLeft = startScrollLeft - (x - startX)`. Никаких чтений layout в цикле — всё закэшировано на pointerdown.
- Скорость: кольцевой буфер последних позиций за ~100 мс, velocity = среднее (НЕ по двум последним точкам — это источник рывков в v1).
- `pointerup`:
  - `center`: снять `is-grabbing`, вычислить целевой слайд (ближайший к центру с учётом направления velocity: |v| > 0.3 px/ms → следующий/предыдущий), `scrollToSlide()`. Snap-класс вернуть после завершения прокрутки (scrollend/fallback), чтобы mandatory-snap не дёргал позицию.
  - `free`: dt-based инерция на `scrollLeft`: rAF-цикл, `v *= Math.exp(-k * dt)` (k подобрать ≈ 0.004/ms), стоп при |v| < 0.02 px/ms; затем снять `is-grabbing`.
- Подавление click после drag (порог 6px) — перенести механизм `suppressNextClick` из v1.
- Touch не трогать вообще — он полностью нативный. Обработчики touch* не вешать.

### 4.4 Autoplay

- Только при наличии `data-slider-autoplay`. `setInterval` → следующий слайд, с последнего → к первому (`scrollToSlide(0)`).
- Пауза: `pointerenter`/фокус внутри; любое пользовательское взаимодействие со скроллером (pointerdown, wheel, touch через `scroll` от пользователя) перезапускает таймер.
- При `prefers-reduced-motion` autoplay не запускать.

### 4.5 Поведение dots в free-режиме

Dots по умолчанию рендерятся в обоих режимах. Явный `data-slider-dots="off"` скрывает их.

## 5. Что переносится из v1 как есть

- Обнаружение кластеров (см. 2.1).
- Каркас класса: конструктор/`init`/`destroy`/`addListener`-реестр.
- Публичный API: `window.CarrdSlider2 = { init, destroyAll, destroyById, refresh, getInstances }`.
- A11y-атрибуты (role, aria-roledescription, aria-label, tabindex на wrapper, aria-label у кнопок).
- CSS-токены и внешний вид dots/arrows, media-скрытие стрелок ≤736px.
- Автоинициализация на DOMContentLoaded.

## 6. Чего в v2 НЕ делать

- Не парсить transform-матрицы, не хранить `translateX` — позиция всегда `scroller.scrollLeft`.
- Не вешать `resize`-listener c debounce — только `matchMedia('(min-width: 737px)')` / `1280px` change-события + один `refresh()` на `window.load`.
- Не читать `offsetWidth` в обработчиках движения.
- Не реализовывать loop, wheel-перехват, overflow-visible.
- Не поддерживать конфиг через JS.

## 7. Порядок работ

1. Каркас: структура файлов, перенос кластер-детекции и cleanup из v1, парсер data-атрибутов с триплетами и warn'ами.
2. CSS: скроллер, snap, переменные ширины/gap, скрытие скроллбара, equal height, токены.
3. Пассивная механика: IO-слежение, dots/arrows/keyboard, scrollToSlide, брейкпоинты через matchMedia.
4. Mouse drag + инерция free + доводка center.
5. Autoplay + reduced-motion.
6. Demo-страница, ручная проверка, README.
7. Прогон тестов (см. 8.3) и линта проекта.

## 8. Проверка и приёмка

### 8.1 demo.html

Автономная страница (подключает `slider.css`/`slider.js` относительными путями, без сборки), минимум 4 кейса:

1. `mode=center`, 5 слайдов-«логотипов», spv `"1.2 3 4"` — базовый кейс.
2. Default `mode=free`, 8 слайдов, dots on.
3. `center` + `autoplay=3000` + gap-триплет `"8 16 24"`.
4. Два независимых слайдера подряд с разными именами + слайд с кнопкой и ссылкой внутри (проверка кликов после drag).

### 8.2 Ручной чек-лист (в README раздела Verify)

- Тач/трекпад: нативная инерция, фиксация по центру, `scroll-snap-stop` не даёт пролетать слайды.
- Мышь: drag работает, курсор grab/grabbing, клик по ссылке не срабатывает после drag, но срабатывает после простого клика.
- Первый/последний слайд прижаты к краям, промежуточные — по центру, зазор до соседнего виден с обеих сторон.
- `free`: инерция плавная, без прыжка при отпускании, остановка без доводки.
- Стрелки disabled на краях; точки кликабельны; клавиатура работает.
- Resize через брейкпоинт 737/1280 пересчитывает ширины без прыжка позиции.
- Safari (нет `scrollend`): dots синхронизируются через fallback.
- 120 Гц дисплей: движение однородное (главная претензия к v1).

### 8.3 Автотесты

Добавить `tests-js/slider-v2.test.js` (jsdom, по образцу существующих в `tests-js/`):

- Парсер атрибутов: дефолты, триплеты 1/2/3 значений, невалидные значения → default.
- Кластеризация: два соседних кластера с разными именами → 2 инстанса; слайд с `data-slider-initialized` пропускается.
- `destroy()` восстанавливает исходный DOM (снапшот до/после идентичен).
- Free-режим без явного dots → контейнер точек присутствует.
- IO/scroll в jsdom не эмулировать — логику выбора активного индекса вынести в чистую функцию и тестировать её отдельно.

### 8.4 Definition of Done

- Все пункты 8.1–8.3 выполнены, существующие тесты проекта не сломаны.
- Размеры в пределах целевых метрик (раздел 0).
- v1 не изменён ни на байт.
- README v2 описывает все 6 атрибутов, оба режима и поведение краёв в center-режиме.

## 9. Открытые вопросы (решить по факту прототипа, не блокируют)

1. Нужен ли `mode=start` (фиксация по левому краю, поведение v1)? С scroll-snap это одна строка (`scroll-snap-align: start`) — можно добавить третьим значением, если при тестах center окажется неудобен для каких-то блоков.
2. Центровка первого/последнего слайда через inline-padding скроллера — если clamp к краям будет выглядеть плохо на живых логотипах.
3. Судьба v1: после приёмки v2 — замена в бандле или параллельное существование.

## Addendum (2026-07-11): runtime-namespace отклонение от спеки

Владелец подтвердил, что v1 и v2 никогда не будут установлены на одной странице
одновременно (полная замена на живом сайте, не сосуществование). Поэтому
runtime-имена, описанные выше в разделах 3.1/3.2/5 как `window.CarrdSlider2`,
`.theme-slider2*` и `--s2-*`, были унифицированы с v1 ещё до объединения в
бандл:

- `window.CarrdSlider2` → `window.CarrdSlider`
- `.theme-slider2` / `-scroller` / `-slide` / `-dots` / `-dot` / `-nav` /
  `-nav--prev` / `-nav--next` → `.theme-slider-wrapper` / `-scroller` /
  `-slide` / `-dots` / `-dot` / `-nav` / `-nav--prev` / `-nav--next`
- класс `Slider2` → `Slider`
- `--s2-gap` / `--s2-slide-w` → `--slider-gap` / `--slider-slide-w`

Имя папки/dist-слага (`slider-v2`), заголовок README ("Slider V2") и
`console.warn('[slider-v2] ...')` не менялись — унификация только внутри
рантайм-кода. `data-slider`/`data-slider-initialized` и так были общими с v1
по исходному плану. Оба README (`src/slider/README.md`,
`src/slider-v2/README.md`) прямо документируют, что оба плагина нельзя
ставить на одну страницу одновременно. См. `OPEN-QUESTIONS.md` Q014.

## Addendum (2026-07-11): владелец принял механику, добавлена опция мобильных стрелок

Owner-решения по открытым пунктам раздела 9:

- Механика (scroll-snap, drag, autoplay, edge-clamp) принята как есть.
- Split на `-embed-part1.html`/`-embed-part2.html` (см. `SPLIT_EMBED_PLUGINS` в
  `scripts/minify_plugins.py`) принят как есть. Проверка реального минификатора
  (`terser`, compress+mangle) дала ~20% сокращение (16863 → 13475 байт), но
  этого недостаточно, чтобы уйти от сплита на 2 части (проектный порог одного
  embed — по эмпирике `split_at` в `minify_plugins.py`, ~6–8KB на часть) —
  переход на `terser` для всего build pipeline не сделан, остаётся отдельным
  решением на будущее (задело бы `scripts/minifier.py`, который сейчас
  сознательно "dependency-free").
- `mode=start` — не нужен сейчас, отложен без срока.
- Новая опция: **`data-slider-arrows-mobile="on"`** — показывает prev/next
  стрелки на мобильных (≤736px), где раньше они были безусловно скрыты через
  CSS. По умолчанию `off` (текущее поведение не меняется). Реализовано:
  `parseConfig()` в `slider.js` читает атрибут через существующий
  `parseOnOffFlag`, результат пишется на wrapper как `data-arrows-mobile`;
  `slider.css` получил переопределение `.theme-slider-wrapper[data-arrows-mobile="on"] .theme-slider-nav { display: inline-flex; }`
  внутри существующего мобильного медиа-запроса. Задокументировано в
  `src/slider-v2/README.md`, покрыто тестами в `tests-js/slider2.test.js`.
- Дальнейший план (после того как все правки по плагину внесены): сделать
  `slider-v2` основным слайдером, а v1 `slider` перевести в архив. Это
  отдельный, более крупный шаг (bundle membership, deprecation v1, миграция
  живых сайтов) — не выполняется в рамках этого addendum, зафиксирован как
  будущий пункт в `ROADMAP.md` и `OPEN-QUESTIONS.md` Q012.
