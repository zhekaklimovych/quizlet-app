import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountAt } from './helpers'
import { stubMatchMedia } from '../stubs/matchMedia'

const hasDarkClass = () => document.documentElement.classList.contains('dark')

describe('перемикач теми в шапці', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })
  afterEach(() => vi.unstubAllGlobals())

  it('світла → темна по кліку, вибір видно в підказці', async () => {
    stubMatchMedia(false)
    const { wrapper } = await mountAt('/')
    const toggle = wrapper.find('[data-testid="theme-toggle"]')
    expect(toggle.attributes('title')).toBe('Тема: Як у системі')
    await toggle.trigger('click')
    expect(toggle.attributes('title')).toBe('Тема: Світла')
    await toggle.trigger('click')
    expect(hasDarkClass()).toBe(true)
  })
})
