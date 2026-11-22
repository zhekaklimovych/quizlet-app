import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useSpeech } from '@/composables/useSpeech'
import { detectLang } from '@/utils/language'
import FlipCard from '@/components/FlipCard.vue'

/**
 * У jsdom немає Web Speech API — підставляємо «фейкові» глобальні об'єкти.
 * vi.stubGlobal додає/підміняє глобальну змінну, vi.unstubAllGlobals повертає як було.
 */
function stubSpeech() {
  class FakeUtterance {
    lang = ''
    rate = 1
    voice: unknown = null
    constructor(public text: string) {}
  }
  // Типи в vi.fn<...>() — щоб у тесті mock.calls мали правильний тип, а не any
  const synth = {
    speak: vi.fn<(utterance: FakeUtterance) => void>(),
    cancel: vi.fn<() => void>(),
    getVoices: vi.fn<() => { lang: string; name: string }[]>(() => [
      { lang: 'uk-UA', name: 'Ukrainian' },
    ]),
  }
  vi.stubGlobal('speechSynthesis', synth)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  return synth
}

afterEach(() => vi.unstubAllGlobals())

describe('detectLang', () => {
  it.each([
    ['кіт', 'uk-UA'],
    ['cat', 'en-US'],
    ['ref()', 'en-US'],
    ['Vue — фреймворк', 'uk-UA'],
    ['123', 'en-US'],
  ])('%s → %s', (text, lang) => {
    expect(detectLang(text)).toBe(lang)
  })
})

describe('useSpeech', () => {
  it('без підтримки API — нічого не робить і не падає', () => {
    const speech = useSpeech()
    expect(speech.isSupported).toBe(false)
    expect(() => speech.speak('hello')).not.toThrow()
  })

  it('озвучує текст з визначеною мовою і зупиняє попередню фразу', () => {
    const synth = stubSpeech()
    const speech = useSpeech()
    expect(speech.isSupported).toBe(true)

    speech.speak('пам’ять')
    expect(synth.cancel).toHaveBeenCalled()
    const utterance = synth.speak.mock.calls[0]![0]
    expect(utterance.text).toBe('пам’ять')
    expect(utterance.lang).toBe('uk-UA')
    expect(utterance.voice).toMatchObject({ lang: 'uk-UA' })
  })

  it('порожній текст не озвучується', () => {
    const synth = stubSpeech()
    useSpeech().speak('   ')
    expect(synth.speak).not.toHaveBeenCalled()
  })
})

describe('FlipCard + озвучування', () => {
  it('клік по динаміку озвучує, але НЕ перевертає картку (@click.stop)', async () => {
    const synth = stubSpeech()
    const wrapper = mount(FlipCard, { props: { front: 'cat', back: 'кіт', flipped: false } })

    await wrapper.find('button[aria-label="Озвучити: cat"]').trigger('click')
    expect(synth.speak).toHaveBeenCalledOnce()
    expect(wrapper.emitted('flip')).toBeUndefined()

    await wrapper.find('[data-testid="flip-card"]').trigger('click')
    expect(wrapper.emitted('flip')).toHaveLength(1)
  })

  it('Enter на сфокусованій картці перевертає її', async () => {
    const wrapper = mount(FlipCard, { props: { front: 'cat', back: 'кіт', flipped: false } })
    await wrapper.find('[data-testid="flip-card"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('flip')).toHaveLength(1)
  })
})
