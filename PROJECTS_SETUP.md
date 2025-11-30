# Projects Feature Setup Guide

Я создал полную функциональность для отображения проектов из базы данных с HTML-контентом в iframe.

## Что было сделано

1. ✅ Создана SQL схема для таблицы `projects` с колонкой `html_content`
2. ✅ Созданы TypeScript типы для таблицы `projects`
3. ✅ Созданы API роуты для получения проектов
4. ✅ Созданы страницы для отображения списка проектов и просмотра в iframe
5. ✅ Протестировано подключение к базе данных

## Шаги для запуска

### 1. Применить SQL миграцию

Откройте Supabase SQL Editor и выполните SQL из файла:
```
supabase/migration-projects.sql
```

Или перейдите по ссылке:
https://supabase.com/dashboard/project/_/sql/new

И вставьте содержимое файла `supabase/migration-projects.sql`

Этот скрипт:
- Создаст таблицу `projects` с нужными колонками
- Настроит RLS (Row Level Security) политики
- Добавит 3 тестовых проекта с HTML-контентом

### 2. Проверить миграцию

После выполнения SQL, вы можете протестировать подключение:

```bash
node test-db-connection.js
```

Этот скрипт проверит:
- ✅ Подключение к БД
- ✅ Существование таблицы `projects`
- ✅ Наличие данных

### 3. Запустить приложение

```bash
npm run dev
```

### 4. Открыть страницы проектов

Перейдите по адресам:
- Список проектов: http://localhost:3000/projects
- Отдельный проект: http://localhost:3000/projects/[id]

## Структура файлов

### SQL Schema
- `supabase/schema.sql` - обновлена основная схема
- `supabase/migration-projects.sql` - миграция для создания таблицы projects

### TypeScript Types
- `src/lib/supabase/types.ts` - добавлены типы для projects

### API Routes
- `src/app/api/projects/route.ts` - GET список проектов
- `src/app/api/projects/[id]/route.ts` - GET отдельный проект

### Pages
- `src/app/projects/page.tsx` - страница со списком проектов (сетка карточек)
- `src/app/projects/[id]/page.tsx` - страница просмотра проекта в iframe

### Test Scripts
- `test-db-connection.js` - тест подключения к БД
- `check-projects-structure.js` - проверка структуры таблицы
- `insert-test-data.js` - вставка тестовых данных
- `apply-migration.js` - применение миграции

## Как это работает

1. **База данных**: Таблица `projects` хранит:
   - `id` (bigserial) - уникальный ID
   - `title` (text) - название проекта
   - `description` (text, optional) - описание
   - `html_content` (text) - HTML код для отображения
   - `user_id` (bigint, optional) - ID пользователя
   - `created_at`, `updated_at` - временные метки

2. **API**:
   - `/api/projects` - возвращает список проектов
   - `/api/projects/[id]` - возвращает конкретный проект

3. **Frontend**:
   - `/projects` - отображает сетку с карточками проектов
   - `/projects/[id]` - отображает HTML проекта в iframe с sandboxing

## Тестовые проекты

В миграции включены 3 готовых HTML проекта:
1. **Interactive Portfolio** - портфолио с анимациями
2. **Task Manager Dashboard** - дашборд менеджера задач
3. **Animated Landing Page** - лендинг с CSS анимациями

## Безопасность

- Используется `sandbox="allow-scripts allow-same-origin"` для iframe
- Row Level Security (RLS) настроена на чтение для всех
- HTML контент изолирован в iframe

## Что дальше?

Вы можете:
1. Добавить больше проектов через Supabase SQL Editor
2. Создать UI для добавления проектов
3. Добавить фильтрацию и поиск
4. Добавить категории для проектов
5. Интегрировать с генератором контента

---

## Troubleshooting

### Ошибка "Could not find column"
Убедитесь, что вы выполнили миграцию из `supabase/migration-projects.sql`

### Таблица пустая
Выполните SQL из миграции - там есть INSERT запросы с тестовыми данными

### RLS ошибка
Проверьте, что политики созданы корректно в Supabase Dashboard → Authentication → Policies
