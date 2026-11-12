import { shuffle } from './shuffle'
import { normalizeAnswer } from './answers'

/**
 * «Відволікаючі» варіанти для питань з вибором: до `count` випадкових НЕПРАВИЛЬНИХ відповідей.
 * Відкидає дублікати і варіанти, що збігаються з правильною (з точністю до регістру/пробілів) —
 * інакше «неправильний» варіант насправді був би правильним.
 */
export function pickDistractors(correct: string, pool: readonly string[], count: number): string[] {
  const seen = new Set([normalizeAnswer(correct)])
  const result: string[] = []
  for (const text of shuffle(pool)) {
    if (result.length === count) break
    const key = normalizeAnswer(text)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}
