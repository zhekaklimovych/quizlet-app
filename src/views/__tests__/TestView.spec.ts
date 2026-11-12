import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { mountAt } from '@/__tests__/helpers'
import { useSetsStore } from '@/stores/sets'

const dictionary: Record<string, string> = {
  cat: 'кіт',
  dog: 'пес',
  bird: 'птах',
  fish: 'риба',
}

function createSet() {
  return useSetsStore().createSet({
    title: 'Тварини',
    description: '',
    cards: Object.entries(dictionary).map(([term, definition]) => ({ term, definition })),
  })
}

const button = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('button').find((b) => b.text() === text)!

/** Відповідає правильно на кожне питання, читаючи його з екрана */
async function answerAll(wrapper: VueWrapper) {
  for (const card of wrapper.findAll('[data-testid="test-question"]')) {
    const term = card.find('p').text()
    const expected = dictionary[term]!
    const input = card.find('input[type="text"]')
    if (input.exists()) {
      await input.setValue(expected)
      continue
    }
    const options = card.findAll('[data-testid="test-option"]')
    if (options.length) {
      await options.find((o) => o.text() === expected)!.trigger('click')
      continue
    }
    // Правда / неправда: порівнюємо показане визначення з правильним
    const shown = card.findAll('p')[1]!.text().replace('=', '').trim()
    const label = shown === expected ? 'Правда' : 'Неправда'
    await card
      .findAll('button')
      .find((b) => b.text() === label)!
      .trigger('click')
  }
  await flushPromises()
}

describe('режим «Тест»', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    setActivePinia(createPinia())
  })
  afterEach(() => vi.restoreAllMocks())

  it('налаштування → тест → 100%', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/test`)

    expect(wrapper.text()).toContain('Кількість питань')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="test-question"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('Відповідей: 0 з 4')

    await answerAll(wrapper)
    expect(wrapper.text()).toContain('Відповідей: 4 з 4')

    await button(wrapper, 'Перевірити').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="score"]').text()).toBe('100%')
    expect(wrapper.text()).toContain('Правильно 4 з 4')
  })

  it('перевірка з пропущеними питаннями просить підтвердження', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/test`)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    await button(wrapper, 'Перевірити').trigger('click')
    expect(confirmSpy).toHaveBeenCalledOnce()
    expect(wrapper.find('[data-testid="score"]').exists()).toBe(false) // скасовано

    confirmSpy.mockReturnValue(true)
    await button(wrapper, 'Перевірити').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="score"]').text()).toBe('0%')
    expect(wrapper.text()).toContain('Правильна відповідь')
  })

  it('без обраних типів кнопка «Створити тест» неактивна', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/test`)
    for (const checkbox of wrapper.findAll('input[type="checkbox"]')) await checkbox.setValue(false)
    expect(wrapper.text()).toContain('Оберіть хоча б один тип питань')
    expect(button(wrapper, 'Створити тест').attributes('disabled')).toBeDefined()
  })

  it('кнопка на сторінці набору веде в режим', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    expect(wrapper.find(`a[href="/sets/${set.id}/test"]`).exists()).toBe(true)
  })
})
