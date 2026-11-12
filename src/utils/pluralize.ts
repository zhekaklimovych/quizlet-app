/**
 * Українські форми множини: 1 картка, 2 картки, 5 карток.
 * Intl.PluralRules — вбудований у браузер API, знає правила для кожної мови.
 */
const rules = new Intl.PluralRules('uk-UA')

/** Форми слова: one — 1, 21; few — 2–4, 22; many — 5–20, 0 */
export interface PluralForms {
  one: string
  few: string
  many: string
}

export function pluralize(count: number, forms: PluralForms): string {
  const rule = rules.select(count)
  // 'other' — дробові числа (1,5 картки) — використовує форму few
  const word =
    rule === 'one' ? forms.one : rule === 'many' || rule === 'zero' ? forms.many : forms.few
  return `${count} ${word}`
}

export const pluralizeCards = (count: number) =>
  pluralize(count, { one: 'картка', few: 'картки', many: 'карток' })

export const pluralizeTerms = (count: number) =>
  pluralize(count, { one: 'термін', few: 'терміни', many: 'термінів' })

export const pluralizeRounds = (count: number) =>
  pluralize(count, { one: 'раунд', few: 'раунди', many: 'раундів' })
