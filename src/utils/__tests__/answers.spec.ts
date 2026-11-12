import { describe, it, expect } from 'vitest'
import { checkWrittenAnswer, levenshtein, normalizeAnswer } from '../answers'

describe('normalizeAnswer', () => {
  it('ігнорує регістр, зайві пробіли й розділові знаки', () => {
    expect(normalizeAnswer('  Hello,   World! ')).toBe('hello world')
  })

  it('уніфікує апострофи', () => {
    expect(normalizeAnswer('пам’ять')).toBe(normalizeAnswer("пам'ять"))
    expect(normalizeAnswer('памʼять')).toBe(normalizeAnswer("пам'ять"))
  })
})

describe('levenshtein', () => {
  it.each([
    ['', '', 0],
    ['abc', '', 3],
    ['кіт', 'кот', 1],
    ['kitten', 'sitting', 3],
  ])('%s → %s = %i', (a, b, expected) => {
    expect(levenshtein(a, b)).toBe(expected)
  })
})

describe('checkWrittenAnswer', () => {
  it('точна відповідь (без урахування регістру)', () => {
    expect(checkWrittenAnswer('Бачити', 'бачити')).toBe('correct')
  })

  it('приймає будь-який варіант через кому', () => {
    expect(checkWrittenAnswer('йти', 'йти, їхати')).toBe('correct')
    expect(checkWrittenAnswer('їхати', 'йти, їхати')).toBe('correct')
    expect(checkWrittenAnswer('йти, їхати', 'йти, їхати')).toBe('correct')
  })

  it('прощає одну описку в довгому слові', () => {
    expect(checkWrittenAnswer('приходти', 'приходити')).toBe('typo')
  })

  it('не прощає описку в короткому слові', () => {
    expect(checkWrittenAnswer('cot', 'cat')).toBe('wrong')
  })

  it('порожня відповідь — неправильна', () => {
    expect(checkWrittenAnswer('   ', 'будь-що')).toBe('wrong')
  })
})
