# Release Contract

## Суть

Проданные Carrd-шаблоны подключают только неизменяемые версии `popskraft/carrd-v2` по SemVer-тегу. Опубликованная версия никогда не перезаписывается: любое изменение runtime получает новый номер, новый Git tag и новый jsDelivr URL.

`main` используется для разработки и проверки. Он не является каналом доставки покупателям, но может использоваться в активном рабочем draft до freeze на релиз.

## Ядро

### Правило версии

- `2.1.0` — зафиксированный релиз. Его tag `v2.1.0` и файлы остаются доступными навсегда.
- `2.1.1` — обратно совместимое исправление. Существующие шаблоны на `2.1.0` не меняются автоматически.
- `2.2.0` — новая функциональность без намеренного нарушения существующего контракта.
- `3.0.0` — несовместимое изменение, требующее явной миграции.
- Номер в `VERSION`, Git tag `v<version>`, changelog и Carrd CDN URL должны совпадать.
- Повторно создавать, перемещать или force-push существующий release tag запрещено.

### Каналы

- `main` — разработка, review, live-доработка draft и подготовка следующего релиза.
- `vX.Y.Z` — immutable Git tag опубликованного релиза.
- `@X.Y.Z` — immutable jsDelivr ref, который вставляется в продаваемый Carrd-шаблон.
- `@main` — разрешён только для активного development draft, пока шаблон находится в доработке и ещё не frozen к продаже.
- `@main` без ручного cache-buster параметра запрещён даже для development draft.
- Development draft на `@main` обязан использовать один и тот же ручной параметр `?rev=...` во всех repo-owned CDN URLs этого Carrd-сайта.
- `@main` — запрещён для опубликованного продаваемого шаблона, release candidate и любой клиентской поставки.

### Development draft на `@main`

- `@main` считается mutable dev-channel и не является стабильным release source.
- jsDelivr branch-cache для `@main` может отставать от GitHub `main` и в отдельных случаях отдавать stale snapshot даже после purge.
- Поэтому development draft на `@main` обновляется только через ручную смену `?rev=...` во всех repo-owned CDN refs.
- Рекомендуемый формат: `?rev=YYYYMMDD-XX`, например `?rev=20260709-01`.
- Пока `rev` не изменён вручную, draft считается привязанным к предыдущему dev-snapshot.
- В одном Carrd draft запрещено смешивать разные `rev` между CSS/JS/runtime/add-on asset URLs.
- Если jsDelivr продолжает отдавать stale branch snapshot даже после смены `rev`, development draft временно переводится на конкретный Git commit SHA из `main`.
- Commit SHA fallback используется только как аварийный dev-pin для точной проверки свежего состояния и должен быть заменён обратно на `@main?rev=...` или на release `@X.Y.Z`, когда branch-cache снова ведёт себя предсказуемо.

### Что происходит со старыми версиями

Старые версии не исчезают. Шаблон с `@2.1.0` продолжает получать файлы из tag `v2.1.0`, даже после выхода `2.1.1` или `2.2.0`. Обновление конкретного шаблона выполняется вручную: заменить все его CDN refs, опубликовать Carrd и пройти post-publish проверку. Development draft при этом может временно жить на `@main`, но перед релизом обязан быть переведён на один конкретный immutable ref.

## Детали

### Когда выпускать версию

- Patch `X.Y.Z+1`: локальное исправление без изменения публичной разметки, API и настроек.
- Minor `X.Y+1.0`: новая возможность или заметное изменение поведения при сохранении обратной совместимости.
- Major `X+1.0.0`: удаление/переименование публичного контракта или миграция, которую нельзя выполнить совместимо.
- Если совместимость не доказана, выбирать следующий minor или major, а не patch.

### Release process

1. Подготовить изменения в `main`.
   - Изменить только `src/`, source README, config и внутреннюю документацию.
   - Если ведётся активная доработка Carrd draft, допускается временно держать его на `@main`, но только с единым ручным `?rev=...` на всех repo-owned CDN refs.
   - Если `@main?rev=...` всё равно отдаёт stale jsDelivr snapshot, допускается временный dev-only переход на конкретный commit SHA из текущего `main`.
   - Записать изменения в `CHANGELOG.md` под `[Unreleased]`.
   - Не менять существующий tag и не редактировать `dist/` вручную.

