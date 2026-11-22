/**
 * Проста евристика визначення мови для озвучування: рахуємо літери різних алфавітів.
 * Для точнішого результату в майбутньому мову можна буде задавати в налаштуваннях набору.
 */
export function detectLang(text: string): string {
  const cyrillic = text.match(/\p{Script=Cyrillic}/gu)?.length ?? 0
  const latin = text.match(/\p{Script=Latin}/gu)?.length ?? 0
  if (cyrillic === 0 && latin === 0) return 'en-US' // цифри, символи — нехай буде англійська
  return cyrillic >= latin ? 'uk-UA' : 'en-US'
}
