---
document_type: technical-comparison
version: 1.1
last_updated: 2026-02-17
owner: project
status: reference
next_actions:
  - "Review this guide when selecting CMS for a new project"
  - "Update cost estimates if hosting prices change significantly"
  - "Add new CMS options if they become AI-friendly"
trigger: "CMS selection decision or annual review"
---

# Сравнение CMS для AI-управляемых сайтов

## 🎯 Ключевое решение

**Выбирай стратегию по задаче, а не по технологии:**

| Критерий | Lite Track | Scale Track |
|----------|------------|-------------|
| **Решение** | Decap + Hugo | Strapi + Astro |
| **Команда** | 1-2 человека | 3+ человек, роли |
| **Контент** | Простой (статьи, блог) | Сложные связи, workflow |
| **Бюджет/мес** | ₽150 | ₽600-800 (честный TCO) |
| **Срок MVP** | 2 дня | 5-7 дней |
| **Срок Production** | 3-4 дня | 2 недели |
| **AI-работа** | ⭐⭐⭐⭐ Markdown | ⭐⭐⭐⭐ TypeScript content |

---

## Сводная таблица по всем решениям

| Параметр | Decap + Hugo | Strapi + Astro | Payload + Astro | Directus + 11ty | ProcessWire | WordPress |
|----------|--------------|----------------|-----------------|-----------------|-------------|-----------|
| **🤖 AI dev-код** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ |
| **✍️ AI контент-workflow** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| **👤 UI для редактора** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **💰 Хостинг РФ/мес** | ₽150 | ₽400 | ₽400 | ₽300 | ₽150 | ₽150 |
| **💸 Реальный TCO/мес** | ₽150 | ₽600-800 | ₽600-800 | ₽500-700 | ₽150 | ₽200 |
| **⚙️ Сложность установки** | Очень низкая | Средняя | Средняя | Низкая | Низкая | Очень низкая |
| **🔧 Роли и права** | ❌ Нет | ✅ Отлично | ✅ Отлично | ✅ Хорошо | ✅ Есть | ✅ Есть |
| **🔗 Связи данных** | ❌ Нет | ✅ Отлично | ✅ Отлично | ✅ Хорошо | ✅ Есть | ⚠️ Слабо |
| **📦 Выход** | Статика | Статика | Статика | Статика | PHP | PHP/Статика |

**Легенда TCO:** VDS + бэкапы + мониторинг + обновления + буфер на инциденты.

---

## Dual-track стратегия

### 🟢 Lite Track: Decap + Hugo

#### Когда использовать
- ✅ 1-2 редактора (без сложных ролей)
- ✅ Простой контент: статьи, блог, портфолио
- ✅ Минимальный бюджет (₽150/мес)
- ✅ Статический HTML (как Carrd)
- ✅ Git как source of truth

#### Когда НЕ использовать
- ❌ Команда >3 человек
- ❌ Сложные workflow (draft→review→publish)
- ❌ Связанные данные (products + categories + reviews)
- ❌ Нужны роли: Editor, Reviewer, Publisher
- ❌ Частые обновления без Git знаний

#### Реальная стоимость (месяц)
```
Shared хостинг Beget/TimeWeb:  ₽150
GitHub (приватный репо):       ₽0
Домен:                          ₽25 (₽300/год)
Бэкапы:                         ₽0 (Git = бэкап)
SSL:                            ₽0 (Let's Encrypt)
─────────────────────────────────────
ИТОГО:                          ₽175/мес
```

#### Сроки
| Этап | MVP | Production |
|------|-----|------------|
| Setup Hugo + Decap | 4 часа | 4 часа |
| Миграция контента | 3 часа | 6 часов |
| Интеграция плагинов | 2 часа | 4 часа |
| Тестирование | 1 час | 4 часа |
| CI/CD настройка | — | 4 часа |
| **ИТОГО** | **10 часов (2 дня)** | **22 часа (3-4 дня)** |

---

### 🔵 Scale Track: Strapi + Astro

#### Когда использовать
- ✅ Команда 3+ человек с ролями
- ✅ Сложные связи: products→categories→tags→reviews
- ✅ Workflow: draft→review→schedule→publish
- ✅ Многоязычность (локализация контента)
- ✅ API для мобильных приложений
- ✅ Интеграция с внешними сервисами

