import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import router from '@/router'

/**
 * Монтує весь застосунок на вказаному URL і чекає, поки завантажаться lazy-сторінки.
 * createMemoryHistory — історія «в пам'яті», без реального адресного рядка браузера.
 * attachTo: document.body — потрібно, щоб працювали фокус і події клавіатури.
 */
export async function mountAt(path: string) {
  const testRouter = createRouter({ history: createMemoryHistory(), routes: router.options.routes })
  await testRouter.push(path)
  await testRouter.isReady()
  const wrapper = mount(App, { global: { plugins: [testRouter] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router: testRouter }
}

/** Імітує натискання клавіші на рівні window */
export async function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  await flushPromises()
}
