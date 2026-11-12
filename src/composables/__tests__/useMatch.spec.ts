import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'
import { useMatch, PENALTY_MS, WRONG_FLASH_MS } from '../useMatch'
import type { Card } from '@/types'

const makeCards = (n: number): Card[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, term: `term${i}`, definition: `def${i}` }))

/**
 * effectScope — «контейнер» для реактивних ефектів поза компонентом.
 * scope.stop() імітує знищення компонента (спрацьовує onScopeDispose).
 */
function setup(cards: Card[], pairs = 6) {
  const scope = effectScope()
  const match = scope.run(() => useMatch(cards, { pairs }))!
  return { match, scope }
}

describe('useMatch', () => {
  // Фейкові таймери: час рухається лише коли ми кажемо (vi.advanceTimersByTime)
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('start: створює по дві плитки на пару, не більше `pairs`', () => {
    const { match } = setup(makeCards(10), 6)
    expect(match.status.value).toBe('idle')
    match.start()
    expect(match.status.value).toBe('playing')
    expect(match.tiles.value).toHaveLength(12)
    expect(match.totalPairs.value).toBe(6)
  })

  it('правильна пара зникає з поля', () => {
    const { match } = setup(makeCards(3))
    match.start()
    match.select('c0:term')
    match.select('c0:definition')
    expect(match.matchedPairs.value).toBe(1)
    expect(match.tiles.value.find((t) => t.id === 'c0:term')?.matched).toBe(true)
  })

  it('неправильна пара: помилка, штраф і тимчасове підсвічування', () => {
    const { match } = setup(makeCards(3))
    match.start()
    match.select('c0:term')
    match.select('c1:definition')
    expect(match.mistakes.value).toBe(1)
    expect(match.wrongIds.value).toEqual(['c0:term', 'c1:definition'])
    expect(match.elapsed.value).toBeGreaterThanOrEqual(PENALTY_MS)

    vi.advanceTimersByTime(WRONG_FLASH_MS)
    expect(match.wrongIds.value).toEqual([])
  })

  it('повторний клік по плитці скасовує вибір', () => {
    const { match } = setup(makeCards(3))
    match.start()
    match.select('c0:term')
    match.select('c0:term')
    expect(match.selectedId.value).toBeNull()
  })

  it('гра завершується, коли всі пари знайдено, і таймер зупиняється', () => {
    const { match } = setup(makeCards(2))
    match.start()
    vi.advanceTimersByTime(3000)
    for (const id of ['c0', 'c1']) {
      match.select(`${id}:term`)
      match.select(`${id}:definition`)
    }
    expect(match.status.value).toBe('finished')
    expect(match.elapsed.value).toBe(3000)

    vi.advanceTimersByTime(5000)
    expect(match.elapsed.value).toBe(3000) // час «заморожено»
  })

  it('пропускає картки з однаковими термінами', () => {
    const cards: Card[] = [
      { id: 'a', term: 'cat', definition: 'кіт' },
      { id: 'b', term: 'Cat', definition: 'кішка' },
      { id: 'c', term: 'dog', definition: 'пес' },
    ]
    const { match } = setup(cards)
    match.start()
    expect(match.totalPairs.value).toBe(2)
  })

  it('знищення scope зупиняє всі таймери (немає витоку)', () => {
    const { match, scope } = setup(makeCards(3))
    match.start()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    scope.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('canPlay: потрібно щонайменше 2 картки', () => {
    expect(setup(makeCards(1)).match.canPlay.value).toBe(false)
    expect(setup(makeCards(2)).match.canPlay.value).toBe(true)
  })
})
