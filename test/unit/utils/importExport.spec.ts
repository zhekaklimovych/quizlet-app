import { describe, it, expect } from 'vitest'
import {
  parseImport,
  exportAsText,
  exportAsJson,
  parseJsonSet,
  toFilename,
  ImportError,
  DEFAULT_IMPORT_OPTIONS,
} from '@/utils/importExport'
import type { StudySet } from '@/types'

const set: StudySet = {
  id: 's',
  title: 'Тварини',
  description: 'опис',
  cards: [
    { id: '1', term: 'cat', definition: 'кіт' },
    { id: '2', term: 'go', definition: 'йти, їхати' },
  ],
  createdAt: 0,
  updatedAt: 0,
}

describe('parseImport', () => {
  it('табуляція + новий рядок (формат Excel/Sheets), Windows-переноси', () => {
    const cards = parseImport('cat\tкіт\r\ndog\tпес\r\n\r\n', DEFAULT_IMPORT_OPTIONS)
    expect(cards).toEqual([
      { term: 'cat', definition: 'кіт' },
      { term: 'dog', definition: 'пес' },
    ])
  })

  it('ділить лише по першому роздільнику', () => {
    const cards = parseImport('go, йти, їхати', {
      termSeparator: 'comma',
      cardSeparator: 'newline',
    })
    expect(cards).toEqual([{ term: 'go', definition: 'йти, їхати' }])
  })

  it('тире та крапка з комою', () => {
    const cards = parseImport('a - 1; b - 2', { termSeparator: 'dash', cardSeparator: 'semicolon' })
    expect(cards).toEqual([
      { term: 'a', definition: '1' },
      { term: 'b', definition: '2' },
    ])
  })

  it('власні роздільники', () => {
    const cards = parseImport('a=1|b=2', {
      termSeparator: 'custom',
      cardSeparator: 'custom',
      customTermSeparator: '=',
      customCardSeparator: '|',
    })
    expect(cards).toHaveLength(2)
  })

  it('рядок без роздільника → термін без визначення', () => {
    expect(parseImport('лише термін', DEFAULT_IMPORT_OPTIONS)).toEqual([
      { term: 'лише термін', definition: '' },
    ])
  })

  it('порожній власний роздільник → нічого', () => {
    expect(parseImport('a b', { termSeparator: 'custom', cardSeparator: 'newline' })).toEqual([])
  })
})

describe('експорт', () => {
  it('текст: термін⇥визначення по рядку', () => {
    expect(exportAsText(set)).toBe('cat\tкіт\ngo\tйти, їхати')
  })

  it('текст → імпорт дає ті самі картки (round-trip)', () => {
    const cards = parseImport(exportAsText(set), DEFAULT_IMPORT_OPTIONS)
    expect(cards).toEqual(set.cards.map(({ term, definition }) => ({ term, definition })))
  })

  it('JSON → parseJsonSet (round-trip)', () => {
    const draft = parseJsonSet(exportAsJson(set))
    expect(draft.title).toBe('Тварини')
    expect(draft.description).toBe('опис')
    expect(draft.cards).toHaveLength(2)
  })
})

describe('parseJsonSet: захист від некоректних файлів', () => {
  it.each([
    ['не JSON', 'не є коректним JSON'],
    ['{"hello": 1}', 'не файл набору'],
    ['{"format":"quizlet-app/set","title":"","cards":[]}', 'немає назви'],
    ['{"format":"quizlet-app/set","title":"X","cards":[{"term":1}]}', 'неправильний формат'],
  ])('%s', (input, message) => {
    expect(() => parseJsonSet(input)).toThrow(ImportError)
    expect(() => parseJsonSet(input)).toThrow(message)
  })
})

describe('toFilename', () => {
  it('прибирає заборонені символи', () => {
    expect(toFilename('Англ: тварини / 1', 'json')).toBe('Англ-тварини-1.json')
    expect(toFilename('???', 'json')).toBe('set.json')
  })
})
