import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useTheme, THEME_STORAGE_KEY } from '@/composables/useTheme'
import { stubMatchMedia } from '../../stubs/matchMedia'

const hasDarkClass = () => document.documentElement.classList.contains('dark')

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })
  afterEach(() => vi.unstubAllGlobals())

  it('за замовчуванням — як у системі', async () => {
    const system = stubMatchMedia(true)
    const scope = effectScope()
    const theme = scope.run(() => useTheme())!
    expect(theme.mode.value).toBe('system')
    expect(hasDarkClass()).toBe(true)

    // Користувач перемкнув тему в ОС — сторінка реагує
    system.setSystemDark(false)
    await nextTick()
    expect(hasDarkClass()).toBe(false)
    scope.stop()
  })

  it('ручний вибір перекриває системний і зберігається', async () => {
    stubMatchMedia(true)
    const scope = effectScope()
    const theme = scope.run(() => useTheme())!
    theme.mode.value = 'light'
    await nextTick()
    expect(hasDarkClass()).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('"light"')
    scope.stop()
  })

  it('cycle: світла → темна → системна → світла', async () => {
    stubMatchMedia(false)
    const scope = effectScope()
    const theme = scope.run(() => useTheme())!
    theme.mode.value = 'light'
    theme.cycle()
    expect(theme.mode.value).toBe('dark')
    theme.cycle()
    expect(theme.mode.value).toBe('system')
    theme.cycle()
    expect(theme.mode.value).toBe('light')
    scope.stop()
  })

  it('відписується від matchMedia при знищенні', () => {
    const system = stubMatchMedia(false)
    const scope = effectScope()
    scope.run(() => useTheme())
    expect(system.listenerCount()).toBe(1)
    scope.stop()
    expect(system.listenerCount()).toBe(0)
  })

  it('без matchMedia (старі браузери, jsdom) — працює як світла', () => {
    const scope = effectScope()
    const theme = scope.run(() => useTheme())!
    expect(theme.isDark.value).toBe(false)
    scope.stop()
  })
})
