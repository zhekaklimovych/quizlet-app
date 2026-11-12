/**
 * Версійоване сховище в localStorage.
 *
 * Дані зберігаються в «конверті»: { "version": 2, "data": ... }.
 * Коли формат даних змінюється, ми збільшуємо версію й додаємо міграцію —
 * функцію, що перетворює дані старої версії на нову. Так дані користувачів,
 * збережені старою версією застосунку, не губляться після оновлення.
 *
 *   v1 (без конверта) ──migrations[1]──> v2 ──migrations[2]──> v3 …
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

interface VersionedStorageOptions<T> {
  key: string
  /** Поточна версія формату */
  version: number
  /** migrations[n] перетворює дані версії n на версію n + 1 */
  migrations?: Record<number, (data: unknown) => unknown>
  /** Перевірка форми даних після міграцій (type guard) */
  validate: (data: unknown) => data is T
}

export function createVersionedStorage<T>(options: VersionedStorageOptions<T>) {
  const { key, version: currentVersion, migrations = {}, validate } = options

  /** Читає й мігрує дані. null — даних немає або їх неможливо прочитати. */
  function load(): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      const parsed: unknown = JSON.parse(raw)

      // Дані без конверта — найстаріший формат, версія 1
      let version = 1
      let data: unknown = parsed
      if (isRecord(parsed) && typeof parsed.version === 'number' && 'data' in parsed) {
        version = parsed.version
        data = parsed.data
      }

      // Дані з НОВІШОЇ версії застосунку (наприклад, після відкату) — не чіпаємо
      if (version > currentVersion) return null

      while (version < currentVersion) {
        const migrate = migrations[version]
        if (!migrate) return null
        data = migrate(data)
        version++
      }

      return validate(data) ? data : null
    } catch {
      return null
    }
  }

  function save(data: T) {
    try {
      localStorage.setItem(key, JSON.stringify({ version: currentVersion, data }))
    } catch {
      // переповнене сховище або приватний режим — працюємо без збереження
    }
  }

  return { load, save }
}