#### Когда НЕ использовать
- ❌ Бюджет <₽500/мес
- ❌ 1 редактор, простой блог
- ❌ Нет DevOps компетенций (или бюджета на админа)
- ❌ Контент обновляется раз в неделю
- ❌ Не нужны роли и workflow

#### Реальная стоимость (месяц)
```
VPS TimeWeb (2GB RAM):         ₽490
PostgreSQL managed (опция):    ₽0-200
Бэкапы автоматические:         ₽50
Uptime мониторинг:             ₽0 (UptimeRobot Free)
SSL:                           ₽0 (Let's Encrypt)
Обновления/поддержка:          ₽0-150 (своими силами или админ)
Буфер на инциденты:            ₽100
─────────────────────────────────────
ИТОГО:                         ₽640-990/мес

Честная оценка: ₽700/мес
```

#### Сроки
| Этап | MVP | Production |
|------|-----|------------|
| Setup Strapi + Astro | 6 часов | 6 часов |
| Схема данных + API | 4 часа | 8 часов |
| Миграция контента | 4 часа | 8 часов |
| Роли и права | — | 4 часа |
| Интеграция плагинов | 4 часа | 8 часов |
| Preview/staging | — | 4 часа |
| CI/CD + деплой | 2 часа | 8 часов |
| Бэкапы + мониторинг | — | 6 часов |
| Нагрузочное тестирование | — | 4 часа |
| Документация | — | 4 часов |
| **ИТОГО** | **20 часов (5-7 дней)** | **60 часов (2 недели)** |

---

## Границы применимости Strapi

### ✅ Strapi оправдан когда:

1. **Команда и роли**
   - 3+ человека: редакторы, reviewers, admin
   - Нужны права: "editor может draft, reviewer может publish"
   - Workflow: draft → review → schedule → publish

2. **Сложность данных**
   - Связи: Products ←→ Categories ←→ Tags ←→ Reviews
   - Компоненты: повторяющиеся блоки (Hero, CTA, Testimonial)
   - Локализация: контент на 2+ языках

3. **Интеграции**
   - Внешний API для мобильного приложения
   - Webhook на обновление → Telegram/Slack
   - Интеграция с CDP/CRM/Analytics

4. **Рост и масштаб**
   - План: от 100 до 10,000 страниц
   - Частые обновления (ежедневно)
   - Нужна версионность и rollback контента

### ❌ Strapi избыточен когда:

1. **Простые кейсы**
   - 1-2 редактора без ролей
   - Блог или портфолио
   - Обновления раз в неделю
   - Простые списки без связей

2. **Ограничения ресурсов**
   - Бюджет <₽500/мес
   - Нет DevOps компетенций
   - Нет времени на поддержку

3. **Статический контент**
   - Контент меняется редко
   - Не нужен preview
   - Git как source of truth достаточно

### Граничные случаи (думай дважды)

| Кейс | Decap | Strapi | Почему |
|------|-------|--------|--------|
| 2 редактора, простой блог | ✅ | ⚠️ | Strapi дороже без преимуществ |
| 2 редактора, сложные связи | ⚠️ | ✅ | Decap не умеет relations |
| 5 редакторов, простой контент | ⚠️ | ✅ | Нужны роли, но Decap дешевле |
| 1 редактор + API для мобильного | ❌ | ✅ | Decap нет API |

---

## AI-интеграция: конкретные сценарии

### Decap + Hugo: AI работает с Git

#### Сценарий 1: AI генерирует статью
```bash
# 1. AI получает промпт
User: "Напиши статью про Next.js 15"

# 2. AI генерирует Markdown
AI создаёт файл content/blog/nextjs-15.md:
---
title: "Next.js 15: что нового"
date: 2025-02-10
tags: [javascript, nextjs]
---

## Введение
Next.js 15 принёс...

# 3. AI коммитит в Git
git add content/blog/nextjs-15.md
git commit -m "AI: статья про Next.js 15"
git push origin main

# 4. Decap CMS видит изменения через Git
# 5. Hugo пересобирает сайт
# 6. GitHub Actions деплоит на хостинг
```

