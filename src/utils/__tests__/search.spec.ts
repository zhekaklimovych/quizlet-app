import { describe, it, expect } from 'vitest'
import { filterSets } from '../search'
import type { StudySet } from '@/types'

const makeSet = (id: string, title: string, cards: [string, string][] = []): StudySet => ({
  id,
  title,
  description: '',
  cards: cards.map(([term, definition], i) => ({ id: `${id}-${i}`, term, definition })),
  createdAt: 0,
  updatedAt: 0,
})

const sets = [
  makeSet('a', 'Англійська: тварини', [['cat', 'кіт']]),
  makeSet('b', 'Vue 3', [['ref()', 'реактивне посилання']]),
  makeSet('c', 'Англійська: кольори', [['red', 'червоний']]),
]

describe('filterSets', () => {
  it('порожній запит — усі набори', () => {
    expect(filterSets(sets, '  ')).toHaveLength(3)
  })

  it('шукає в назві без урахування регістру', () => {
    expect(filterSets(sets, 'АНГЛІЙСЬКА').map((s) => s.id)).toEqual(['a', 'c'])
  })

  it('шукає в термінах і визначеннях', () => {
    expect(filterSets(sets, 'кіт').map((s) => s.id)).toEqual(['a'])
    expect(filterSets(sets, 'реактивне').map((s) => s.id)).toEqual(['b'])
  })

  it('кілька слів — мають збігтися всі', () => {
    expect(filterSets(sets, 'англійська червоний').map((s) => s.id)).toEqual(['c'])
  })
})