2. Назначить версию.
   - Выбрать patch, minor или major по правилам выше.
   - Записать номер без `v` в `VERSION`, например `2.1.1`.
   - Перенести готовые записи из `[Unreleased]` в секцию `[2.1.1] - YYYY-MM-DD`.

3. Подготовить release candidate.

   ```bash
   pnpm run release:prepare
   ```

   Команда пересобирает `dist/`, запускает полный `validate` и затем `release:check`. Preflight проверяет SemVer, changelog, отсутствие уже существующего tag и единую версию во всех generated CDN snippets. После неё проверить diff и убедиться, что рабочее дерево содержит только изменения этого релиза.

4. Зафиксировать immutable release.

   ```bash
   git add <release-files>
   git commit -m "Release: v2.1.1"
   git tag -a v2.1.1 -m "Release v2.1.1"
   git push origin main
   git push origin v2.1.1
   pnpm run cdn:purge
   ```

   `pnpm run cdn:purge` читает `VERSION` и очищает только соответствующий version-pinned ref. Команду `cdn:purge:main` не использовать для обычного релиза.

5. Проверить CDN и обновить Carrd.
   - Открыть CSS и JS по `https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@2.1.1/dist/...` и проверить ожидаемое содержимое.
   - В тестовом Carrd-шаблоне заменить все repo-owned CDN refs с `@main?rev=...` на один и тот же release номер.
   - Проверить Builder draft, desktop и mobile.
   - Опубликовать Carrd только после ручного подтверждения владельца.
   - Выполнить post-publish smoke и убедиться, что на странице нет `@main`, `?rev=...` и смешанных версий.

### Pre-sale validation

Перед тем как считать решение готовым к продаже, обязательно проверить:

- В Carrd нет ни одного repo-owned CDN URL на `@main`.
- В Carrd нет ни одного dev-only `?rev=...` параметра.
- Все repo-owned CDN URLs указывают на один и тот же immutable `@X.Y.Z`.
- Published page реально отдаёт те же immutable refs, а не старый branch snapshot.
- Post-publish smoke подтверждает, что runtime/CSS/plug-in assets загружены из release URL, а не из development branch.

### Продажа шаблона

- Каждый передаваемый покупателю шаблон содержит только `@X.Y.Z` URLs.
- В одной поставке все assets используют одну версию, включая add-on plugins.
- Site-owned embeds с tokens, custom CSS, `window.CarrdPluginOptions` и custom JS не входят в CDN release и остаются внутри Carrd.
- Покупатель не получает обновление автоматически. Новая версия предлагается как отдельное осознанное обновление с перечнем изменений и, при необходимости, инструкцией миграции.

### Hotfix

Если ошибка найдена после продажи, не менять прежний tag. Исправить её в `main`, выпустить следующий patch, проверить на canonical smoke surface и затем вручную перевести только выбранные шаблоны на новый URL.

### Запрещено

- Подключать продаваемый шаблон к `@main`, branch ref или commit из незавершённой разработки.
- Подключать продаваемый шаблон к `@main?rev=...` и считать это release-ready.
- Оставлять `@main` в draft после freeze решения о релизе.
- Перемещать `vX.Y.Z` на новый commit или удалять опубликованный tag.
- Публиковать изменённый runtime под уже использованным номером.
- Смешивать в одном Carrd-сайте `@2.1.0`, `@2.1.1` и `@main`.
- Считать purge способом обновить immutable tag: purge очищает кэш, но не меняет commit, на который указывает tag.

### Готово

- `VERSION`, changelog, generated snippets и tag совпадают.
- `pnpm run release:prepare` завершён без ошибок, включая `release:check`.
- Release commit и annotated tag отправлены в GitHub.
- Version-pinned jsDelivr assets доступны и содержат release commit.
- Carrd использует одну версию, не содержит `@main`, не содержит `?rev=...` и прошёл post-publish smoke.
- Старые tags сохранены без изменений.
