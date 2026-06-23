# PROMPTS_COPY_RESTORE_V3.md

## Назначение

Набор промптов для AI-агента в Carrd Builder:
1) снять структуру и рецепт сборки с исходного сайта;
2) восстановить структуру на другом сайте;
3) провести финальную проверку.

Основано на правилах проекта:
- использовать только `data-action`, `data-id`, `data-type`;
- не использовать индексы кнопок;
- не выполнять Save/Publish;
- исключать `form`, `#order`, `#thankyou`, `embed07`, `embed08`;
- если стиль отсутствует в target, применять `Main`.

---

## Prompt 1 — Structure Export (SOURCE)

```text
Ты работаешь в SOURCE вкладке Carrd Builder:
{{SOURCE_URL}}

ЗАДАЧА
Собери полный JSON-рецепт для восстановления структуры между Header End и Footer Start.

ЯКОРЯ SOURCE
- Header End: {{SOURCE_HEADER_END_ID}}
- Footer Start: {{SOURCE_FOOTER_START_ID}}

ОБЯЗАТЕЛЬНЫЕ ИСКЛЮЧЕНИЯ
- data-type=form
- секции #order и #thankyou
- data-id: embed07, embed08

ПРАВИЛА
1. Не выдумывать данные.
2. Работать только по фактическому DOM/панели.
3. Не редактировать страницу.
4. Не нажимать Save/Publish.
5. Не использовать toolbar/button index.

ПРОЦЕДУРА
1. Найди все top-level блоки между anchor-ами (исключая сами anchor-ы).
2. Отфильтруй исключения.
3. Для каждого блока зафиксируй:
   - order
   - dataId
   - dataType
   - styleToken:
     a) из класса `--style-*`
     b) если нет, из style dropdown
     c) если нет, `(none)`
   - textFingerprint (первые 140 символов нормализованного текста)
   - children (top-level children в порядке)
   - createAction (`add-{dataType}`)
4. Добавь quality-проверку.

ФОРМАТ ОТВЕТА
Верни строго JSON, без markdown и пояснений:

{
  "meta": {
    "site": "source",
    "url": "{{SOURCE_URL}}",
    "headerEnd": "{{SOURCE_HEADER_END_ID}}",
    "footerStart": "{{SOURCE_FOOTER_START_ID}}",
    "excludedRules": ["form", "#order", "#thankyou", "embed07", "embed08"],
    "timestamp": "ISO"
  },
  "quality": {
    "topLevelBetweenAnchors": 0,
    "excludedCount": 0,
    "includedCount": 0
  },
  "blocks": [
    {
      "order": 1,
      "dataId": "container01",
      "dataType": "container",
      "styleToken": "style7|(none)|null",
      "textFingerprint": "..."
      ,
      "children": [
        {"index": 1, "dataType": "text|image|buttons|divider|...", "dataId": "text08|null"}
      ],
      "createAction": "add-container"
    }
  ],
  "selfCheck": {
    "containsExcludedIds": [],
    "hasFakeData": false,
    "hasTruncatedList": false
  }
}

ПЕРЕД ВЫВОДОМ
- blocks.length == quality.includedCount
- containsExcludedIds пуст
- hasFakeData == false
- hasTruncatedList == false
Если не выполнено, пересканируй и исправь.
```

---

## Prompt 2 — Structure Restore (TARGET)

