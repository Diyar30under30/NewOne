# 💣 Minesweeper Pro

Современная платформа для игры в «Сапёр» с мультиплеером, AI-коучем, системой скинов и ежедневными испытаниями.

## 🚀 Быстрый старт

```bash
npm install
cp .env.example .env.local
# Заполните переменные окружения
npm run dev
```

## 📋 Переменные окружения

Создайте файл `.env.local` (или настройте на платформе деплоя):

```env
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🗄️ Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. В разделе SQL Editor выполните миграцию: `src/supabase/migrations/001_initial.sql`
3. В Authentication → Settings → Email включите подтверждение email
4. В Authentication → URL Configuration добавьте ваш домен в Site URL
5. В Storage создайте bucket `avatars` (public)
6. Включите Realtime для таблицы `multiplayer_rooms`

## 🌐 Деплой на Vercel

```bash
npm install -g vercel
vercel --prod
```

Или подключите GitHub репозиторий через [vercel.com](https://vercel.com) и добавьте переменные окружения.

## 🌐 Деплой на Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Или подключите GitHub репозиторий через [netlify.com](https://netlify.com).

## ✨ Функционал

- **🎮 Игра:** 3 сложности (9×9, 16×16, 16×30), блиц-режим, защита от первого хода
- **🤖 AI Коуч:** вероятностный движок, подсказки, 3 режима (включается галочкой)
- **🌐 Мультиплеер:** дуэли, кооп, battle royale через Supabase Realtime
- **📅 Daily Challenge:** единое поле для всех каждый день
- **🎨 Скины:** 6 скинов (Классика, Киберпанк, Космос, Пиксель, Новогодний, Милый)
- **🪙 Монеты:** зарабатывайте за победы, тратьте на скины
- **📊 Статистика:** история игр, рекорды, стрики
- **🏆 Рейтинг:** глобальная таблица лидеров по сложностям
- **🌙 Темы:** светлая, тёмная, высокая контрастность

## 📱 Мобильная поддержка

- Длинный тап → флаг
- Двойной тап → хорд (открыть вокруг числа)
- Адаптивный размер поля под экран

## 🛠️ Стек

- React 18 + TypeScript + Vite
- Zustand (state management)
- Supabase (auth, DB, realtime)
- Tailwind CSS
- React Router v6
