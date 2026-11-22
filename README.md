# Quizlet App

Застосунок для вивчення карток (у стилі Quizlet): набори «термін — визначення» і кілька режимів навчання.

**Онлайн:** https://zhekaklimovych.github.io/quizlet-app/

## Можливості

- Набори карток: створення, редагування, імпорт тексту (з Excel / Google Sheets), експорт у текст і JSON
- Режими: **Картки** (3D-перевертання), **Заучування** (вибір → письмова відповідь), **Підбір пар** (на час), **Тест**, **Повторення** (інтервальне повторення за алгоритмом SM-2)
- Пошук, озвучування термінів (Web Speech API), світла / темна / системна тема
- Дані зберігаються в браузері (localStorage); синхронізація між пристроями — у планах

## Стек

Nuxt 4 (Vue 3, Composition API) · TypeScript · Pinia · Tailwind CSS v4 · Vitest + @nuxt/test-utils

## Розробка

```bash
npm install        # залежності (+ nuxt prepare)
npm run dev        # сервер розробки: http://localhost:3000
npm run test:unit  # тести (unit + сторінки в Nuxt-середовищі)
npm run type-check # перевірка типів
npm run lint       # oxlint + ESLint
npm run generate   # статична збірка в .output/public
```

Деплой на GitHub Pages — автоматично на кожен push у `main` (див. `.github/workflows/deploy.yml`).

## Структура

```
app/
  pages/        маршрути (файлова маршрутизація Nuxt)
  components/   компоненти інтерфейсу
  composables/  логіка режимів навчання (useLearn, useMatch, useTest, useReview…)
  stores/       Pinia: набори (sets) і прогрес повторення (progress)
  utils/        чисті функції: перевірка відповідей, SM-2, імпорт/експорт, сховище з міграціями
test/
  unit/         тести логіки (без Nuxt)
  nuxt/         тести сторінок у Nuxt-середовищі
```

План розвитку — у [PLAN.md](PLAN.md).
