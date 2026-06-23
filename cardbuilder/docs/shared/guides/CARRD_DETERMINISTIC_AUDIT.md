# Carrd Builder — Deterministic AI Audit Approach

> **Purpose:** Принципы и методология работы AI-агента с редактором Carrd без скриншотов.
> Ключевой принцип: **детерминированный подход** — прямое чтение данных из JS-состояния редактора вместо визуального анализа.

---

## Содержание

1. [Принцип: детерминизм вместо визуального анализа](#1-principle)
2. [Архитектура данных Carrd Builder](#2-architecture)
3. [Точка входа: window.app.builder](#3-entry-point)
4. [Паттерн безопасного обхода объектов](#4-safe-pattern)
5. [Полный аудит сайта одним скриптом](#5-audit-script)
6. [Правила работы с документацией Carrd](#6-docs-rules)
7. [Карта типов компонентов и их полей](#7-component-map)
8. [Стоимость и экономия токенов](#8-token-cost)
9. [Пайплайн внесения правок через JS](#9-edit-pipeline)

---

## 1. Принцип: детерминизм вместо визуального анализа {#1-principle}

### Проблема классического подхода (через скриншоты)

Стандартный подход — скриншот → клик → скриншот панели → чтение значения → запись — дорогой и медленный:

- 1 проверка элемента = ~5 обменов = ~5–8K токенов (входящий скриншот ≈ 1500 токенов)
- 71 кнопка + 28 изображений = **~400K токенов ≈ $1.2** только на один аудит
- Высокий риск ошибок из-за интерпретации визуального состояния

### Детерминированный подход

Carrd Builder держит всё состояние сайта в живых JS-объектах в памяти браузера. Через `javascript_tool` можно читать и изменять эти данные напрямую, без единого скриншота:

```
window.app.builder.site.components  →  все компоненты сайта (319 в примере)
window.app.builder.site.config      →  стили
window.app.builder.site.main        →  корневое дерево
```

**Результат:** полный аудит 319 компонентов = **≈15 JS-запросов ≈ 10K токенов ≈ $0.03**

### Когда скриншоты нужны

Скриншот оправдан только в двух случаях:
1. **Первичная визуальная идентификация** — понять, что за элемент и в каком месте страницы он находится
2. **Финальная верификация** после внесения изменений — убедиться, что результат корректен на экране

---

## 2. Архитектура данных Carrd Builder {#2-architecture}

### Как данные попадают в браузер

При загрузке редактора Carrd встраивает данные сайта в `<script>`-тег в обфусцированном виде:

```js
(function(f,t,w){ w(t("...url-encoded JSON...")) })(window, decodeURIComponent, eval)
```

Это вызывает `app.builder.init({...})` с полными данными сайта. После инициализации все компоненты доступны через `window.app.builder.site.components`.

### Структура компонента

Каждый компонент — живой JS-объект с циклическими ссылками (`parent` → `children` → `parent`):

```javascript
{
  id: "buttons04",           // уникальный ID
  type: "buttons",           // тип компонента
  parent: <ref to parent>,   // ссылка на родителя (circular!)
  children: { ... },         // дочерние компоненты (circular!)
  buttons: {                 // данные, специфичные для типа
    buttons: [
      { label: "+7 (343) 312-23-70", url: "tel:73433122370" }
    ]
  },
  image: { altText: "...", linkUrl: "...", assetId: "..." },  // для image
  links: { links: [...] },                                    // для links
  control: { mode: "scroll-point", scrollPoint: { name: "products" } }, // для control
  settings: { anchor: "..." },
  appearance: { ... },
  animation: { ... }
}
```

**Важно:** `JSON.stringify()` напрямую не работает из-за circular-ссылок. Всегда использовать `safe()`-обёртку (см. раздел 4).

---

## 3. Точка входа: window.app.builder {#3-entry-point}

Все данные сайта доступны через глобальный объект `window.app.builder`, который инициализируется при загрузке редактора. Основные узлы:

```javascript
const b = window.app.builder;

// Все компоненты сайта — плоский объект { id: component }
b.site.components   // { "buttons04": {...}, "image02": {...}, ... }

// Корневое дерево страницы
b.site.main         // корневой объект с children

// Стили и конфигурация
b.site.config       // { components: {...}, styles: {...} }

// UI-состояние редактора
b.instances         // { active: true, ... }
```

### Проверка готовности

```javascript
// Всегда сначала проверяем, что builder готов
window.app?.builder?.site?.components ? 'ready' : 'not ready'
```

---

## 4. Паттерн безопасного обхода объектов {#4-safe-pattern}

Обязательная функция `safe()` для любого чтения данных компонентов. Обходит circular-ссылки и пропускает тяжёлые внутренние объекты:

```javascript
function safe(obj, depth=0) {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => safe(v, depth+1));
  const res = {};
  const SKIP = [
    'parent', '$el', '$canvas', '$wrapper', 'site',
    'styleSheet', 'monitoredConditionStates', '_animateTimeouts',
    '$mainInner', 'intersectionObserver'
  ];
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP.includes(k)) continue;
    res[k] = safe(v, depth+1);
  }
  return res;
}
```

**Правило:** не вызывать `JSON.stringify()` на компоненте без предварительного `safe()`.

---

## 5. Полный аудит сайта одним скриптом {#5-audit-script}

Следующий скрипт запускается один раз и возвращает полную карту проблем:

```javascript
function safe(obj, depth=0) {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => safe(v, depth+1));
  const res = {};
  const SKIP = ['parent','$el','$canvas','$wrapper','site','styleSheet',
                'monitoredConditionStates','_animateTimeouts','$mainInner','intersectionObserver'];
  for (const [k,v] of Object.entries(obj)) { if (SKIP.includes(k)) continue; res[k] = safe(v, depth+1); }
  return res;
}

const comps = window.app.builder.site.components;

// --- Строим карту якорей ---
const knownTargets = new Set();
Object.values(comps).filter(c => c.id?.startsWith('control')).forEach(c => {
  const s = safe(c);
  const sp = s.control?.scrollPoint?.name;
  const sb = s.control?.sectionBreak?.name;
  if (sp) knownTargets.add(sp);
  if (sb) knownTargets.add(sb);
});

// --- Собираем данные всех компонентов ---
const buttons = [], navLinks = [], images = [];

Object.values(comps).forEach(c => {
  const s = safe(c);
  if (c.id?.startsWith('image')) {
    images.push({ id: c.id, altText: s.image?.altText || null, linkUrl: s.image?.linkUrl || null });
  }
  if (c.id?.startsWith('gallery')) {
    (s.gallery?.images || []).forEach((img, i) => {
      images.push({
        id: `${c.id}[${i}]`,
        altText: img?.altText || null,
        caption: img?.caption || null,
        note: !img?.altText && img?.caption ? 'auto-fallback to caption' : null
      });
    });
  }
  if (c.id?.startsWith('buttons')) {
    (s.buttons?.buttons || []).forEach(b => {
      if (!b) return;
      const url = b.url || '';
      buttons.push({ id: c.id, label: b.label || '', url,
        type: url.startsWith('tel:') ? 'phone' : url.startsWith('mailto:') ? 'email'
            : url.startsWith('#') ? 'anchor' : url.startsWith('http') ? 'external'
            : url === 'browser:back' ? 'back' : url === '' ? 'EMPTY' : 'other',
        valid: url.startsWith('#') ? knownTargets.has(url.slice(1)) : true
      });
    });
  }
  if (c.id?.startsWith('links')) {
    (s.links?.links || []).forEach(l => {
      if (!l) return;
      const url = l.url || '';
      navLinks.push({ id: c.id, label: l.label || '', url,
        type: url.startsWith('#') ? 'anchor' : url.startsWith('http') ? 'external'
            : url === '' ? 'EMPTY' : 'other',
        valid: url.startsWith('#') ? knownTargets.has(url.slice(1)) : true
      });
    });
  }
});

// --- Генерируем список проблем ---
const issues = [];
const allLinks = [...buttons, ...navLinks];
allLinks.filter(l => l.type === 'EMPTY').forEach(l =>
  issues.push(`❌ Нет URL: "${l.label}" (${l.id})`));
allLinks.filter(l => l.type === 'anchor' && !l.valid).forEach(l =>
  issues.push(`❌ Якорь не найден: "${l.label}" → ${l.url} (${l.id})`));
allLinks.filter(l => l.url === 'https://domain.ext/path').forEach(l =>
  issues.push(`⚠️  Placeholder URL: "${l.label}" (${l.id})`));
images.filter(i => !i.altText && !i.caption).forEach(i =>
  issues.push(`❌ Нет ALT и нет Caption: ${i.id}`));
images.filter(i => !i.altText && i.caption && i.caption.toLowerCase() === 'untitled').forEach(i =>
  issues.push(`⚠️  Caption-заглушка "Untitled": ${i.id} — требует осмысленного текста по контексту раздела`));
images.filter(i => !i.altText && i.caption && i.caption.toLowerCase() !== 'untitled').forEach(i =>
  issues.push(`ℹ️  ALT пуст, используется caption: ${i.id} ("${i.caption}")`));

// Сохраняем в window для последующего доступа в той же сессии
window._audit = { buttons, navLinks, images, issues, knownTargets: [...knownTargets] };

JSON.stringify({
  summary: {
    buttons: buttons.length, navLinks: navLinks.length,
    images: images.length, imagesNoAlt: images.filter(i=>!i.altText).length,
    issues: issues.length
  },
  issues,
  knownTargets: [...knownTargets]
}, null, 2);
```

### Результат выполнения

Скрипт возвращает JSON с тремя ключами:
- `summary` — общая статистика по компонентам
- `issues` — список всех проблем с указанием id элемента
- `knownTargets` — карта всех зарегистрированных якорей и секций

Результат сохраняется в `window._audit` — повторные обращения в той же сессии не требуют повторного запуска скрипта.

---

## 6. Правила работы с документацией Carrd {#6-docs-rules}

### Когда читать документацию

Перед тем как сделать вывод об ошибке, **всегда сначала проверяй документацию**.

Типичные случаи, когда нужно обращаться к документации:
- Найден URL-паттерн, значение которого неочевидно (например, `#home`, `browser:back`, `section:first`)
- Найден атрибут или поле с незнакомым значением
- Поведение компонента кажется аномальным

**Правило:** «Найдена аномалия → документация → вывод» (не «найдена аномалия → сразу вывод об ошибке»).

### Структура документации Carrd

Точка входа: `https://carrd.co/docs`

```
carrd.co/docs
├── /general          — базовое о Carrd
├── /sites            — управление сайтами, домены, SSL
├── /building         — работа с редактором ← основное
│   ├── /url-types            ← типы URL для кнопок и ссылок
│   ├── /using-sections       ← секции, section-break, header-marker
│   ├── /using-scroll-points  ← scroll-point, якоря
│   ├── /using-advanced-settings
│   └── ...
├── /forms            — формы
├── /account          — аккаунт
└── /pro              — Pro-функции
```

### Алгоритм работы с документацией

```
1. Открыть новую вкладку (не навигировать из вкладки редактора — появится диалог "Leave site?")
   → tabs_create_mcp()
   → navigate(url="https://carrd.co/docs/building", tabId=NEW_TAB)

2. Найти нужную страницу через список ссылок
   → javascript_tool: Array.from(document.querySelectorAll('a[href]')).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))

3. Перейти и прочитать
   → navigate(url="https://carrd.co/docs/building/url-types", tabId=NEW_TAB)
   → get_page_text(tabId=NEW_TAB)

4. Закрыть вкладку
   → tabs_close_mcp(tabId=NEW_TAB)

5. Принять решение на основе документации
```

### Справочник: URL-типы в Carrd (из официальной документации)

| URL | Тип | Поведение |
|-----|-----|-----------|
| `https://domain.ext/path` | Внешний сайт | Открывает URL в браузере |
| `mailto:user@domain.ext` | Email | Открывает почтовый клиент |
| `tel:0005551234` | Телефон | Звонок |
| `sms:0005551234` | SMS | Сообщение |
| `browser:back` | Браузер | Назад в истории |
| `browser:forward` | Браузер | Вперёд |
| `browser:top` | Браузер | Скролл в начало страницы |
| `browser:print` | Браузер | Диалог печати |
| `browser:none` | Браузер | Ничего (используется совместно с событием onclick) |
| `#section-name` | Секция | Открывает секцию с именем `section-name` |
| `section:next/previous/first/last` | Секция | Навигация между секциями |
| `#scrollpoint-name` | Scroll Point | Скролл к точке с именем `scrollpoint-name` |
| `scrollpoint:next/previous/first/last` | Scroll Point | Навигация между точками |
| `clipboard:text` | Буфер | Копирование текста |

**Важно про `#home`:** в документации Carrd не описано явное поведение для незарегистрированных якорей. По наблюдениям из практики, `#home` при отсутствии соответствующего scroll-point или section-break работает как скролл к верху страницы. Перед использованием рекомендуется проверить актуальное поведение в браузере.

---

## 7. Карта типов компонентов и их полей {#7-component-map}

### Поля по типам (как они называются в JS-объекте)

| Тип компонента | id-префикс | Ключевые поля данных |
|---------------|-----------|---------------------|
| `image` | `image*` | `image.altText`, `image.linkUrl`, `image.assetId` |
| `buttons` | `buttons*` | `buttons.buttons[].label`, `buttons.buttons[].url` |
| `links` | `links*` | `links.links[].label`, `links.links[].url` |
| `control` | `control*` | `control.mode`, `control.scrollPoint.name`, `control.sectionBreak.name` |
| `text` | `text*` | `text.text` (строка в формате Markdown) |
| `container` | `container*` | `container.type` ("default"/"columns"), дочерние элементы через `children` |
| `embed` | `embed*` | `embed.code`, `embed.style`, `embed.placement` |
| `form` | `form*` | `form.fields[]`, `form.submit` |
| `gallery` | `gallery*` | `gallery.images[].altText`, `gallery.images[].caption`, `gallery.images[].linkUrl`; если `altText` пуст — Carrd подставляет `caption` автоматически; caption со значением `"Untitled"` — заглушка по умолчанию, фактически пустое поле |

### Контрол-режимы (`control.mode`)

> Список основан на наблюдениях из практики. Могут существовать дополнительные режимы.

| Режим | Назначение |
|-------|-----------|
| `header-marker` | Граница шапки сайта |
| `footer-marker` | Граница подвала сайта |
| `scroll-point` | Именованная точка для якорной ссылки `#name` |
| `section-break` | Разделитель секций (создаёт отдельную «страницу») |

### Родительские цепочки

Для определения, в какой секции или контейнере находится элемент:

```javascript
function getParentChain(c, depth=0) {
  if (!c || depth > 15 || !c.parent?.id) return [];
  return [c.parent.id].concat(getParentChain(c.parent, depth+1));
}

// Пример использования
const chain = getParentChain(comps['links06']);
// → ['container04', 'main']
```

Если элемент находится в контейнере, скрытом через visibility, — это типичная причина ложных срабатываний аудита. Прежде чем считать проблему реальной, нужно проверить цепочку родителей.

---

## 8. Стоимость и экономия токенов {#8-token-cost}

### Сравнение подходов (на примере сайта «Фактура»: 319 компонентов)

> Расчёт ориентировочный, основан на Claude Sonnet при тарифе $3/1M input tokens. Входящий скриншот ≈ 1500 токенов.

| Задача | Скриншот-подход | Детерминированный | Экономия |
|--------|----------------|-------------------|----------|
| Аудит ссылок (71 кнопка) | ~355K токенов | ~5K токенов | **×71** |
| Аудит ALT (28 image + 69 gallery = 97) | ~485K токенов | ~3K токенов | **×160** |
| Полный аудит сайта | ~500K токенов ≈ $1.50 | ~10K токенов ≈ $0.03 | **×50** |

### Принципы экономии токенов

1. **Скриншоты только для верификации** — не для сбора данных
2. **Один JS-запрос вместо N кликов** — итерация по всем компонентам в одном вызове
3. **Сохранять результаты в `window._*`** — повторные запросы читают кэш, не пересчитывают
4. **Читать документацию через `get_page_text()`** — не через скриншоты страниц документации
5. **Открывать вкладку для документации отдельно** — навигация из вкладки редактора вызывает диалог «Leave site?» и блокирует работу

### Шаблон экономного сеанса

```
1. Открыть редактор → ждать загрузки → обработать диалог "Restore session?" если появится
2. ОДИН JS-запрос → получить полную карту всех компонентов (без скриншотов)
3. Анализировать данные локально в JS
4. Если найдена аномалия → открыть новую вкладку → проверить документацию → закрыть вкладку
5. Принять решение и сформировать список задач
6. Вносить изменения через JS или клики
7. ОДИН скриншот для финальной визуальной верификации
```

---

## 9. Пайплайн внесения правок через JS {#9-edit-pipeline}

### Принцип

Правки вносятся напрямую в живые JS-объекты компонентов (`window.app.builder.site.components`), затем фиксируются через механизм истории Carrd и публикуются. Никаких кликов по UI — весь цикл через `javascript_tool`.

### Шаг 1 — Читаем точный текущий контент

Перед патчем **всегда** читаем актуальный контент компонента — не из памяти, а напрямую из объекта. Это защищает от mismatch если компонент менялся ранее в сессии:

```javascript
const comps = window.app.builder.site.components;
// Для текстовых компонентов:
comps['text52']?.text?.content
// Для галерей:
comps['gallery03']?.gallery?.images?.map(i => i.caption)
```

### Шаг 2 — Патч объекта в памяти

```javascript
function patch(id, oldVal, newVal) {
  const c = window.app.builder.site.components[id];
  if (!c?.text) return '❌ not found';
  if (c.text.content !== oldVal) return '⚠️ mismatch — skip';
  c.text.content = newVal;
  return '✅ patched';
}
```

**Правила:**
- Всегда сравниваем `oldVal === c.text.content` перед записью — защита от случайной перезаписи
- Для gallery: `comps['gallery03'].gallery.images[0].caption = 'Новый текст'`
- Для image: `comps['image01'].image.altText = 'Описание'`

### Шаг 3 — Проверяем что изменения попали в сериализацию

```javascript
const json = window.app.builder.site.json();
json.includes('ожидаемый текст'); // должно быть true
```

Если `false` — изменение не применилось. Проверить правильность пути к полю.

### Шаг 3.5 — Подтверждение перед сохранением

> ⚠️ **Обязательное правило:** перед выполнением шагов 4–5 AI-агент **должен остановиться** и показать пользователю список всех внесённых правок с кратким описанием каждого изменения. Публиковать сайт можно только после явного подтверждения («да», «ок», «публикуй» или аналог).

Формат запроса подтверждения:

```
Внёс следующие правки:
✅ text52 — «мы занимается» → «мы занимаемся»
✅ text67 — опечатка «рроизводственный» → «производственный»
✅ gallery03–08 — 56 caption «Untitled» → «Ткань — образец N»

Публикую на faktura.crd.co?
```

Не публиковать автоматически, даже если правки были согласованы заранее на словах.

### Шаг 4 — Фиксируем в истории Carrd

```javascript
const b = window.app.builder;
const newJson = b.site.json();
const assetIds = b.site.assetIds ? b.site.assetIds() : [];
b.history.add('changeComponentProperty', null, newJson, assetIds, b.site.config);
b.site.markChanged();
```

Без этого шага Carrd не будет считать изменения «грязными» и может не опубликовать их.

### Шаг 5 — Публикация

В Carrd нет отдельного «Save draft» — только Publish. Иконка дискеты в тулбаре = Publish.

```javascript
// Программный способ (запускает диалог Publish):
window.app.builder.ui.quickPublish();
// Затем нажать "Publish Changes" в UI или подтвердить через клик
```

Или через DOM — нажать кнопку `Publish Changes` в открывшейся панели.

### Полный шаблон патча (текст)

```javascript
const b = window.app.builder;
const comps = b.site.components;
const log = [];

function patch(id, oldVal, newVal) {
  const c = comps[id];
  if (!c?.text) { log.push(`❌ ${id}: not found`); return; }
  if (c.text.content !== oldVal) { log.push(`⚠️ ${id}: mismatch`); return; }
  c.text.content = newVal;
  log.push(`✅ ${id}`);
}

// --- Вносим правки ---
patch('text52',
  `С 1995 года мы занимается любимым делом`,
  `С 1995 года мы занимаемся любимым делом`
);
// ... остальные patch() ...

// --- Фиксируем ---
const newJson = b.site.json();
const assetIds = b.site.assetIds ? b.site.assetIds() : [];
b.history.add('changeComponentProperty', null, newJson, assetIds, b.site.config);
b.site.markChanged();

log.join('\n');
// После — вызвать Publish через UI или quickPublish()
```

### Полный шаблон патча (gallery caption)

```javascript
const b = window.app.builder;
const comps = b.site.components;

// Заполняем caption по шаблону
const targets = {
  gallery03: Array.from({length: 8}, (_, i) => `Купонная ткань — образец ${i + 1}`),
  gallery04: Array.from({length: 12}, (_, i) => `Жаккард — образец ${i + 1}`),
  // ...
};

Object.entries(targets).forEach(([gid, captions]) => {
  const g = comps[gid];
  captions.forEach((caption, i) => { g.gallery.images[i].caption = caption; });
});

// Фиксируем и публикуем (см. шаги 3–5)
```

### Важные ограничения

| Ситуация | Поведение |
|----------|-----------|
| `c.text.content !== oldVal` | Пропустить — компонент изменён, старый текст неверен |
| Carrd Vue-реактивность | Отсутствует — изменения через прямое присвоение, не через `$set` |
| `JSON.stringify` на компоненте | Запрещено без `safe()` — circular refs |
| `site.json()` не содержит наши изменения | Путь к полю неверный; проверить структуру через `safe(comps[id])` |
| `history.add` без `markChanged()` | Изменение не будет видно как «несохранённое» |
