import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, press } from './helpers'
import { useSetsStore } from '@/stores/sets'

describe('режим «Картки»', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  function createSet() {
    return useSetsStore().createSet({
      title: 'Числа',
      description: '',
      cards: [
        { term: 'one', definition: 'один' },
        { term: 'two', definition: 'два' },
      ],
    })
  }

  it('показує першу картку і лічильник', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/flashcards`)
    expect(wrapper.text()).toContain('one')
    expect(wrapper.text()).toContain('1 / 2')
  })

  it('клавіатура: стрілка вправо — наступна, пробіл — перевернути', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/flashcards`)

    await press('ArrowRight')
    expect(wrapper.text()).toContain('2 / 2')
    expect(wrapper.text()).toContain('two')

    await press(' ')
    expect(wrapper.find('.rotate-y-180.transform-3d').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ви переглянули всі картки')
  })

  it('прибирає слухач клавіатури після виходу зі сторінки', async () => {
    const set = createSet()
    const { wrapper, router } = await mountAt(`/sets/${set.id}/flashcards`)
    await router.push('/')
    await flushPromises()
    // Якби слухач лишився, тут виникла б помилка або зміна стану — перевіряємо, що головна стоїть
    await press('ArrowRight')
    expect(wrapper.text()).toContain('Мої набори')
  })

  it('кнопка режиму на сторінці набору веде на картки', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    const link = wrapper.find(`a[href="/sets/${set.id}/flashcards"]`)
    expect(link.exists()).toBe(true)
  })
})
