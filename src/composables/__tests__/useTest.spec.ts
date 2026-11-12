import { describe, it, expect } from 'vitest'
import { useTest, gradeQuestion, isAnswered, type TestQuestion } from '../useTest'
import { pickDistractors } from '@/utils/distractors'
import type { Card } from '@/types'

const makeCards = (n: number): Card[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, term: `term${i}`, definition: `def${i}` }))

/** Правильна відповідь на питання будь-якого типу */
const correctAnswer = (q: TestQuestion) => (q.type === 'true-false' ? q.isTrue : q.answer)

describe('pickDistractors', () => {
  it('не повертає правильну відповідь і дублікати', () => {
    const result = pickDistractors('Кіт', ['кіт', 'пес', 'Пес', 'птах', ' КІТ '], 5)
    expect(result.map((r) => r.toLowerCase()).sort()).toEqual(['пес', 'птах'])
  })
})

describe('isAnswered', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['   ', false],
    ['x', true],
    [false, true],
    [true, true],
  ])('%j → %s', (value, expected) => {
    expect(isAnswered(value)).toBe(expected)
  })
})

describe('useTest', () => {
  it('за замовчуванням: до 10 питань, усі типи', () => {
    const test = useTest(makeCards(25))
    expect(test.status.value).toBe('setup')
    expect(test.settings.value.count).toBe(10)
    expect(test.settings.value.types).toHaveLength(3)
  })

  it('генерує задану кількість питань, згрупованих за типом', () => {
    const test = useTest(makeCards(12))
    test.settings.value.count = 9
    test.generate()
    const types = test.questions.value.map((q) => q.type)
    expect(types).toHaveLength(9)
    // По 3 кожного типу, у порядку секцій
    expect(types).toEqual([
      ...Array(3).fill('true-false'),
      ...Array(3).fill('choice'),
      ...Array(3).fill('written'),
    ])
    // Кожна картка — не більше одного разу
    expect(new Set(test.questions.value.map((q) => q.card.id)).size).toBe(9)
  })

  it('лише обрані типи питань', () => {
    const test = useTest(makeCards(5))
    test.settings.value.types = ['choice']
    test.generate()
    expect(test.questions.value.every((q) => q.type === 'choice')).toBe(true)
  })

  it('валідація налаштувань', () => {
    const test = useTest(makeCards(5))
    test.settings.value.count = 6
    expect(test.canGenerate.value).toBe(false)
    test.settings.value.count = 3
    test.settings.value.types = []
    expect(test.settingsErrors.value).toContain('Оберіть хоча б один тип питань')
    test.generate()
    expect(test.status.value).toBe('setup') // не згенерувалось
  })

  it('усі правильні відповіді → 100%', () => {
    const test = useTest(makeCards(6))
    test.settings.value.count = 6
    test.generate()
    for (const q of test.questions.value) test.answers.value[q.id] = correctAnswer(q)
    expect(test.answeredCount.value).toBe(6)
    test.submit()
    expect(test.status.value).toBe('graded')
    expect(test.score.value).toEqual({ correct: 6, total: 6, percent: 100 })
  })

  it('без відповідей → 0%', () => {
    const test = useTest(makeCards(4))
    test.generate()
    test.submit()
    expect(test.score.value.percent).toBe(0)
  })

  it('набір з однієї картки: вибір перетворюється на письмове питання', () => {
    const test = useTest(makeCards(1))
    test.settings.value.types = ['choice']
    test.generate()
    expect(test.questions.value[0]?.type).toBe('written')
  })
})

describe('gradeQuestion', () => {
  const card: Card = { id: 'a', term: 'go', definition: 'йти, їхати' }
  const base = { id: 1, card, prompt: 'go', answer: 'йти, їхати' }

  it('правда/неправда', () => {
    const q: TestQuestion = { ...base, type: 'true-false', shown: 'бачити', isTrue: false }
    expect(gradeQuestion(q, false)).toBe('correct')
    expect(gradeQuestion(q, true)).toBe('wrong')
    expect(gradeQuestion(q, undefined)).toBe('wrong')
  })

  it('письмова — з тими самими правилами, що й у «Заучуванні»', () => {
    const q: TestQuestion = { ...base, type: 'written' }
    expect(gradeQuestion(q, 'Їхати')).toBe('correct')
    expect(gradeQuestion(q, '')).toBe('wrong')
  })
})
