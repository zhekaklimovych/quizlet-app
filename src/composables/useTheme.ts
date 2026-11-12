import { computed, getCurrentScope, onScopeDispose, ref, watchEffect } from 'vue'
import { useLocalStorage } from './useLocalStorage'

export type ThemeMode = 'light' | 'dark' | 'system'

/** Той самий ключ читає inline-скрипт в index.html (до завантаження Vue) */
export const THEME_STORAGE_KEY = 'quizlet-app:theme'

export const THEME_LABELS: Record<ThemeMode, { icon: string; label: string }> = {
  light: { icon: '☀️', label: 'Світла' },
  dark: { icon: '🌙', label: 'Темна' },
  system: { icon: '🖥️', label: 'Як у системі' },
}

/**
 * Тема оформлення: вибір користувача (збережений) + системне налаштування ОС.
 * Застосовується додаванням класу .dark до <html>.
 */
export function useTheme() {
  const mode = useLocalStorage<ThemeMode>(THEME_STORAGE_KEY, 'system')

  // matchMedia — «підписка» на медіазапит; у jsdom його немає, тому перевіряємо
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
  const systemDark = ref(media?.matches ?? false)

  // Користувач змінив тему в ОС, поки сторінка відкрита — реагуємо одразу
  const onSystemChange = (e: MediaQueryListEvent) => (systemDark.value = e.matches)
  media?.addEventListener('change', onSystemChange)
  if (getCurrentScope()) {
    onScopeDispose(() => media?.removeEventListener('change', onSystemChange))
  }

  const isDark = computed(
    () => mode.value === 'dark' || (mode.value === 'system' && systemDark.value),
  )

  // watchEffect — як watch, але сам визначає залежності (тут isDark) і запускається одразу
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
  })

  /** Світла → темна → системна → світла … */
  function cycle() {
    const order: ThemeMode[] = ['light', 'dark', 'system']
    mode.value = order[(order.indexOf(mode.value) + 1) % order.length]!
  }

  return { mode, isDark, cycle }
}
