import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useRouter } from '#imports'
import App from '~/app.vue'

/**
 * Монтує весь застосунок (app.vue) на вказаному URL у справжньому Nuxt-середовищі:
 * маршрути беруться з app/pages, працюють автоімпорти, NuxtLink, definePageMeta.
 * attachTo: document.body — потрібно, щоб працювали фокус і події клавіатури.
 */
export async function mountAt(path: string) {
  const wrapper = await mountSuspended(App, { route: path, attachTo: document.body })
  await flushPromises()
  return { wrapper, router: useRouter() }
}

/** Імітує натискання клавіші на рівні window */
export async function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  await flushPromises()
}
