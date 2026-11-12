import {
  computed,
  getCurrentScope,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import type { Card } from '@/types'
import { shuffle } from '@/utils/shuffle'
import { normalizeAnswer } from '@/utils/answers'

export interface MatchTile {
  /** `${cardId}:term` або `${cardId}:definition` */
  id: string
  cardId: string
  side: 'term' | 'definition'
  text: string
  matched: boolean
}

/** idle — екран «Почати гру», playing — гра йде, finished — усі пари знайдено */
export type MatchStatus = 'idle' | 'playing' | 'finished'

/** Штраф за неправильну пару */
export const PENALTY_MS = 1000
/** Скільки триває червоне підсвічування помилки */
export const WRONG_FLASH_MS = 500

export function useMatch(source: MaybeRefOrGetter<Card[]>, { pairs = 6 } = {}) {
  const cards = computed(() => toValue(source))

  const status = ref<MatchStatus>('idle')
  const tiles = ref<MatchTile[]>([])
  const selectedId = ref<string | null>(null)
  const wrongIds = ref<string[]>([])
  const mistakes = ref(0)
  /** Час гри в мс (разом зі штрафами) */
  const elapsed = ref(0)

  // Таймери — звичайні змінні, не ref: у шаблоні вони не потрібні
  let startedAt = 0
  let ticker: ReturnType<typeof setInterval> | undefined
  let wrongTimer: ReturnType<typeof setTimeout> | undefined

  const canPlay = computed(() => cards.value.length >= 2)
  const totalPairs = computed(() => tiles.value.length / 2)
  const matchedPairs = computed(() => tiles.value.filter((t) => t.matched).length / 2)

  /**
   * Обираємо до `pairs` карток з унікальними термінами й визначеннями.
   * Інакше дві плитки «cat» були б візуально однакові, але лише одна з них — «правильна».
   */
  function pickCards(): Card[] {
    const terms = new Set<string>()
    const definitions = new Set<string>()
    const picked: Card[] = []
    for (const card of shuffle(cards.value)) {
      const t = normalizeAnswer(card.term)
      const d = normalizeAnswer(card.definition)
      if (!t || !d || terms.has(t) || definitions.has(d)) continue
      terms.add(t)
      definitions.add(d)
      picked.push(card)
      if (picked.length === pairs) break
    }
    return picked
  }

  function updateElapsed() {
    elapsed.value = Date.now() - startedAt + mistakes.value * PENALTY_MS
  }

  function clearWrong() {
    clearTimeout(wrongTimer)
    wrongIds.value = []
  }

  function stopTimers() {
    clearInterval(ticker)
    clearWrong()
  }

  function start() {
    stopTimers()
    tiles.value = shuffle(
      pickCards().flatMap((c): MatchTile[] => [
        { id: `${c.id}:term`, cardId: c.id, side: 'term', text: c.term, matched: false },
        {
          id: `${c.id}:definition`,
          cardId: c.id,
          side: 'definition',
          text: c.definition,
          matched: false,
        },
      ]),
    )
    selectedId.value = null
    mistakes.value = 0
    elapsed.value = 0
    startedAt = Date.now()
    // Оновлюємо табло 10 разів на секунду
    ticker = setInterval(updateElapsed, 100)
    status.value = 'playing'
  }

  function select(tileId: string) {
    if (status.value !== 'playing') return
    const tile = tiles.value.find((t) => t.id === tileId)
    if (!tile || tile.matched) return

    clearWrong() // новий клік одразу прибирає червоне підсвічування попередньої помилки

    // Перша плитка пари
    if (selectedId.value === null) {
      selectedId.value = tileId
      return
    }
    // Повторний клік по тій самій плитці — скасувати вибір
    if (selectedId.value === tileId) {
      selectedId.value = null
      return
    }

    // Друга плитка — перевіряємо пару
    const first = tiles.value.find((t) => t.id === selectedId.value)
    selectedId.value = null
    if (!first) return

    if (first.cardId === tile.cardId) {
      first.matched = true
      tile.matched = true
      if (matchedPairs.value === totalPairs.value) finish()
    } else {
      mistakes.value++
      updateElapsed()
      wrongIds.value = [first.id, tile.id]
      wrongTimer = setTimeout(clearWrong, WRONG_FLASH_MS)
    }
  }

  function finish() {
    updateElapsed()
    stopTimers()
    status.value = 'finished'
  }

  function reset() {
    stopTimers()
    tiles.value = []
    selectedId.value = null
    mistakes.value = 0
    elapsed.value = 0
    status.value = 'idle'
  }

  // Набір змінився — повертаємось на стартовий екран
  watch(cards, reset)

  // Коли компонент (або інший «scope»), що викликав composable, знищується — зупиняємо таймери.
  // getCurrentScope() перевіряє, що ми справді всередині компонента/effectScope.
  if (getCurrentScope()) onScopeDispose(stopTimers)

  return {
    status,
    tiles,
    selectedId,
    wrongIds,
    mistakes,
    elapsed,
    canPlay,
    totalPairs,
    matchedPairs,
    start,
    select,
    reset,
  }
}
