# Plugin README Template

## Purpose
Сделать `src/<plugin>/README.md` короче, устойчивее и совместимее с детерминированной генерацией `dist/<plugin>/README.md`.

## When to use
- Когда создаёшь новый plugin README.
- Когда рефакторишь существующий source README.
- Когда нужно выровнять текст с template-owned install flow и plugin contract.

## Steps
1. Сохрани Title Case заголовок и зеркаль folder name.
2. Используй рабочий порядок секций: `What You Do in Carrd` → `How It Works in Carrd` → `How To Check That It Works` → `Configuration` → `Design`.
3. Не добавляй `## Installation` в source README; install flow принадлежит шаблону.
4. Если нужен `:root` override, покажи его как отдельный `Head` embed под `theme-design-system.html`.
5. Держи текст user-facing: Carrd steps, а не repo maintenance notes.

## Edge Cases
- `Advanced:` секции добавляй только если есть реальная пользовательская настройка, API или per-instance hook.
- Если plugin работает на defaults, скажи это явно и не начинай с длинного config dump.
- Если README становится похож на developer note, перенеси общий контракт в `docs/specs/carrd-v2-contract.md`.

## Done
- Source README читается как Carrd setup guide.
- `dist/<plugin>/README.md` генерируется без ручных правок и без drift.
- Секции и wording совпадают с shared plugin contract.
