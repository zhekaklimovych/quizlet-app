/** Одна картка: термін (лицьова сторона) і визначення (зворотна сторона). */
export interface Card {
  id: string
  term: string
  definition: string
}

/** Набір карток (study set). */
export interface StudySet {
  id: string
  title: string
  description: string
  cards: Card[]
  /** Дати зберігаємо як timestamp (число мс) — так їх легко серіалізувати в JSON. */
  createdAt: number
  updatedAt: number
}

/**
 * Дані, які користувач вводить у редакторі.
 * Без id і дат — їх проставляє стор.
 * Omit<T, K> — службовий тип TS: «T без полів K».
 */
export type CardDraft = Omit<Card, 'id'> & { id?: string }

export interface StudySetDraft {
  title: string
  description: string
  cards: CardDraft[]
}
