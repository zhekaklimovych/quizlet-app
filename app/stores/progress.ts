import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Card } from '@/types'
import { useSetsStore } from './sets'
import { createVersionedStorage, isRecord } from '@/utils/storage'
import { initialStats, isDue, isNew, review, type CardStats, type Grade } from '@/utils/srs'

export const PROGRESS_STORAGE_KEY = 'quizlet-app:progress'

const storage = createVersionedStorage<Record<string, CardStats>>({
  key: PROGRESS_STORAGE_KEY,
  version: 1,
  validate: (data): data is Record<string, CardStats> => isRecord(data),
})

export interface ProgressSummary {
  total: number
  /** Ще не повторювались */
  new: number
  /** Час повторити */
  due: number
  /** Повторені, наступне повторення пізніше */
  scheduled: number
  /** Найближче майбутнє повторення (timestamp) або null */
  nextDue: number | null
}

/**
 * Статистика по кожній картці: { [cardId]: CardStats }.
 * Окремий стор — бо це інша відповідальність, ніж «вміст наборів»:
 * набори можна експортувати/імпортувати, а прогрес — особистий.
 */
export const useProgressStore = defineStore('progress', () => {
  // Один стор може використовувати інший — просто викликаємо його всередині
  const setsStore = useSetsStore()

  const stats = ref<Record<string, CardStats>>(storage.load() ?? {})

  function getStats(cardId: string): CardStats | undefined {
    return stats.value[cardId]
  }

  /** Оцінка в режимі «Повторення»: перераховує розклад картки */
  function reviewCard(cardId: string, grade: Grade, now = Date.now()) {
    stats.value[cardId] = review(stats.value[cardId] ?? initialStats(), grade, now)
  }

  /** Відповідь в інших режимах (Learn, Test): лише лічильники, розклад не змінюється */
  function recordAnswer(cardId: string, correct: boolean) {
    const current = stats.value[cardId] ?? initialStats()
    stats.value[cardId] = {
      ...current,
      correct: current.correct + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1),
    }
  }

  /** Скинути прогрес набору */
  function resetCards(cardIds: readonly string[]) {
    for (const id of cardIds) delete stats.value[id]
  }

  // ---------- запити для набору ----------
  /** `now` — параметр, а не Date.now() всередині: так функцію легко тестувати з будь-яким часом */
  function summarize(cards: readonly Card[], now = Date.now()): ProgressSummary {
    let fresh = 0
    let due = 0
    let nextDue: number | null = null
    for (const card of cards) {
      const s = stats.value[card.id]
      if (isNew(s)) fresh++
      else if (isDue(s, now)) due++
      else if (nextDue === null || s!.due < nextDue) nextDue = s!.due
    }
    return {
      total: cards.length,
      new: fresh,
      due,
      scheduled: cards.length - fresh - due,
      nextDue,
    }
  }

  /** Черга на сесію: спершу ті, що «дозріли» (найстаріші першими), потім до `newLimit` нових */
  function buildQueue(cards: readonly Card[], now = Date.now(), newLimit = 10): Card[] {
    const due = cards
      .filter((c) => isDue(stats.value[c.id], now))
      .sort((a, b) => stats.value[a.id]!.due - stats.value[b.id]!.due)
    const fresh = cards.filter((c) => isNew(stats.value[c.id])).slice(0, newLimit)
    return [...due, ...fresh]
  }

  // ---------- прибирання ----------
  // Усі id карток, що існують зараз. Видалили картку чи набір — її статистика більше не потрібна.
  const existingCardIds = computed(
    () => new Set(setsStore.sets.flatMap((set) => set.cards.map((card) => card.id))),
  )
  watch(
    existingCardIds,
    (ids) => {
      for (const id of Object.keys(stats.value)) {
        if (!ids.has(id)) delete stats.value[id]
      }
    },
    { immediate: true }, // і одразу при старті — на випадок «сиріт», що лишилися з минулого разу
  )

  watch(stats, (value) => storage.save(value), { deep: true })

  return { stats, getStats, reviewCard, recordAnswer, resetCards, summarize, buildQueue }
})
