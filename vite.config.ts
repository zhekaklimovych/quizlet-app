import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Базовий шлях застосунку. Локально — '/', на GitHub Pages — '/quizlet-app/'
  // (сайт живе за адресою zhekaklimovych.github.io/quizlet-app/). Задається у workflow.
  // Router бере його з import.meta.env.BASE_URL, тож посилання працюють в обох випадках.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
