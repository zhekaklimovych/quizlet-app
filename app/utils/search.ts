import type { StudySet } from '@/types'
import { normalizeAnswer } from './answers'

/**
 * Фільтрує набори за пошуковим запитом.
 * Шукає в назві, описі та в усіх термінах і визначеннях.
 * Кілька слів у запиті — набір має містити КОЖНЕ з них (у будь-якому полі).
 */
export function filterSets(sets: readonly StudySet[], query: string): StudySet[] {
  const words = normalizeAnswer(query).split(' ').filter(Boolean)
  if (words.length === 0) return [...sets]

  return sets.filter((set) => {
    const haystack = normalizeAnswer(
      [set.title, set.description, ...set.cards.flatMap((c) => [c.term, c.definition])].join(' '),
    )
    return words.every((word) => haystack.includes(word))
  })
}
