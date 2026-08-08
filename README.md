# Telegram Travel Agency Mini App — MVP

Клиент листает каталог туров или жмёт **«Подобрать тур индивидуально»**, заполняет короткую форму — заявка падает в `leads`, менеджер получает уведомление в Telegram.

**Стек:** React + Vite · Supabase (БД + Edge Functions) · Telegram Bot API · Vercel

---

## 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. SQL Editor → выполните `supabase/schema.sql`.
3. Добавьте агентство (подставьте chat id менеджера):

```sql
insert into agencies (name, telegram_manager_chat_id)
values ('Тестовое агентство', 'CHAT_ID_МЕНЕДЖЕРА')
returning id;
```

Как узнать `CHAT_ID`: напишите боту `/start`, затем откройте  
`https://api.telegram.org/bot<TOKEN>/getUpdates` и найдите `chat.id`.

4. Выполните `supabase/seed.sql` **или** раскомментируйте insert’ы и подставьте UUID агентства.
5. Скопируйте Project URL и anon key из Settings → API.

---

## 2. Frontend

```bash
npm install
cp .env.example .env
```

Заполните `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_AGENCY_ID=uuid-агентства
```

```bash
npm run dev
```

Без `.env` приложение стартует в **демо-режиме** (локальный каталог, заявки только в console).

Telegram Web App SDK уже подключён в `index.html`.

---

## 3. Telegram Bot + Mini App

1. @BotFather → `/newbot` — сохраните токен.
2. `/newapp` → укажите URL задеплоенного фронта (Vercel).
3. `/setmenubutton` → кнопка меню бота открывает Mini App.

---

## 4. Edge Function (уведомления)

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy notify-lead
supabase secrets set TELEGRAM_BOT_TOKEN=xxx
```

**Database Webhook** в Dashboard:

- Database → Webhooks → Create  
- Table: `leads`  
- Event: `INSERT`  
- URL: `https://xxxxx.supabase.co/functions/v1/notify-lead`  
- Добавьте заголовок авторизации при необходимости (service role / function JWT — по настройкам проекта)

После INSERT в `leads` менеджер получает сообщение с телефоном, датами, бюджетом и пожеланиями.

---

## 5. Деплой

```bash
npm i -g vercel
vercel
```

В Vercel задайте те же `VITE_*` переменные, что и в `.env`, затем Redeploy.

---

## Структура

```
src/
  App.jsx                 # навигация: каталог → тур → форма → успех
  components/             # Catalog, TourCard, TourDetail, LeadForm, Success
  lib/                    # supabase, telegram, api, demoData
supabase/
  schema.sql
  seed.sql
  functions/notify-lead/  # Telegram-уведомление менеджеру
```

---

## Что можно доращивать

- Админка менеджера: CRUD туров + канбан заявок по статусам  
- Фильтры каталога (цена, направление, даты)  
- CRM (Bitrix24, amoCRM)  
- Мультиязычность (UA / CS)
