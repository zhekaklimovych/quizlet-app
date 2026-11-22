// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// Базовий шлях: локально '/', на GitHub Pages — '/quizlet-app/' (задається у workflow).
// Nuxt сам читає NUXT_APP_BASE_URL, але значення потрібне й нижче — для посилання на favicon.
const baseURL = process.env.NUXT_APP_BASE_URL || '/'

// Застосовуємо тему ДО завантаження Vue — інакше темна тема на мить «блимне» світлою.
// Ключ і логіка — ті самі, що в app/composables/useTheme.ts
const themeScript = `try {
  var mode = JSON.parse(localStorage.getItem('quizlet-app:theme') || '"system"');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (mode === 'dark' || (mode === 'system' && prefersDark)) document.documentElement.classList.add('dark');
} catch (e) {}`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  /**
   * SPA-режим (рендер лише в браузері), як і до переносу.
   * Дані поки живуть у localStorage, якого на сервері немає — серверний рендер (SSR)
   * показав би демо-набори, а браузер потім підмінив би їх на справжні.
   * Повернемо SSR, коли дані приходитимуть із сервера (крок 12b).
   */
  ssr: false,

  modules: ['@pinia/nuxt'],

  // test/nuxt/ Nuxt додає в перевірку типів сам; unit-тести додаємо явно
  typescript: {
    tsConfig: { include: ['../test/unit/**/*', '../test/stubs/**/*'] },
  },

  css: ['~/assets/main.css'],

  // Tailwind v4 підключається тим самим Vite-плагіном, що й раніше
  vite: {
    plugins: [tailwindcss()],
  },

  // Те, що раніше було в index.html
  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'uk' },
      title: 'Quizlet App',
      link: [
        { rel: 'icon', href: `${baseURL}favicon.ico` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
      script: [{ innerHTML: themeScript, tagPosition: 'head' }],
    },
  },
})
