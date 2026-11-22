import { startOfDayPlus } from './srs'

const secondsFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 12345 мс → «12,3 с» (українська десяткова кома) */
export function formatSeconds(ms: number): string {
  return `${secondsFormat.format(ms / 1000)} с`
}

const timeFormat = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' })
const dateFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' })

/** Коли наступне повторення: «сьогодні о 14:30», «завтра», «15 листопада» */
export function formatDueDate(timestamp: number, now = Date.now()): string {
  if (timestamp < startOfDayPlus(now, 1)) return `сьогодні о ${timeFormat.format(timestamp)}`
  if (timestamp < startOfDayPlus(now, 2)) return 'завтра'
  return dateFormat.format(timestamp)
}
