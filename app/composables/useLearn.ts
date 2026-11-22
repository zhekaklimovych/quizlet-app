import { computed, ref, watch, toValue, type MaybeRefOrGetter } from 'vue'
import type { Card } from '@/types'
import { shuffle } from '@/utils/shuffle'
import { checkWrittenAnswer } from '@/utils/answers'
import { pickDistractors } from '@/utils/distractors'

export type QuestionType = 'choice' | 'written'
/** Чим відповідає користувач: визначенням (бачить термін) чи терміном (бачить визначення) */
export type AnswerWith = 'definition' | 'term'
/**
 * Стан режиму — «скінченний автомат»: у кожен момент рівно один статус,
 * а переходи між ними відбуваються лише через функції нижче.
 *
 *   question ──answer*──> feedback ──proceed──> question (наступна картка раунду)
 *                                      ├──────> summary  (раунд закінчився) ──startRound──> question
 *                                      └──────> finished (усе вивчено)
 */
export type LearnStatus = 'empty' | 'question' | 'feedback' | 'summary' | 'finished'

export interface Question {
  /** Унікальний номер питання — використовується як :key, щоб компоненти питання створювались заново */
  id: number
  card: Card
  type: QuestionType
  prompt: string
  answer: string
  options: string[]
}

export interface AnswerResult {
  correct: boolean
  /** Зараховано, але з опискою */
  typo: boolean
  given: string
  expected: string
}

export interface RoundResult {
  card: Card
  correct: boolean
}

/** 0 — нова, 1 — вивчаю (правильно обрано варіант), 2 — вивчено (правильно написано) */
export const MASTERED_LEVEL = 2
const CHOICE_COUNT = 4

export interface UseLearnOptions {
  roundSize?: number
  /**
   * Колбек: викликається, коли відповідь остаточна (на «Продовжити»),
   * тобто вже з урахуванням «Зарахувати як правильну».
   * Composable не знає, куди йде результат — це вирішує той, хто його викликав.
   */
  onAnswered?: (card: Card, correct: boolean) => void
}

