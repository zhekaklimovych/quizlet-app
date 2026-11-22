import { getCurrentScope, onScopeDispose, ref } from 'vue'
import { detectLang } from '@/utils/language'

/**
 * Озвучування тексту через Web Speech API (вбудований синтезатор браузера).
 * Працює офлайн, без ключів і серверів. Якість і набір голосів залежать від ОС та браузера.
 */
export function useSpeech() {
  // Не всі браузери (і не тестове середовище jsdom) підтримують API — перевіряємо
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const speaking = ref(false)

  function speak(text: string, lang = detectLang(text)) {
    if (!isSupported || !text.trim()) return
    // Якщо щось уже читається — зупиняємо, інакше фрази стануть у чергу
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9 // трохи повільніше за звичайне — зручніше для навчання

    // Шукаємо голос для потрібної мови (якщо немає — браузер обере сам за lang)
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
    if (voice) utterance.voice = voice

    utterance.onstart = () => (speaking.value = true)
    utterance.onend = () => (speaking.value = false)
    utterance.onerror = () => (speaking.value = false)

    window.speechSynthesis.speak(utterance)
  }

  function stop() {
    if (isSupported) window.speechSynthesis.cancel()
    speaking.value = false
  }

  // Пішли зі сторінки — замовкаємо
  if (getCurrentScope()) onScopeDispose(stop)

  return { isSupported, speaking, speak, stop }
}
