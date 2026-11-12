import { ref, watch, type Ref } from 'vue'

/**
 * Реактивне значення, синхронізоване з localStorage.
 * Читаємо один раз при створенні, а далі кожна зміна автоматично записується.
 *
 *   const best = useLocalStorage<number | null>('my-key', null)
 *   best.value = 42   // → localStorage['my-key'] = '42'
 *
 * Generic <T> — тип значення задає той, хто викликає.
 */
export function useLocalStorage<T>(key: string, initial: T): Ref<T> {
  const data = ref(read()) as Ref<T>

  function read(): T {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  }

  watch(
    data,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // сховище недоступне — просто не зберігаємо
      }
    },
    { deep: true },
  )

  return data
}