**Кто валидирует:** Человек в Decap UI или через Git diff перед merge.

#### Сценарий 2: AI обновляет FAQ
```bash
# 1. Промпт AI
User: "Добавь в FAQ вопрос про цены"

# 2. AI редактирует data/faq.yml
- question: "Сколько стоит Pro план?"
  answer: "Pro план стоит $29/мес"

# 3. Commit + Push
# 4. Автодеплой через GitHub Actions
```

**Промпты хранятся:** В `.ai/prompts/` как Markdown файлы для повторного использования.

---

### Strapi + Astro: AI работает через REST API

#### Сценарий 1: AI создаёт продукт
```javascript
// ai-agent.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 1. AI генерирует данные продукта
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  messages: [{
    role: 'user',
    content: 'Создай описание продукта: органическое мыло с лавандой'
  }]
});

const productData = JSON.parse(response.content[0].text);

// 2. AI создаёт в Strapi через API
await fetch('http://localhost:1337/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: {
      title: productData.title,
      description: productData.description,
      price: productData.price,
      publishedAt: null // Draft status
    }
  })
});

// 3. Человек проверяет в Strapi Admin
// 4. Approve → publishedAt = now()
```

**Кто валидирует:** Reviewer в Strapi UI через workflow (draft → review → publish).

#### Сценарий 2: Массовая генерация контента
```javascript
// bulk-ai-generation.js

// 1. Промпты из файла
const prompts = await fs.readFile('.ai/prompts/product-descriptions.txt');

// 2. AI генерирует пачкой
for (const prompt of prompts) {
  const content = await generateWithClaude(prompt);

  // 3. Создаём в Strapi как draft
  await strapi.createDraft('product', content);
}

// 4. Уведомление в Slack
await notifyReviewers('50 новых продуктов ждут review');

// 5. Reviewer проверяет через Strapi bulk actions
// 6. Массовый publish через UI
```

**Промпты:** В `.ai/prompts/` как текстовые шаблоны + версионность в Git.

**Валидация:**
- Автоматическая: AI проверяет через JSON Schema
- Ручная: Reviewer через Strapi UI
- Финальная: QA через preview URL

#### Сценарий 3: AI отвечает на комментарии
```javascript
// ai-comment-responder.js

// 1. Webhook от Strapi: новый комментарий
app.post('/webhook/comment', async (req) => {
  const comment = req.body;

  // 2. AI анализирует и генерирует ответ
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    messages: [{
      role: 'user',
      content: `Ответь на комментарий пользователя: "${comment.text}"`
    }]
  });

  // 3. AI создаёт draft ответа в Strapi
  await strapi.createComment({
    text: response.content[0].text,
    status: 'pending_review', // Не публикуется автоматически
    parent: comment.id
  });

  // 4. Модератор проверяет и публикует
});
```

**Безопасность:** AI никогда не публикует напрямую, только через review.

---

## ProcessWire → миграция

### Почему ProcessWire проблематичен

**Критические ограничения для AI:**
- AI плохо знает ProcessWire (малопопулярная CMS)
- Генерирует неправильный PHP код (неправильные методы API)
- Устаревшая документация (AI учился на старых версиях)
- Маленькое комьюнити (мало примеров для обучения)

**Пример проблемы:**

AI промпт: "Создай страницу с FAQ секцией"

AI генерирует (неправильно):
```php
<?php
$faqs = $pages->find("template=faq, sort=date"); // Неправильный синтаксис
foreach($faqs as $faq) {
    echo $faq->question; // Может не работать
}
```

Нужно (ProcessWire специфика):
```php
<?php namespace ProcessWire;
$faqs = $pages->find("template=faq, sort=-created"); // Правильный
foreach($faqs as $faq) {
    echo $faq->getUnformatted('question'); // Правильный метод
}
```

С Decap CMS AI генерирует правильно:
```yaml
collections:
  - name: "faq"
    fields:
      - {label: "Question", name: "question"}
      - {label: "Answer", name: "answer"}
```

### План миграции ProcessWire → Decap

