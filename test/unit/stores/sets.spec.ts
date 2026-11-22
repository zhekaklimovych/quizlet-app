import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useSetsStore, STORAGE_KEY } from '@/stores/sets'

describe('sets store', () => {
  beforeEach(() => {
    // Кожен тест починається з чистого localStorage і нового екземпляра Pinia
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('при першому запуску створює демо-набори', () => {
    const store = useSetsStore()
    expect(store.sets.length).toBeGreaterThan(0)
  })

  it('створює набір: чистить пробіли, відкидає порожні картки, проставляє id', () => {
    const store = useSetsStore()
    const set = store.createSet({
      title: '  Тест  ',
      description: '',
      cards: [
        { term: ' cat ', definition: ' кіт ' },
        { term: '', definition: '' },
      ],
    })

    expect(set.title).toBe('Тест')
    expect(set.cards).toHaveLength(1)
    expect(set.cards[0]).toMatchObject({ term: 'cat', definition: 'кіт' })
    expect(set.cards[0]?.id).toBeTruthy()
    expect(store.getSet(set.id)).toBe(set)
  })

  it('оновлює набір і зберігає id існуючих карток', () => {
    const store = useSetsStore()
    const set = store.createSet({
      title: 'A',
      description: '',
      cards: [{ term: 'one', definition: '1' }],
    })
    const cardId = set.cards[0]!.id

    store.updateSet(set.id, {
      title: 'B',
      description: 'desc',
      cards: [
        { id: cardId, term: 'one', definition: 'один' },
        { term: 'two', definition: 'два' },
      ],
    })

    const updated = store.getSet(set.id)!
    expect(updated.title).toBe('B')
    expect(updated.cards).toHaveLength(2)
    expect(updated.cards[0]?.id).toBe(cardId)
  })

  it('видаляє набір', () => {
    const store = useSetsStore()
    const set = store.createSet({ title: 'X', description: '', cards: [] })
    store.deleteSet(set.id)
    expect(store.getSet(set.id)).toBeUndefined()
  })

  it('зберігає зміни в localStorage і відновлює їх', async () => {
    const store = useSetsStore()
    store.createSet({ title: 'Persisted', description: '', cards: [] })
    await nextTick() // watch спрацьовує асинхронно — чекаємо наступного «тіку»

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toContain('Persisted')

    // «Перезапуск» застосунку: новий Pinia читає дані з localStorage
    setActivePinia(createPinia())
    const reloaded = useSetsStore()
    expect(reloaded.sets.some((s) => s.title === 'Persisted')).toBe(true)
  })
})
