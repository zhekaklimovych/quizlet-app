import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useReview } from '@/composables/useReview'
import { useLearn } from '@/composables/useLearn'
import { useProgressStore } from '@/stores/progress'
import type { Card } from '@/types'

const NOW = new Date(2026, 10, 12, 15, 0).getTime()
const DAY = 24 * 60 * 60 * 1000

const cards: Card[] = [
  { id: 'a', term: 'cat', definition: 'кіт' },
  { id: 'b', term: 'dog', definition: 'пес' },
]

describe('useReview', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('нові картки потрапляють у чергу; оцінка без показу відповіді ігнорується', () => {
    const r = useReview(cards, { now: () => NOW })
    expect(r.status.value).toBe('reviewing')
    expect(r.remaining.value).toBe(2)
    r.grade('good') // ще не перевернули
    expect(r.remaining.value).toBe(2)
  })

  it('кнопки показують, через скільки буде наступне повторення', () => {
    const r = useReview(cards, { now: () => NOW })
    expect(r.previews.value.map((p) => p.interval)).toEqual(['10 хв', '1 д', '1 д', '3 д'])
  })

  it('«Не пам’ятаю» повертає картку в кінець черги цієї ж сесії', () => {
    const r = useReview(cards, { now: () => NOW })
    const first = r.current.value!.id
    r.reveal()
    r.grade('again')
    expect(r.remaining.value).toBe(2)
    expect(r.current.value!.id).not.toBe(first)
    r.reveal()
    r.grade('good')
    expect(r.current.value!.id).toBe(first)
  })

  it('сесія закінчується; завтра картки знову до повторення', () => {
    let now = NOW
    const r = useReview(cards, { now: () => now })
    for (let i = 0; i < 2; i++) {
      r.reveal()
      r.grade('good')
    }
    expect(r.status.value).toBe('finished')

    r.start()
    expect(r.status.value).toBe('empty') // сьогодні вже нічого

    now = NOW + DAY
    r.start()
    expect(r.remaining.value).toBe(2)
    expect(useProgressStore().getStats('a')?.reps).toBe(1)
  })
})

describe('useLearn: колбек onAnswered', () => {
  it('викликається з остаточним результатом (після «Зарахувати як правильну»)', () => {
    const onAnswered = vi.fn<(card: Card, correct: boolean) => void>()
    const learn = useLearn([cards[0]!], { onAnswered })
    learn.answerWritten('неправильно')
    learn.overrideCorrect()
    expect(onAnswered).not.toHaveBeenCalled() // ще не натиснули «Продовжити»
    learn.proceed()
    expect(onAnswered).toHaveBeenCalledWith(cards[0], true)
  })
})
