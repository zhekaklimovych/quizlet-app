import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { Card } from '@/types'
import { useProgressStore } from '@/stores/progress'
import { GRADES, formatInterval, initialStats, review, type Grade } from '@/utils/srs'

/** empty — повторювати нічого, reviewing — сесія йде, finished — черга закінчилась */
export type ReviewStatus = 'empty' | 'reviewing' | 'finished'

/**
 * Сесія повторення. На відміну від useLearn, тут стан живе в Pinia-сторі (progress),
 * тож composable лише керує чергою поточної сесії.
 *
 * `now` — функція часу (а не Date.now напряму), щоб у тестах можна було «перемотувати» дні.
 */
export function useReview(
  source: MaybeRefOrGetter<Card[]>,
  { newLimit = 10, now = () => Date.now() } = {},
) {
  const progress = useProgressStore()

  const status = ref<ReviewStatus>('empty')
  const queue = ref<Card[]>([])
  const flipped = ref(false)
  const reviewedCount = ref(0)
  const gradeCounts = ref<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 })

  const current = computed(() => queue.value[0])
  const remaining = computed(() => queue.value.length)

  /** Підписи на кнопках: що станеться після кожної оцінки («через 3 д») */
  const previews = computed(() => {
    const card = current.value
    if (!card) return []
    const stats = progress.getStats(card.id) ?? initialStats()
    return GRADES.map((g) => ({ ...g, interval: formatInterval(review(stats, g.grade, now())) }))
  })

  function start() {
    queue.value = progress.buildQueue(toValue(source), now(), newLimit)
    flipped.value = false
    reviewedCount.value = 0
    gradeCounts.value = { again: 0, hard: 0, good: 0, easy: 0 }
    status.value = queue.value.length ? 'reviewing' : 'empty'
  }

  function reveal() {
    if (status.value === 'reviewing') flipped.value = true
  }

  function grade(g: Grade) {
    const card = current.value
    if (status.value !== 'reviewing' || !card || !flipped.value) return

    progress.reviewCard(card.id, g, now())
    gradeCounts.value[g]++
    reviewedCount.value++

    queue.value.shift()
    // «Не пам’ятаю» — картка повернеться в кінці цієї ж сесії
    if (g === 'again') queue.value.push(card)

    flipped.value = false
    if (queue.value.length === 0) status.value = 'finished'
  }

  start()

  return {
    status,
    current,
    remaining,
    flipped,
    previews,
    reviewedCount,
    gradeCounts,
    start,
    reveal,
    grade,
  }
}
