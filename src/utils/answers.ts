/**
 * Перевірка письмових відповідей.
 * Чисті функції (без Vue, без стану) — найлегше тестувати й перевикористовувати.
 */

/** Приводить відповідь до «порівнюваного» вигляду: регістр, пробіли, розділові знаки, апострофи. */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFC') // однакове кодування літер з діакритикою (й, ї)
    .toLowerCase()
    .replace(/[’ʼ`‘]/g, "'") // різні варіанти апострофа → один
    .replace(/[.,!?;:"«»()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Відстань Левенштейна — мінімальна кількість вставок/видалень/замін символів,
 * щоб перетворити рядок a на b. «кіт» → «кот» = 1.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  // Зберігаємо лише попередній рядок таблиці динамічного програмування — O(min) пам'яті
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j]! + 1, // видалення
        curr[j - 1]! + 1, // вставка
        prev[j - 1]! + cost, // заміна
      )
    }
    prev = curr
  }
  return prev[b.length]!
}

/** Скільки описок допускаємо залежно від довжини слова */
function typoTolerance(length: number): number {
  if (length >= 10) return 2
  if (length >= 5) return 1
  return 0 // у коротких словах одна літера змінює зміст: cat ≠ cut
}

export type AnswerVerdict = 'correct' | 'typo' | 'wrong'

/**
 * Порівнює відповідь користувача з правильною.
 * Правильна відповідь може містити варіанти через кому, крапку з комою чи слеш:
 * «йти, їхати» → зараховуємо «йти», «їхати» або повну фразу.
 */
export function checkWrittenAnswer(given: string, expected: string): AnswerVerdict {
  const answer = normalizeAnswer(given)
  if (!answer) return 'wrong'

  const candidates = [expected, ...expected.split(/[,;/]/)]
    .map(normalizeAnswer)
    .filter((c) => c !== '')

  if (candidates.includes(answer)) return 'correct'
  if (candidates.some((c) => levenshtein(answer, c) <= typoTolerance(c.length))) return 'typo'
  return 'wrong'
}
