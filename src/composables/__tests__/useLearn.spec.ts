import { describe, it, expect } from 'vitest'
import { useLearn } from '../useLearn'
import type { Card } from '@/types'

const makeCards = (n: number): Card[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, term: `term${i}`, definition: `def${i}` }))

/** Відповідає правильно на поточне питання будь-якого типу */
function answerCorrectly(learn: ReturnType<typeof useLearn>) {
  const q = learn.question.value!
  if (q.type === 'choice') learn.answerChoice(q.answer)
  else learn.answerWritten(q.answer)
}

describe('useLearn', () => {
  it('нові картки питаються з вибором із 4 варіантів', () => {
    const learn = useLearn(makeCards(6))
    const q = learn.question.value!
    expect(learn.status.value).toBe('question')
    expect(q.type).toBe('choice')
    expect(q.options).toHaveLength(4)
    expect(q.options).toContain(q.answer)
    expect(new Set(q.options).size).toBe(4) // без дублікатів
  })

  it('правильний вибір → картка переходить у «вивчаю»', () => {
    const learn = useLearn(makeCards(3))
    answerCorrectly(learn)
    expect(learn.status.value).toBe('feedback')
    expect(learn.result.value?.correct).toBe(true)
    expect(learn.learningCount.value).toBe(1)
  })

  it('неправильна відповідь рахується як помилка', () => {
    const learn = useLearn(makeCards(3))
    learn.answerChoice('щось не те')
    expect(learn.result.value?.correct).toBe(false)
    expect(learn.newCount.value).toBe(3)
    expect(learn.hardest.value).toHaveLength(1)
  })

  it('повний цикл: раунди → підсумок → усе вивчено', () => {
    const learn = useLearn(makeCards(10), { roundSize: 7 })
    expect(learn.round.value).toHaveLength(7)

    let summaries = 0
    for (let guard = 0; guard < 100 && learn.status.value !== 'finished'; guard++) {
      if (learn.status.value === 'summary') {
        summaries++
        learn.startRound()
        continue
      }
      answerCorrectly(learn)
      learn.proceed()
    }

    expect(learn.status.value).toBe('finished')
    expect(learn.masteredCount.value).toBe(10)
    // Кожна картка потребує 2 правильні відповіді (вибір + письмово) → кілька раундів
    expect(summaries).toBeGreaterThan(0)
    expect(learn.roundNumber.value).toBeGreaterThan(2)
  })

  it('після вибору наступне питання по тій самій картці — письмове', () => {
    const learn = useLearn(makeCards(2), { roundSize: 2 })
    answerCorrectly(learn)
    learn.proceed()
    answerCorrectly(learn)
    learn.proceed()
    expect(learn.status.value).toBe('summary')
    learn.startRound()
    expect(learn.question.value?.type).toBe('written')
  })

  it('набір з однієї картки — одразу письмове питання', () => {
    const learn = useLearn(makeCards(1))
    expect(learn.question.value?.type).toBe('written')
  })

  it('«Зарахувати як правильну» виправляє результат', () => {
    const learn = useLearn(makeCards(1))
    learn.answerWritten('синонім')
    expect(learn.result.value?.correct).toBe(false)
    learn.overrideCorrect()
    expect(learn.result.value?.correct).toBe(true)
    expect(learn.learningCount.value).toBe(1)
    expect(learn.hardest.value).toHaveLength(0)
  })

  it('можна відповідати терміном', () => {
    const learn = useLearn(makeCards(3))
    learn.setAnswerWith('term')
    const q = learn.question.value!
    expect(q.prompt).toMatch(/^def/)
    expect(q.answer).toMatch(/^term/)
  })

  it('порожній набір → статус empty', () => {
    const learn = useLearn([])
    expect(learn.status.value).toBe('empty')
  })
})
