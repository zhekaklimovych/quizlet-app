import { describe, it, expect } from 'vitest'
import { nextTick, ref } from 'vue'
import { useFlashcards } from '@/composables/useFlashcards'
import { shuffle } from '@/utils/shuffle'
import type { Card } from '@/types'

const makeCards = (n: number): Card[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, term: `t${i}`, definition: `d${i}` }))

describe('shuffle', () => {
  it('не змінює вихідний масив і зберігає всі елементи', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('useFlashcards', () => {
  it('навігація вперед/назад не виходить за межі', () => {
    const fc = useFlashcards(makeCards(3))
    expect(fc.current.value?.id).toBe('c0')
    fc.prev()
    expect(fc.index.value).toBe(0)
    fc.next()
    fc.next()
    fc.next()
    expect(fc.index.value).toBe(2)
    expect(fc.isLast.value).toBe(true)
  })

  it('перевертання скидається при переході до іншої картки', () => {
    const fc = useFlashcards(makeCards(2))
    fc.flip()
    expect(fc.flipped.value).toBe(true)
    fc.next()
    expect(fc.flipped.value).toBe(false)
  })

  it('прогрес рахується від 1-ї картки', () => {
    const fc = useFlashcards(makeCards(4))
    expect(fc.progress.value).toBe(25)
    fc.next()
    expect(fc.progress.value).toBe(50)
  })

  it('перемішування зберігає всі картки і повертає на початок', () => {
    const fc = useFlashcards(makeCards(10))
    fc.next()
    fc.toggleShuffle()
    expect(fc.isShuffled.value).toBe(true)
    expect(fc.index.value).toBe(0)
    expect(fc.total.value).toBe(10)
    fc.toggleShuffle()
    expect(fc.current.value?.id).toBe('c0') // вимкнули — повернувся вихідний порядок
  })

  it('реагує на зміну джерела карток', async () => {
    const cards = ref(makeCards(2))
    const fc = useFlashcards(cards)
    fc.next()
    cards.value = makeCards(5)
    await nextTick()
    expect(fc.total.value).toBe(5)
    expect(fc.index.value).toBe(0)
  })
})
