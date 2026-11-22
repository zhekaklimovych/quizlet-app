import { vi } from 'vitest'

/** Фейковий matchMedia, яким тест може «перемкнути» системну тему */
export function stubMatchMedia(initialDark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>()
  const mql = {
    matches: initialDark,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.delete(fn),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  )
  return {
    setSystemDark(value: boolean) {
      mql.matches = value
      listeners.forEach((fn) => fn({ matches: value }))
    },
    listenerCount: () => listeners.size,
  }
}
