import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useProgressStore, PROGRESS_STORAGE_KEY } from '@/stores/progress'
import { useSetsStore } from '@/stores/sets'

const NOW = new Date(2026, 10, 12, 15, 0).getTime()
const DAY = 24 * 60 * 60 * 1000

function setup() {
  localStorage.clear()
  setActivePinia(createPinia())
  const sets = useSetsStore()
  const set = sets.createSet({
    title: 'T',
    description: '',
    cards: [
      { term: 'a', definition: '1' },
      { term: 'b', definition: '2' },
      { term: 'c', definition: '3' },
    ],
  })
  const ids = set.cards.map((c) => c.id) as [string, string, string]
  return { sets, set, ids, progress: useProgressStore() }
}

describe('progress store', () => {
  beforeEach(() => localStorage.clear())

  it('summarize: нові → після повторення заплановані → наступного дня до повторення', () => {
    const { set, ids, progress } = setup()
    expect(progress.summarize(set.cards, NOW)).toMatchObject({ new: 3, due: 0, scheduled: 0 })

    progress.reviewCard(ids[0], 'good', NOW)
    const today = progress.summarize(set.cards, NOW)
    expect(today).toMatchObject({ new: 2, due: 0, scheduled: 1 })
    expect(today.nextDue).toBeGreaterThan(NOW)

    expect(progress.summarize(set.cards, NOW + DAY)).toMatchObject({ new: 2, due: 1 })
  })

  it('buildQueue: спершу «дозрілі», потім нові з обмеженням', () => {
    const { set, ids, progress } = setup()
    progress.reviewCard(ids[2], 'good', NOW)
    const queue = progress.buildQueue(set.cards, NOW + DAY, 1)
    expect(queue.map((c) => c.id)).toEqual([ids[2], ids[0]])
  })

  it('recordAnswer рахує відповіді, але не змінює розклад', () => {
    const { ids, progress } = setup()
    progress.recordAnswer(ids[0], true)
    progress.recordAnswer(ids[0], false)
    expect(progress.getStats(ids[0])).toMatchObject({ correct: 1, wrong: 1, lastReviewedAt: 0 })
  })

  it('видалення картки чи набору прибирає її статистику', async () => {
    const { sets, set, ids, progress } = setup()
    progress.recordAnswer(ids[0], true)
    progress.recordAnswer(ids[1], true)

    sets.updateSet(set.id, {
      title: 'T',
      description: '',
      cards: set.cards.slice(1).map(({ id, term, definition }) => ({ id, term, definition })),
    })
    await nextTick()
    expect(progress.getStats(ids[0])).toBeUndefined()
    expect(progress.getStats(ids[1])).toBeDefined()

    sets.deleteSet(set.id)
    await nextTick()
    expect(Object.keys(progress.stats)).toHaveLength(0)
  })

  it('зберігається в localStorage і відновлюється', async () => {
    const { ids, progress } = setup()
    progress.reviewCard(ids[0], 'easy', NOW)
    await nextTick()
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toContain(ids[0])

    // «Перезапуск» — нові екземпляри сторів читають збережене
    setActivePinia(createPinia())
    expect(useProgressStore().getStats(ids[0])?.reps).toBe(1)
  })

  it('resetCards', () => {
    const { set, ids, progress } = setup()
    progress.reviewCard(ids[0], 'good', NOW)
    progress.resetCards(set.cards.map((c) => c.id))
    expect(progress.summarize(set.cards, NOW).new).toBe(3)
  })
})
