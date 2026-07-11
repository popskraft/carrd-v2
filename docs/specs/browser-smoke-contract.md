# Browser Smoke Contract

## Суть

Browser/live smoke — это проверка уже опубликованной страницы в реальном браузере после локальных тестов и до передачи покупателю. Он нужен для обнаружения ошибок, которые `jsdom` не видит: неправильного Carrd placement, не сохранившихся `data-*`, порядка Embed-скриптов, CDN/network failures, viewport/touch/focus проблем и JavaScript exceptions.

## Ядро

### Что именно означает риск custom JavaScript

Carrd Embed выполняет пользовательский JavaScript внутри страницы. Если критичный script содержит syntax error, `ReferenceError`, ошибку инициализации или неверный DOM selector, выполнение этого script прекращается. Если ошибка произошла в общем bundle или до инициализации следующих компонентов, часть интерактивности может не запуститься; при ошибке в Carrd-owned custom code могут пострадать и последующие сценарии страницы.

Это не утверждение, что любой JS ломает сайт. Это правило контроля: каждый production Embed считается потенциальной точкой отказа, пока его published browser behavior не проверен.

### Минимальный pre-sale smoke

1. Открыть опубликованный URL в чистом desktop browser context.
2. Проверить HTTP `200` для страницы и всех repo-owned CDN assets.
3. Проверить отсутствие `@main`, dev `?rev`, старых `-v2` markers и unexpected CDN refs.
4. Открыть и закрыть modal; проверить Escape, overlay и focus return.
5. Переключить switcher, FAQ/accordeon и slider; проверить mobile viewport и keyboard path.
6. Открыть cart, добавить item, изменить quantity, checkout; проверить form output.
7. Отправить lead form только в тестовом/операторском режиме.
8. Проверить `console.error`, uncaught exceptions и failed critical network requests.
9. Сохранить URL, commit/tag, asset refs, viewport, browser version, timestamp и verdict.

### Verdict

- `PASS` — critical journeys работают, exceptions отсутствуют, refs соответствуют release contract.
- `FAIL` — есть uncaught exception, critical asset failure, live drift или неработающий journey.
- `BLOCKED` — нет authenticated Builder/readback или нельзя безопасно проверить нужный surface.

### Runtime fault isolation

Shared CDN bundles wrap each plugin initialization independently. If one plugin fails during initial setup, the bundle records the failure in `window.CarrdPluginRuntimeErrors`, logs it through `console.error`, and continues to the next plugin. This prevents one broken optional feature from suppressing all later plugin initializers. It does not hide the defect and it does not catch errors thrown later by event handlers; browser smoke must still fail on any unexpected runtime error.

## Детали

Локальный `npm run validate` остаётся обязательным первым gate. Browser smoke не заменяет unit/coverage tests, а закрывает другой класс рисков. Carrd custom-code guidance и troubleshooting подтверждают необходимость проверять валидность JavaScript на опубликованной странице: [Embedding Custom Code](https://carrd.co/docs/building/embedding-custom-code), [Troubleshooting](https://carrd.co/docs/building/troubleshooting).

Текущий аудит от `2026-07-11` обнаружил расхождение: сохранённый inventory говорит о `@2.1.0`, а свежий HTML `https://mini.crd.co/` содержит repo-owned `no-loadwaiting` ref `@b910f70`. Это `FAIL` до объяснения и повторного live readback; автоматически исправлять или публиковать нельзя.
