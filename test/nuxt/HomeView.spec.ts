import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountAt } from './helpers'

describe('головна: пошук', () => {
  beforeEach(() => {
    localStorage.clear()
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
    // Навігація в Nuxt асинхронна (middleware, хуки) — чекаємо, поки URL оновиться
    await vi.waitFor(() => expect(router.currentRoute.value.query.q).toBe('бачити'))
    expect(wrapper.text()).toContain('Знайдено: 1')
  })

  it('нічого не знайдено → кнопка «Очистити пошук»', async () => {
    const { wrapper, router } = await mountAt('/?q=неіснуюче')
    expect(wrapper.text()).toContain('Нічого не знайдено')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Очистити пошук')!
      .trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.query.q).toBeUndefined())
    expect(wrapper.findAll('h2').length).toBeGreaterThan(1)
  })
})
