import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Card } from '@/types'
import type { AnswerWith } from '@/composables/useLearn'
import { shuffle } from '@/utils/shuffle'
import { checkWrittenAnswer, type AnswerVerdict } from '@/utils/answers'
import { pickDistractors } from '@/utils/distractors'

export type TestQuestionType = 'true-false' | 'choice' | 'written'

/** Порядок секцій у тесті та підписи типів */
export const TEST_QUESTION_TYPES: { type: TestQuestionType; label: string }[] = [
  { type: 'true-false', label: 'Правда / неправда' },
  { type: 'choice', label: 'Вибір відповіді' },
  { type: 'written', label: 'Письмова відповідь' },
]
const TYPE_ORDER = TEST_QUESTION_TYPES.map((t) => t.type)

interface QuestionBase {
  id: number
  card: Card
  prompt: string
  /** Правильна відповідь */
  answer: string
}

/**
 * Discriminated union («розмічене об'єднання»): поле `type` визначає, які ще поля є в об'єкті.
 * Після перевірки `if (q.type === 'choice')` TypeScript знає, що в q є `options`.
 */
export type TestQuestion =
  | (QuestionBase & {
      type: 'true-false'
      /** Показане визначення */ shown: string
      isTrue: boolean
    })
  | (QuestionBase & { type: 'choice'; options: string[] })
  | (QuestionBase & { type: 'written' })

/** Відповідь користувача: true/false для «правда/неправда», рядок для решти */
export type TestAnswer = string | boolean

export interface TestSettings {
  count: number
  types: TestQuestionType[]
  answerWith: AnswerWith
}

/** setup — налаштування, in-progress — проходження, graded — результати */
export type TestStatus = 'setup' | 'in-progress' | 'graded'

export function isAnswered(answer: TestAnswer | undefined): boolean {
  return typeof answer === 'boolean' || (typeof answer === 'string' && answer.trim() !== '')
}

export function gradeQuestion(q: TestQuestion, answer: TestAnswer | undefined): AnswerVerdict {
  switch (q.type) {
    case 'true-false':
      return answer === q.isTrue ? 'correct' : 'wrong'
    case 'choice':
      return answer === q.answer ? 'correct' : 'wrong'
    case 'written':
      return typeof answer === 'string' ? checkWrittenAnswer(answer, q.answer) : 'wrong'
  }
}

export function useTest(source: MaybeRefOrGetter<Card[]>, { defaultCount = 10 } = {}) {
  const cards = computed(() => toValue(source))

  const status = ref<TestStatus>('setup')
  const settings = ref<TestSettings>({
    count: Math.min(defaultCount, cards.value.length),
    types: [...TYPE_ORDER],
    answerWith: 'definition',
  })
  const questions = ref<TestQuestion[]>([])
  /** Відповіді користувача: { [questionId]: відповідь } */
  const answers = ref<Record<number, TestAnswer>>({})
  /** Оцінка кожного питання після перевірки */
  const verdicts = ref<Record<number, AnswerVerdict>>({})
  let questionCounter = 0

  const total = computed(() => cards.value.length)

  // ---------- налаштування ----------
  const settingsErrors = computed(() => {
    const errors: string[] = []
    const { count, types } = settings.value
    // v-model.number на порожньому полі дає '' — тому перевіряємо Number.isInteger
    if (!Number.isInteger(count) || count < 1 || count > total.value) {
      errors.push(`Кількість питань має бути від 1 до ${total.value}`)
    }
    if (types.length === 0) errors.push('Оберіть хоча б один тип питань')
    return errors
  })
  const canGenerate = computed(() => total.value > 0 && settingsErrors.value.length === 0)

  // ---------- проходження ----------
  const answeredCount = computed(
    () => questions.value.filter((q) => isAnswered(answers.value[q.id])).length,
  )

  // ---------- результат ----------
  const score = computed(() => {
    const n = questions.value.length
    const correct = questions.value.filter((q) => {
      const v = verdicts.value[q.id]
      return v === 'correct' || v === 'typo'
    }).length
    return { correct, total: n, percent: n ? Math.round((correct / n) * 100) : 0 }
  })

  // ---------- генерація ----------
  function buildQuestion(card: Card, type: TestQuestionType): TestQuestion {
    const byDefinition = settings.value.answerWith === 'definition'
    const answerFor = (c: Card) => (byDefinition ? c.definition : c.term)
    const base: QuestionBase = {
      id: ++questionCounter,
      card,
      prompt: byDefinition ? card.term : card.definition,
      answer: answerFor(card),
    }
    const pool = cards.value.filter((c) => c.id !== card.id).map(answerFor)

    if (type === 'true-false') {
      const [wrong] = pickDistractors(base.answer, pool, 1)
      // Якщо підставити нічого (усі відповіді однакові) — твердження завжди правдиве
      if (wrong === undefined || Math.random() < 0.5) {
        return { ...base, type, shown: base.answer, isTrue: true }
      }
      return { ...base, type, shown: wrong, isTrue: false }
    }

    if (type === 'choice') {
      const distractors = pickDistractors(base.answer, pool, 3)
      if (distractors.length > 0) {
        return { ...base, type, options: shuffle([base.answer, ...distractors]) }
      }
      // Немає з чого вибирати — перетворюємо на письмове питання
    }

    return { ...base, type: 'written' }
  }

  function generate() {
    if (!canGenerate.value) return
    const picked = shuffle(cards.value).slice(0, settings.value.count)
    // Розподіляємо типи по черзі; перемішуємо, щоб «зайві» питання діставались різним типам
    const types = shuffle(settings.value.types)
    questions.value = picked
      .map((card, i) => buildQuestion(card, types[i % types.length]!))
      // Групуємо за типом: спершу правда/неправда, потім вибір, потім письмові
      .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
    answers.value = {}
    verdicts.value = {}
    status.value = 'in-progress'
  }

  function submit() {
    if (status.value !== 'in-progress') return
    const result: Record<number, AnswerVerdict> = {}
    for (const q of questions.value) result[q.id] = gradeQuestion(q, answers.value[q.id])
    verdicts.value = result
    status.value = 'graded'
  }

  function backToSetup() {
    status.value = 'setup'
  }

  // Набір змінився — назад до налаштувань, кількість питань — у межах нового розміру
  watch(cards, (list) => {
    status.value = 'setup'
    questions.value = []
    settings.value.count = Math.min(defaultCount, list.length)
  })

  return {
    status,
    settings,
    settingsErrors,
    canGenerate,
    total,
    questions,
    answers,
    answeredCount,
    verdicts,
    score,
    generate,
    submit,
    backToSetup,
  }
}
