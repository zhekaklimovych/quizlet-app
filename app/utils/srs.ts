/**
 * Інтервальне повторення (spaced repetition) — спрощений алгоритм SM-2 (як в Anki).
 *
 * Ідея: забування йде за кривою — щойно вивчене забувається швидко, а кожне вдале
 * повторення «відсуває» наступне все далі: 1 день → 3 дні → 8 днів → 20 днів → …
 * Кожна картка має «легкість» (ease): легкі картки віддаляються швидше, важкі — повільніше.
 *
 * Тут лише чисті функції: стан картки + оцінка + поточний час → новий стан.
 */

/** Оцінка після показу відповіді */
export type Grade = 'again' | 'hard' | 'good' | 'easy'

export const GRADES: { grade: Grade; label: string; key: string }[] = [
  { grade: 'again', label: 'Не пам’ятаю', key: '1' },
  { grade: 'hard', label: 'Важко', key: '2' },
  { grade: 'good', label: 'Добре', key: '3' },
  { grade: 'easy', label: 'Легко', key: '4' },
]

export interface CardStats {
  // ---- інтервальне повторення ----
  /** Скільки разів поспіль картку згадано успішно */
  reps: number
  /** Поточний інтервал у днях */
  interval: number
  /** Коефіцієнт легкості (мінімум 1.3, старт 2.5) */
  ease: number
  /** Коли показати наступного разу (timestamp, мс) */
  due: number
  /** Скільки разів картку «забули» після вивчення */
  lapses: number
  /** Останнє повторення в режимі «Повторення»; 0 — картка ще нова */
  lastReviewedAt: number
  // ---- загальна статистика з усіх режимів ----
  correct: number
  wrong: number
}

export const MIN_EASE = 1.3
const START_EASE = 2.5
const MINUTE = 60_000
/** «Не пам’ятаю» — показати знову через 10 хвилин */
export const AGAIN_DELAY_MS = 10 * MINUTE

export function initialStats(): CardStats {
  return {
    reps: 0,
    interval: 0,
    ease: START_EASE,
    due: 0,
    lapses: 0,
    lastReviewedAt: 0,
    correct: 0,
    wrong: 0,
  }
}

/**
 * Початок дня через `days` днів від `now` (за місцевим часом).
 * Картки «дозрівають» опівночі — тож усе, що заплановано на сьогодні, доступне з ранку.
 * setDate враховує різну довжину місяців і перехід на літній час — на відміну від «+ days × 86 400 000».
 */
export function startOfDayPlus(now: number, days: number): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.getTime()
}

/** Застосовує оцінку до стану картки й повертає НОВИЙ стан (вихідний не змінюється) */
export function review(stats: CardStats, grade: Grade, now: number): CardStats {
  const next: CardStats = { ...stats, lastReviewedAt: now }

  if (grade === 'again') {
    next.reps = 0
    next.interval = 0
    next.ease = Math.max(MIN_EASE, stats.ease - 0.2)
    next.lapses = stats.reps > 0 ? stats.lapses + 1 : stats.lapses
    next.wrong = stats.wrong + 1
    next.due = now + AGAIN_DELAY_MS
    return next
  }

  let interval: number
  if (grade === 'hard') {
    interval = stats.reps === 0 ? 1 : Math.max(stats.interval + 1, Math.round(stats.interval * 1.2))
    next.ease = Math.max(MIN_EASE, stats.ease - 0.15)
  } else if (grade === 'good') {
    interval = stats.reps === 0 ? 1 : stats.reps === 1 ? 3 : Math.round(stats.interval * stats.ease)
  } else {
    interval =
      stats.reps === 0
        ? 3
        : Math.max(stats.interval + 1, Math.round(stats.interval * stats.ease * 1.3))
    next.ease = stats.ease + 0.15
  }

  next.reps = stats.reps + 1
  next.interval = interval
  next.correct = stats.correct + 1
  next.due = startOfDayPlus(now, interval)
  return next
}

/** Текст для кнопки оцінки: «10 хв», «3 д», «2 міс», «1 р» */
export function formatInterval(stats: CardStats): string {
  if (stats.interval === 0) return '10 хв'
  const days = stats.interval
  if (days < 30) return `${days} д`
  if (days < 365) return `${Math.round(days / 30)} міс`
  return `${Math.round((days / 365) * 10) / 10} р`
}

/** Картка ще жодного разу не повторювалась у режимі «Повторення» */
export const isNew = (stats: CardStats | undefined) => !stats || stats.lastReviewedAt === 0

/** Час повторювати */
export const isDue = (stats: CardStats | undefined, now: number) =>
  !isNew(stats) && stats!.due <= now
