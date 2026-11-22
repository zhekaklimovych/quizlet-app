import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountAt, press } from './helpers'
import { useSetsStore } from '@/stores/sets'

const dictionary: Record<string, string> = { one: 'один', two: 'два', three: 'три' }

function createSet() {
  return useSetsStore().createSet({
    title: 'Числа',
    description: '',
    cards: Object.entries(dictionary).map(([term, definition]) => ({ term, definition })),
  })
}

/** Читає термін на екрані й відповідає правильно — кліком по варіанту або вводом тексту */
async function answerCorrectly(wrapper: VueWrapper) {
  const prompt = wrapper.find('[data-testid="prompt"]').text()
  const answer = dictionary[prompt]!
  const options = wrapper.findAll('[data-testid="option"]')
  if (options.length) {
    await options.find((o) => o.text().includes(answer))!.trigger('click')
  } else {
    await wrapper.find('#written-answer').setValue(answer)
    await wrapper.find('form').trigger('submit')
  }
  await flushPromises()
}

const clickButton = async (wrapper: VueWrapper, text: string) => {
  await wrapper
    .findAll('button')
    .find((b) => b.text().includes(text))!
    .trigger('click')
  await flushPromises()
}

describe('режим «Заучування»', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('показує питання з варіантами і зворотний зв’язок', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/learn`)

    expect(wrapper.text()).toContain('Заучування')
    expect(wrapper.findAll('[data-testid="option"]')).toHaveLength(3)

    await answerCorrectly(wrapper)
    expect(wrapper.text()).toContain('Правильно!')
    expect(wrapper.text()).toContain('Вивчаю: 1')
    // Після відповіді фокус на кнопці «Продовжити» — Enter працює одразу
    expect(document.activeElement?.textContent).toContain('Продовжити')
  })

  it('неправильна відповідь показує правильну', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/learn`)
    await clickButton(wrapper, 'Не знаю')
    expect(wrapper.text()).toContain('Ви пропустили це питання')
    expect(wrapper.text()).toContain('Правильна відповідь')
  })

  it('клавіші 1–3 обирають варіант', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/learn`)
    await press('1')
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('повний прохід: вибір → підсумок раунду → письмові відповіді → фінал', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/learn`)

    // Раунд 1: три питання з вибором
    for (let i = 0; i < 3; i++) {
      await answerCorrectly(wrapper)
      await clickButton(wrapper, 'Продовжити')
    }
    expect(wrapper.text()).toContain('Раунд 1 завершено')
    expect(wrapper.text()).toContain('Правильних відповідей: 3 з 3')

    // Раунд 2: три письмові питання
    await clickButton(wrapper, 'Наступний раунд')
    expect(wrapper.find('#written-answer').exists()).toBe(true)
    for (let i = 0; i < 3; i++) {
      await answerCorrectly(wrapper)
      await clickButton(wrapper, 'Продовжити')
    }

    expect(wrapper.text()).toContain('Усі терміни вивчено!')
    expect(wrapper.text()).toContain('3 терміни за 2 раунди')
  })

  it('кнопка на сторінці набору веде в режим', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    expect(wrapper.find(`a[href="/sets/${set.id}/learn"]`).exists()).toBe(true)
  })
})
