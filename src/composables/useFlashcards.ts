import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import type { Card } from '@/types'
import { shuffle } from '@/utils/shuffle'

/**
 * Composable — функція, що інкапсулює реактивну логіку і може використовуватись у будь-якому компоненті.
 * Тут — уся логіка режиму «Картки» без жодного HTML: порядок, поточна позиція, перевертання.
 * Завдяки цьому її легко тестувати окремо від інтерфейсу.
 *
 * MaybeRefOrGetter<Card[]> — приймає масив, ref на масив або функцію () => масив.
 */
export function useFlashcards(source: MaybeRefOrGetter<Card[]>) {
  /** Порядок показу: масив карток (оригінальний або перемішаний) */
  const order = ref<Card[]>([...toValue(source)])
  const index = ref(0)
  const flipped = ref(false)
  const isShuffled = ref(false)

  // Якщо набір змінився (наприклад, відредагували в іншій вкладці) — починаємо спочатку
  watch(
    () => toValue(source),
    (cards) => {
      order.value = isShuffled.value ? shuffle(cards) : [...cards]
      index.value = 0
      flipped.value = false
    },
  )

  const total = computed(() => order.value.length)
  const current = computed(() => order.value[index.value])
  const isFirst = computed(() => index.value === 0)
  const isLast = computed(() => index.value >= total.value - 1)
  /** Прогрес 0..100 для смуги прогресу */
  const progress = computed(() => (total.value ? ((index.value + 1) / total.value) * 100 : 0))

  function flip() {
    flipped.value = !flipped.value
  }

  function next() {
    if (isLast.value) return
    index.value++
    flipped.value = false
  }

  function prev() {
    if (isFirst.value) return
    index.value--
    flipped.value = false
  }

  function toggleShuffle() {
    isShuffled.value = !isShuffled.value
    const cards = toValue(source)
    order.value = isShuffled.value ? shuffle(cards) : [...cards]
    restart()
  }

  function restart() {
    index.value = 0
    flipped.value = false
  }

  return {
    // стан (тільки для читання ззовні — змінюємо лише через функції нижче)
    index,
    flipped,
    isShuffled,
    total,
    current,
    isFirst,
    isLast,
    progress,
    // дії
    flip,
    next,
    prev,
    toggleShuffle,
    restart,
  }
}
