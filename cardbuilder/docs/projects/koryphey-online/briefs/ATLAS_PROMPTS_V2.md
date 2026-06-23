# ATLAS_PROMPTS_V2.md

## Prompt 1 (STRICT SOURCE SCAN)

```text
Ты работаешь в SOURCE вкладке:
https://carrd.co/dashboard/4544177104830762/build

ЗАДАЧА:
Собрать ПОЛНЫЙ фактический JSON-рецепт блоков между Header End и Footer Start.

КРИТИЧЕСКИЕ ПРАВИЛА:
1) Запрещено придумывать данные.
2) Любое поле JSON должно быть взято только из текущего DOM/панели.
3) Нельзя сокращать список блоков.
4) Нельзя возвращать частичный результат.
5) Нельзя редактировать страницу.
6) Нельзя нажимать Save/Publish.

ФАКТИЧЕСКИЕ ЯКОРЯ SOURCE:
- Header End: control06
- Footer Start: control07

ОБЯЗАТЕЛЬНЫЕ ИСКЛЮЧЕНИЯ:
- data-type=form
- секции #order и #thankyou (весь диапазон между соответствующими control)
- технические embeds: embed08, embed07

ПРОЦЕДУРА (строго):
1) Найди top-level порядок блоков между control06 и control07.
2) Для каждого кандидата применяй фильтры исключений.
3) Для каждого включенного блока собери:
   - order (реальный порядок)
   - dataId (точно из data-id)
   - dataType (точно из data-type)
   - styleToken:
     a) сначала из class вида --style-*
     b) если нет, из style dropdown панели
     c) если реально нет, "(none)"
   - sectionTag (фактическая секция по control-маркерам)
   - childrenRecipe (по фактическим дочерним элементам в DOM, в порядке)
   - createRecipe:
     - addAction=add-{dataType}
     - edits только по реально существующим/заполненным полям
   - validationHint (1 проверка видимости + 1 проверка содержимого)

ЗАПРЕТ НА АБСТРАКЦИИ:
- Нельзя писать “примерно”, “и т.д.”, “accent color”, “card style” без фактических значений.
- Если значение неизвестно, укажи null, но не выдумывай.

ФОРМАТ ОТВЕТА:
Строго JSON, без markdown и без пояснений.

{
  "meta": {
    "site": "source",
    "url": "https://carrd.co/dashboard/4544177104830762/build",
    "headerEnd": "control06",
    "footerStart": "control07",
    "excludedRules": ["form", "#order", "#thankyou", "embed08", "embed07"],
    "timestamp": "ISO"
  },
  "quality": {
    "topLevelBetweenAnchors": 0,
    "excludedCount": 0,
    "includedCount": 0,
    "mustBeNonZero": true
  },
  "blocks": [
    {
      "order": 1,
      "dataId": "container01",
      "dataType": "container",
      "styleToken": "style7|(none)|null",
      "sectionTag": "#how|default|...",
      "childrenRecipe": [
        {
          "index": 1,
          "dataType": "text|image|buttons|list|divider|...",
          "dataId": "text08|null",
          "summary": "фактический краткий текст/роль"
        }
      ],
      "createRecipe": {
        "addAction": "add-container",
        "edits": {
          "content": [{"field":"exact-field-name","value":"exact-value-or-null"}],
          "appearance": [{"field":"exact-field-name","value":"exact-value-or-null"}],
          "animation": [{"field":"exact-field-name","value":"exact-value-or-null"}],
          "settings": [{"field":"exact-field-name","value":"exact-value-or-null"}]
        }
      },
      "validationHint": {
        "visibilityCheck": "что должно быть видно",
        "contentCheck": "какой текст/элемент обязан присутствовать"
      }
    }
  ],
  "selfCheck": {
    "hasFakeData": false,
    "hasTruncatedBlocks": false,
    "containsExcludedIds": [],
    "errors": []
  }
}

ПЕРЕД ВЫВОДОМ JSON СДЕЛАЙ ПРОВЕРКУ:
- includedCount >= 30
- blocks.length == includedCount
- containsExcludedIds пуст
- hasFakeData=false
- hasTruncatedBlocks=false
Если условие не выполнено, не выводи неполный JSON, а пересканируй и исправь.
```

---

## Prompt 2 (STRICT TARGET REBUILD)

```text
Ты работаешь в TARGET вкладке:
https://carrd.co/dashboard/8089177104819774/build

Вход:
- SOURCE_RECIPE_JSON (из Prompt 1)

КРИТИЧЕСКИЕ ПРАВИЛА:
1) Запрещено придумывать шаги/значения.
2) Выполнять только то, что есть в SOURCE_RECIPE_JSON.
3) Не использовать индексы кнопок, только data-action/data-id/data-type.
4) Не нажимать Save/Publish.
5) При ошибке: 1 retry, затем записать issue и перейти дальше.

ФАКТИЧЕСКИЕ ЯКОРЯ TARGET:
- Header End: control04
- Footer Start: control02

ПРАВИЛА МИГРАЦИИ:
- Вставка строго сразу после control04 в порядке order.
- Исключения уже применены в source JSON; повторно проверяй, что form/#order/#thankyou/embed08/embed07 не вставляются.
- Если styleToken отсутствует в target -> styleApplied = "Main".

АЛГОРИТМ:
1) Найти control04.
2) Для каждого блока по order:
   a) создать корневой элемент через addAction
   b) собрать childrenRecipe в порядке index
   c) применить edits из content/appearance/animation/settings
   d) применить стиль styleToken, fallback Main
   e) выполнить validationHint
3) После цикла:
   - Desktop check
   - Mobile check

ФОРМАТ ОТВЕТА:
Строго JSON, без markdown/пояснений.

{
  "status": "done|partial|failed",
  "targetMeta": {
    "url": "https://carrd.co/dashboard/8089177104819774/build",
    "headerEnd": "control04",
    "footerStart": "control02"
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
  "skippedBlocks": [
    {"sourceDataId":"...","reason":"excluded-rule|build-failed|validation-failed"}
  ],
  "issues": [
    {"sourceDataId":"...","step":"create|children|style|validate","error":"..."}
  ],
  "manualFixesNeeded": [],
  "savePublish": "NOT_EXECUTED",
  "selfCheck": {
    "orderPreserved": true,
    "insertedAfterControl04": true,
    "containsForbiddenBlocks": false
  }
}

ФИНАЛЬНАЯ ПРОВЕРКА ПЕРЕД ВЫВОДОМ:
- inserted + failed == planned
- savePublish == NOT_EXECUTED
- containsForbiddenBlocks == false
Если нет, исправь и только потом выведи JSON.

SOURCE_RECIPE_JSON:
<вставить JSON из Prompt 1>
```

---

## Operator Note

Если Atlas вернул JSON с `includedCount < 30`, `hasFakeData=true`, или не совпадает арифметика в summary — считать результат браком и перезапускать Prompt 1/2.
