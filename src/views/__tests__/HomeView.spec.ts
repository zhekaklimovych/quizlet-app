import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { mountAt } from '@/__tests__/helpers'

describe('головна: пошук', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('запит з URL (?q=) одразу фільтрує набори', async () => {
    const { wrapper } = await mountAt('/?q=Vue')
    expect(wrapper.text()).toContain('Vue 3: основні поняття')
    expect(wrapper.text()).not.toContain('Англійська: базові дієслова')
    expect((wrapper.find('input[type="search"]').element as HTMLInputElement).value).toBe('Vue')
  })

  it('введення тексту оновлює URL', async () => {
    const { wrapper, router } = await mountAt('/')
    await wrapper.find('input[type="search"]').setValue('бачити')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('бачити')
    expect(wrapper.text()).toContain('Знайдено: 1')
  })

  it('нічого не знайдено → кнопка «Очистити пошук»', async () => {
    const { wrapper, router } = await mountAt('/?q=неіснуюче')
    expect(wrapper.text()).toContain('Нічого не знайдено')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Очистити пошук')!
      .trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBeUndefined()
    expect(wrapper.findAll('h2').length).toBeGreaterThan(1)
  })
})
