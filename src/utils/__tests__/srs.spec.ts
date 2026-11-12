import { describe, it, expect } from 'vitest'
import {
  review,
  initialStats,
  startOfDayPlus,
  formatInterval,
  isDue,
  isNew,
  AGAIN_DELAY_MS,
  MIN_EASE,
  type CardStats,
  type Grade,
} from '../srs'

// 12 листопада 2026, 15:00 за місцевим часом
const NOW = new Date(2026, 10, 12, 15, 0).getTime()
const DAY = 24 * 60 * 60 * 1000

/** Кілька оцінок поспіль, кожна — в день, коли картка «дозріла» */
function reviewSequence(grades: Grade[]): CardStats {
  let stats = initialStats()
  let now = NOW
  for (const g of grades) {
    stats = review(stats, g, now)
    now = Math.max(stats.due, now) + 1
  }
  return stats
}

describe('review (SM-2)', () => {
  it('«Добре» поспіль: інтервали 1 → 3 → 8 днів', () => {
    expect(reviewSequence(['good']).interval).toBe(1)
    expect(reviewSequence(['good', 'good']).interval).toBe(3)
    expect(reviewSequence(['good', 'good', 'good']).interval).toBe(8) // 3 × 2.5 = 7.5 → 8
  })

  it('наступне повторення — опівночі потрібного дня', () => {
    const stats = review(initialStats(), 'good', NOW)
    expect(stats.due).toBe(new Date(2026, 10, 13, 0, 0).getTime())
  })

  it('«Не пам’ятаю»: скидає серію, знижує легкість, повтор через 10 хв', () => {
    const learned = reviewSequence(['good', 'good'])
    const stats = review(learned, 'again', NOW)
    expect(stats.reps).toBe(0)
    expect(stats.interval).toBe(0)
    expect(stats.lapses).toBe(1)
    expect(stats.ease).toBeCloseTo(learned.ease - 0.2)
    expect(stats.due).toBe(NOW + AGAIN_DELAY_MS)
    expect(stats.wrong).toBe(1)
  })

  it('«Легко» віддаляє швидше, ніж «Добре»; «Важко» — повільніше', () => {
    const base = reviewSequence(['good', 'good'])
    const hard = review(base, 'hard', NOW).interval
    const good = review(base, 'good', NOW).interval
    const easy = review(base, 'easy', NOW).interval
    expect(hard).toBeLessThan(good)
    expect(good).toBeLessThan(easy)
  })

  it('легкість не опускається нижче мінімуму', () => {
    const stats = reviewSequence(Array(20).fill('again'))
    expect(stats.ease).toBe(MIN_EASE)
  })

  it('не змінює вихідний об’єкт (чиста функція)', () => {
    const stats = initialStats()
    review(stats, 'good', NOW)
    expect(stats).toEqual(initialStats())
  })
})

describe('допоміжні функції', () => {
  it('startOfDayPlus враховує межу місяця', () => {
    const lastDay = new Date(2026, 10, 30, 23, 59).getTime()
    expect(startOfDayPlus(lastDay, 1)).toBe(new Date(2026, 11, 1).getTime())
  })

  it('isNew / isDue', () => {
    expect(isNew(undefined)).toBe(true)
    const stats = review(initialStats(), 'good', NOW)
    expect(isNew(stats)).toBe(false)
    expect(isDue(stats, NOW)).toBe(false)
    expect(isDue(stats, NOW + DAY)).toBe(true)
  })

  it.each([
    [0, '10 хв'],
    [3, '3 д'],
    [60, '2 міс'],
    [730, '2 р'],
  ])('formatInterval(%i) → %s', (interval, text) => {
    expect(formatInterval({ ...initialStats(), interval })).toBe(text)
  })
})