```text
Ты работаешь в TARGET вкладке Carrd Builder:
{{TARGET_URL}}

ВХОД
- SOURCE_RECIPE_JSON (результат Prompt 1)

ЯКОРЯ TARGET
- Header End: {{TARGET_HEADER_END_ID}}
- Footer Start: {{TARGET_FOOTER_START_ID}}

ПРАВИЛА
1. Работай строго по SOURCE_RECIPE_JSON.
2. Не выдумывай шаги и значения.
3. Используй только `data-action`, `data-id`, `data-type`.
4. Не нажимай Save/Publish.
5. Если styleToken отсутствует в target, ставь styleApplied="Main".
6. При ошибке на блоке: 1 retry, затем фиксируй issue и переходи к следующему.

АЛГОРИТМ
1. Найди `{{TARGET_HEADER_END_ID}}`.
2. Для каждого блока по `order`:
   - создай блок через `createAction`;
   - перемести его сразу после `{{TARGET_HEADER_END_ID}}`, сохраняя порядок;
   - восстанови структуру children в порядке `index`;
   - перенеси контент (минимум: текстовые поля);
   - примени стиль (`styleToken` или fallback `Main`);
   - выполни короткую проверку видимости.
3. Выполни Desktop и Mobile проверку.

ФОРМАТ ОТВЕТА
Верни строго JSON, без markdown и пояснений:

{
  "status": "done|partial|failed",
  "targetMeta": {
    "url": "{{TARGET_URL}}",
    "headerEnd": "{{TARGET_HEADER_END_ID}}",
    "footerStart": "{{TARGET_FOOTER_START_ID}}"
  },
  "summary": {
    "planned": 0,
    "inserted": 0,
    "failed": 0,
    "fallbackMainCount": 0
  },
  "insertedBlocks": [
    {
      "order": 1,
      "sourceDataId": "container01",
      "targetDataId": "containerNN",
      "styleRequested": "style7|(none)|null",
      "styleApplied": "style7|Main|(none)",
      "result": "ok|warn|fail"
    }
  ],
  "issues": [
    {"sourceDataId":"...", "step":"create|move|children|content|style|validate", "error":"..."}
  ],
  "savePublish": "NOT_EXECUTED",
  "selfCheck": {
    "orderPreserved": true,
    "insertedAfterHeaderEnd": true,
    "containsForbiddenBlocks": false
  }
}

ПЕРЕД ВЫВОДОМ
- inserted + failed == planned
- savePublish == "NOT_EXECUTED"
- containsForbiddenBlocks == false
Если не выполнено, исправь результат.

SOURCE_RECIPE_JSON:
<вставить JSON из Prompt 1>
```

---

## Prompt 3 — Post-Validation (TARGET)

```text
Ты проверяешь TARGET после восстановления структуры:
{{TARGET_URL}}

ЗАДАЧА
Сделать финальную валидацию без Save/Publish.

ПРОВЕРКИ
1. Якоря на месте:
   - Header End: {{TARGET_HEADER_END_ID}}
   - Footer Start: {{TARGET_FOOTER_START_ID}}
2. Все вставленные блоки идут сразу после Header End в правильном порядке.
3. Нет запрещенных блоков: form, #order, #thankyou, embed07, embed08.
4. Нет критически пустых блоков там, где в source был контент.
5. Проверка Desktop + Mobile.

ФОРМАТ ОТВЕТА
Верни строго JSON:
{
  "status": "pass|warn|fail",
  "checks": [
    {"name":"anchors", "result":"pass|fail", "details":"..."},
    {"name":"order", "result":"pass|fail", "details":"..."},
    {"name":"forbidden", "result":"pass|fail", "details":"..."},
    {"name":"content", "result":"pass|warn|fail", "details":"..."},
    {"name":"desktop_mobile", "result":"pass|warn|fail", "details":"..."}
  ],
  "manualFixesNeeded": [],
  "savePublish": "NOT_EXECUTED"
}
```

---

## Быстрые значения для koryphey-online

- `SOURCE_URL`: `https://carrd.co/dashboard/4544177104830762/build`
- `TARGET_URL`: `https://carrd.co/dashboard/8089177104819774/build`
- `SOURCE_HEADER_END_ID`: `control06`
- `SOURCE_FOOTER_START_ID`: `control07`
- `TARGET_HEADER_END_ID`: `control04`
- `TARGET_FOOTER_START_ID`: `control02`