export function useLearn(
  source: MaybeRefOrGetter<Card[]>,
  { roundSize = 7, onAnswered }: UseLearnOptions = {},
) {
  const cards = computed(() => toValue(source))

  // ---------- стан ----------
  const answerWith = ref<AnswerWith>('definition')
  /** Рівень засвоєння кожної картки: { [cardId]: 0 | 1 | 2 } */
  const levels = ref<Record<string, number>>({})
  /** Кількість помилок по кожній картці — для списку «Варто повторити» */
  const misses = ref<Record<string, number>>({})
  const status = ref<LearnStatus>('empty')
  const round = ref<Card[]>([])
  const roundPos = ref(0)
  const roundNumber = ref(0)
  const roundResults = ref<RoundResult[]>([])
  const question = ref<Question | null>(null)
  const result = ref<AnswerResult | null>(null)
  let questionCounter = 0 // не реактивний: у шаблоні не показується

  // ---------- допоміжні ----------
  const levelOf = (card: Card) => levels.value[card.id] ?? 0
  const promptFor = (card: Card) =>
    answerWith.value === 'definition' ? card.term : card.definition
  const answerFor = (card: Card) =>
    answerWith.value === 'definition' ? card.definition : card.term

  // ---------- похідні значення ----------
  const total = computed(() => cards.value.length)
  const masteredCount = computed(
    () => cards.value.filter((c) => levelOf(c) >= MASTERED_LEVEL).length,
  )
  const learningCount = computed(() => cards.value.filter((c) => levelOf(c) === 1).length)
  const newCount = computed(() => total.value - masteredCount.value - learningCount.value)
  const correctInRound = computed(() => roundResults.value.filter((r) => r.correct).length)
  const hardest = computed(() =>
    cards.value
      .map((card) => ({ card, misses: misses.value[card.id] ?? 0 }))
      .filter((x) => x.misses > 0)
      .sort((a, b) => b.misses - a.misses)
      .slice(0, 5),
  )

  // ---------- побудова питань ----------
  /** Правильна відповідь + до 3 унікальних «відволікаючих» варіантів з інших карток */
  function buildOptions(card: Card): string[] {
    const correct = answerFor(card)
    const pool = cards.value.map(answerFor)
    return shuffle([correct, ...pickDistractors(correct, pool, CHOICE_COUNT - 1)])
  }

  function askCurrent() {
    const card = round.value[roundPos.value]
    if (!card) return
    // Вибір з варіантів лише для нових карток і лише якщо є хоча б 2 різні варіанти
    const options = levelOf(card) === 0 ? buildOptions(card) : []
    const type: QuestionType = options.length >= 2 ? 'choice' : 'written'
    question.value = {
      id: ++questionCounter,
      card,
      type,
      prompt: promptFor(card),
      answer: answerFor(card),
      options: type === 'choice' ? options : [],
    }
    result.value = null
    status.value = 'question'
  }

  // ---------- переходи стану ----------
  function startRound() {
    if (total.value === 0) {
      status.value = 'empty'
      question.value = null
      return
    }
    const remaining = cards.value.filter((c) => levelOf(c) < MASTERED_LEVEL)
    if (remaining.length === 0) {
      status.value = 'finished'
      question.value = null
      return
    }
    round.value = shuffle(remaining).slice(0, roundSize)
    roundPos.value = 0
    roundResults.value = []
    roundNumber.value++
    askCurrent()
  }

  function finishAnswer(correct: boolean, given: string, typo: boolean) {
    const q = question.value
    if (!q) return
    result.value = { correct, typo, given, expected: q.answer }
    if (correct) {
      levels.value[q.card.id] = Math.min(levelOf(q.card) + 1, MASTERED_LEVEL)
    } else {
      misses.value[q.card.id] = (misses.value[q.card.id] ?? 0) + 1
    }
    roundResults.value.push({ card: q.card, correct })
    status.value = 'feedback'
  }

  function answerChoice(option: string) {
    if (status.value !== 'question' || question.value?.type !== 'choice') return
    finishAnswer(option === question.value.answer, option, false)
  }

  function answerWritten(text: string) {
    if (status.value !== 'question' || question.value?.type !== 'written') return
    const verdict = checkWrittenAnswer(text, question.value.answer)
    finishAnswer(verdict !== 'wrong', text.trim(), verdict === 'typo')
  }

  /** «Зарахувати як правильну» — якщо перевірка була надто суворою (синонім тощо) */
  function overrideCorrect() {
    const q = question.value
    const r = result.value
    if (status.value !== 'feedback' || !q || !r || r.correct) return
    r.correct = true
    levels.value[q.card.id] = Math.min(levelOf(q.card) + 1, MASTERED_LEVEL)
    misses.value[q.card.id] = Math.max((misses.value[q.card.id] ?? 1) - 1, 0)
    const last = roundResults.value[roundResults.value.length - 1]
    if (last) last.correct = true
  }

  function proceed() {
    if (status.value !== 'feedback') return
    if (question.value && result.value) onAnswered?.(question.value.card, result.value.correct)
    roundPos.value++
    if (roundPos.value < round.value.length) {
      askCurrent()
    } else if (masteredCount.value === total.value) {
      status.value = 'finished'
      question.value = null
    } else {
      status.value = 'summary'
    }
  }

  function restart() {
    levels.value = {}
    misses.value = {}
    roundNumber.value = 0
    startRound()
  }

  function setAnswerWith(value: AnswerWith) {
    if (answerWith.value === value) return
    answerWith.value = value
    restart()
  }

  // Набір відредагували — починаємо заново
  watch(cards, restart)
  restart()

  return {
    // стан
    status,
    question,
    result,
    answerWith,
    round,
    roundPos,
    roundNumber,
    roundResults,
    // похідні
    total,
    masteredCount,
    learningCount,
    newCount,
    correctInRound,
    hardest,
    // дії
    answerChoice,
    answerWritten,
    overrideCorrect,
    proceed,
    startRound,
    restart,
    setAnswerWith,
  }
}
