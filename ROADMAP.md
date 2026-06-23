# Дорожная Карта

## Суть
`carrd-v2` готов как runtime repo версии `2.0.0`: source/dist используют `*-v2`, `theme-core-v2`, `Carrd*V2` globals и `popskraft/carrd-v2@main` snippets. Активный путь после релиза — live smoke checks на реальных Carrd-страницах.

## Ядро
| # | Работа | Статус |
|---|---|---|
| 1 | Зафиксировать `docs/` как active durable-docs root | done |
| 2 | Нормализовать root `AGENTS.md`, `README.md`, `CLAUDE.md`, `DEFINITION-OF-DONE.md`, `OPEN-QUESTIONS.md` и `docs/INDEX.md` под текущий documentation canon | done |
| 3 | Создать `popskraft/carrd-v2` как отдельный runtime repo для второй версии | done |
| 4 | Формализовать v2 publication contract без публикации v2 в legacy `popskraft/carrd-plugins` | done |
| 5 | Перевести source/dist на `*-v2` public identity, `theme-core-v2`, `Carrd*V2` globals и `popskraft/carrd-v2@main` snippets | done |
| 6 | Применить audit fixes: shopping-cart text escaping, slider ARIA region label, modal refresh API, FAQ rAF height adjustment, cookie Secure flag | done |
| 7 | Сохранить legacy `popskraft/carrd-plugins` историческим freeze ref перед публичным v2 rollout | done |
| 8 | Опубликовать validated `popskraft/carrd-v2` main/tag `v2.0.0` и purge только v2 jsDelivr paths | done |
| 9 | Проверить live-синхронизацию нескольких controllers с одинаковым `data-switcher-v2` | active |
| 10 | Проверить live cluster-переключение целых containers через `data-switcher-v2-cluster` | active |
| 11 | Проверить `accordeon` на рабочем Carrd-сайте на группе `ppf` | active |
| 12 | Проверить promoted `header-nav` anti-jump mobile collapse на рабочем Carrd-сайте | active |