**Этап 1: Экспорт (3-4 часа)**
```php
// processwire-export.php
<?php namespace ProcessWire;

$pages = $pages->find("template!=admin");
foreach($pages as $page) {
    $frontmatter = "---\n";
    $frontmatter .= "title: " . $page->title . "\n";
    $frontmatter .= "date: " . date('Y-m-d', $page->created) . "\n";
    if($page->images->count()) {
        $frontmatter .= "image: " . $page->images->first()->url . "\n";
    }
    $frontmatter .= "---\n\n";

    $content = $frontmatter . $page->body;
    file_put_contents("export/{$page->name}.md", $content);
}
```

**Этап 2: Setup Decap + Hugo (2 часа)**
```bash
hugo new site my-site
cd my-site
# Копируем export/*.md в content/
# Настраиваем Decap CMS (2 файла)
```

**Этап 3: Интеграция Carrd плагинов (2 часа)**
```html
<!-- layouts/_default/baseof.html -->
<link rel="stylesheet" href="/theme-design-tokens.css">
<link rel="stylesheet" href="/theme-ui.css">
{{ block "main" . }}{{ end }}
```

**Этап 4: Тестирование и деплой (2 часа)**
```bash
hugo server # Проверка локально
hugo # Build
rsync -avz public/ server:/var/www/
```

**Итого: 1-2 рабочих дня**

---

## Реальные TCO (Total Cost of Ownership)

### Decap + Hugo

| Статья расходов | Стоимость/мес |
|-----------------|---------------|
| Shared хостинг (Beget) | ₽150 |
| Домен (.ru) | ₽25 |
| GitHub (приватный репо) | ₽0 |
| SSL сертификат | ₽0 (Let's Encrypt) |
| Бэкапы | ₽0 (Git) |
| Мониторинг | ₽0 (UptimeRobot Free) |
| Обновления | ₽0 (Hugo статичный) |
| Инциденты (буфер) | ₽0 |
| **ИТОГО** | **₽175/мес** |

**Скрытых расходов нет.**

---

### Strapi + Astro

| Статья расходов | Стоимость/мес |
|-----------------|---------------|
| VPS TimeWeb 2GB | ₽490 |
| Домен (.ru) | ₽25 |
| PostgreSQL managed (опция) | ₽0-200 |
| Бэкапы автоматические | ₽50 |
| SSL сертификат | ₽0 (Let's Encrypt) |
| Мониторинг (UptimeRobot) | ₽0 |
| Обновления Node.js/Strapi | ₽0-150 (2-3 часа/мес) |
| Security патчи | ₽0-100 (критичные) |
| Инциденты (буфер 10%) | ₽100 |
| **ИТОГО минимум** | **₽640/мес** |
| **ИТОГО реальный** | **₽700-900/мес** |

**Скрытые расходы:**
- Обучение команды Strapi: 8-16 часов
- DevOps настройка: 4-8 часов
- Поддержка: 2-4 часа/мес

---

## Матрица принятия решений

| Вопрос | Да → | Нет → |
|--------|------|-------|
| Команда >2 человек? | Strapi | Decap |
| Нужны роли (editor/reviewer/admin)? | Strapi | Decap |
| Сложные связи данных? | Strapi | Decap |
| Бюджет >₽500/мес? | Strapi | Decap |
| Есть DevOps навыки? | Strapi | Decap |
| API для мобильного приложения? | Strapi | Decap |
| Контент обновляется ежедневно? | Strapi | Decap |
| Нужен workflow (draft→review→publish)? | Strapi | Decap |

**Если 5+ "Да" → Strapi оправдан**
**Если 3- "Да" → Decap достаточно**

---

## Следующие шаги

### Для Decap + Hugo:
1. Прототип с твоими Carrd плагинами (2 часа)
2. Скрипт экспорта ProcessWire → Markdown (готов выше)
3. GitHub Actions для автодеплоя (30 минут)

### Для Strapi + Astro:
1. Детальный план по strapi5-astro-architecture-report.md
2. Схема данных для твоего кейса
3. Роли и права (кто что может)

See also: [Strapi 5 + Astro architecture report](./2026-02-12-strapi5-astro-architecture-report.md)
