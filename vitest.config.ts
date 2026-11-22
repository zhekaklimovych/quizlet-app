import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { defineVitestProject } from '@nuxt/test-utils/config'

const appDir = fileURLToPath(new URL('./app', import.meta.url))

/**
 * Два «проєкти» тестів:
 *  - unit — чиста логіка (utils, composables, stores) у звичайному середовищі: швидко, без Nuxt
 *  - nuxt — сторінки й компоненти всередині справжнього Nuxt-застосунку
 *           (працюють автоімпорти, NuxtLink, маршрути з app/pages)
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue()],
        resolve: { alias: { '@': appDir, '~': appDir } },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.spec.ts'],
          environment: 'jsdom',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.spec.ts'],
          environment: 'nuxt',
          environmentOptions: { nuxt: { domEnvironment: 'jsdom' } },
          setupFiles: ['test/nuxt/setup.ts'],
        },
      }),
    ],
  },
})
