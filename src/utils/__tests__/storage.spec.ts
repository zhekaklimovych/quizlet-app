import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { createVersionedStorage } from '../storage'
import { useSetsStore, STORAGE_KEY } from '@/stores/sets'

const KEY = 'test-key'
const isStringArray = (d: unknown): d is string[] =>
  Array.isArray(d) && d.every((x) => typeof x === 'string')

describe('createVersionedStorage', () => {
  beforeEach(() => localStorage.clear())

  // v1: масив чисел без конверта → v2: масив рядків → v3: рядки у верхньому регістрі
  const storage = createVersionedStorage<string[]>({
    key: KEY,
    version: 3,
    migrations: {
      1: (data) => (data as number[]).map(String),
      2: (data) => (data as string[]).map((s) => s.toUpperCase()),
    },
    validate: isStringArray,
  })

  it('порожньо → null', () => {
    expect(storage.load()).toBeNull()
  })

  it('зберігає в конверті з версією', () => {
    storage.save(['A'])
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ version: 3, data: ['A'] })
    expect(storage.load()).toEqual(['A'])
  })

  it('старі дані без конверта проходять усі міграції по черзі', () => {
    localStorage.setItem(KEY, JSON.stringify([1, 2]))
    expect(storage.load()).toEqual(['1', '2'])
  })

  it('дані проміжної версії мігрують з потрібного кроку', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, data: ['a', 'b'] }))
    expect(storage.load()).toEqual(['A', 'B'])
  })

  it('дані новішої версії застосунку не чіпаємо', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 99, data: ['x'] }))
    expect(storage.load()).toBeNull()
  })

  it('зіпсований JSON або неправильна форма → null', () => {
    localStorage.setItem(KEY, '{oops')
    expect(storage.load()).toBeNull()
    localStorage.setItem(KEY, JSON.stringify({ version: 3, data: [1] }))
    expect(storage.load()).toBeNull()
  })
})

describe('міграція наборів v1 → v2', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('набори старого формату (голий масив) завантажуються і пересохраняються в конверті', async () => {
    // Так зберігали дані кроки 3–10
    const legacy = [
      { id: 'old', title: 'Старий набір', cards: [], createdAt: 1, updatedAt: 1 }, // без description
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))

    const store = useSetsStore()
    expect(store.sets).toHaveLength(1)
    expect(store.sets[0]).toMatchObject({ id: 'old', title: 'Старий набір', description: '' })

    store.createSet({ title: 'Новий', description: '', cards: [] })
    await nextTick()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.version).toBe(2)
    expect(saved.data).toHaveLength(2)
  })
})
