import type { CardDraft, StudySet, StudySetDraft } from '@/types'
import { isRecord } from './storage'

// ================= Текстовий формат =================

/** Роздільник між терміном і визначенням */
export type TermSeparator = 'tab' | 'comma' | 'dash' | 'custom'
/** Роздільник між картками */
export type CardSeparator = 'newline' | 'semicolon' | 'custom'

export interface ImportOptions {
  termSeparator: TermSeparator
  cardSeparator: CardSeparator
  customTermSeparator?: string
  customCardSeparator?: string
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  termSeparator: 'tab',
  cardSeparator: 'newline',
}

function resolveTermSeparator(o: ImportOptions): string {
  switch (o.termSeparator) {
    case 'tab':
      return '\t'
    case 'comma':
      return ','
    case 'dash':
      return ' - '
    case 'custom':
      return o.customTermSeparator ?? ''
  }
}

function resolveCardSeparator(o: ImportOptions): string {
  switch (o.cardSeparator) {
    case 'newline':
      return '\n'
    case 'semicolon':
      return ';'
    case 'custom':
      return o.customCardSeparator ?? ''
  }
}

/**
 * Розбирає текст на картки.
 *   "cat\tкіт\ndog\tпес"  →  [{ term: 'cat', definition: 'кіт' }, { term: 'dog', definition: 'пес' }]
 * Розбиваємо лише по ПЕРШОМУ роздільнику в рядку — визначення може містити той самий символ
 * ("go, йти, їхати" з роздільником-комою → term "go", definition "йти, їхати").
 */
export function parseImport(text: string, options: ImportOptions): CardDraft[] {
  const termSep = resolveTermSeparator(options)
  const cardSep = resolveCardSeparator(options)
  if (!termSep || !cardSep) return []

  return text
    .replace(/\r\n/g, '\n') // Windows-переноси рядків → \n
    .split(cardSep)
    .map((chunk) => {
      const index = chunk.indexOf(termSep)
      if (index === -1) return { term: chunk.trim(), definition: '' }
      return {
        term: chunk.slice(0, index).trim(),
        definition: chunk.slice(index + termSep.length).trim(),
      }
    })
    .filter((c) => c.term !== '' || c.definition !== '')
}

/** Набір → текст «термін⇥визначення» по рядку на картку (сумісно з Excel/Sheets/Quizlet) */
export function exportAsText(set: StudySet): string {
  return set.cards.map((c) => `${c.term}\t${c.definition}`).join('\n')
}

// ================= JSON =================

export const JSON_FORMAT = 'quizlet-app/set'
export const JSON_VERSION = 1

/** Набір → JSON-рядок. Поле format/version допоможе розпізнати файл і змінювати формат у майбутньому. */
export function exportAsJson(set: StudySet): string {
  const payload = {
    format: JSON_FORMAT,
    version: JSON_VERSION,
    title: set.title,
    description: set.description,
    cards: set.cards.map(({ term, definition }) => ({ term, definition })),
  }
  return JSON.stringify(payload, null, 2)
}

/**
 * Type guard («охоронець типу»): повертає boolean, але TypeScript після `if (isCardLike(x))`
 * вважає, що x має тип { term: string; definition: string }.
 */
function isCardLike(value: unknown): value is { term: string; definition: string } {
  return isRecord(value) && typeof value.term === 'string' && typeof value.definition === 'string'
}

export class ImportError extends Error {}

/**
 * Розбирає JSON-файл набору. Дані з файлу — це `unknown`: їм не можна довіряти,
 * тому перевіряємо кожне поле перед використанням.
 */
export function parseJsonSet(text: string): StudySetDraft {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ImportError('Файл не є коректним JSON')
  }

  if (!isRecord(data) || data.format !== JSON_FORMAT) {
    throw new ImportError('Це не файл набору карток')
  }
  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new ImportError('У файлі немає назви набору')
  }
  if (!Array.isArray(data.cards) || !data.cards.every(isCardLike)) {
    throw new ImportError('Картки у файлі мають неправильний формат')
  }

  return {
    title: data.title,
    description: typeof data.description === 'string' ? data.description : '',
    cards: data.cards.map(({ term, definition }) => ({ term, definition })),
  }
}

// ================= Файли в браузері =================

/** Пропонує браузеру «завантажити» рядок як файл */
export function downloadFile(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob) // тимчасова адреса blob:... на дані в пам'яті
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url) // звільняємо пам'ять
}

/** Безпечна назва файлу з назви набору */
export function toFilename(title: string, ext: string): string {
  const base =
    title
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-') || 'set'
  return `${base}.${ext}`
}
