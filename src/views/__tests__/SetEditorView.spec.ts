import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { mountAt } from '@/__tests__/helpers'
import { useSetsStore } from '@/stores/sets'

describe('редактор набору', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    setActivePinia(createPinia())
  })

  it('створює новий набір і переходить на його сторінку', async () => {
    const store = useSetsStore()
    const before = store.sets.length
    const { wrapper, router } = await mountAt('/sets/new')

    const inputs = wrapper.findAll('input')
    // [0] назва, далі пари термін/визначення
    await inputs[0]!.setValue('Кольори')
    await inputs[1]!.setValue('red')
    await inputs[2]!.setValue('червоний')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(store.sets.length).toBe(before + 1)
    const created = store.sets.find((s) => s.title === 'Кольори')!
    // Порожні рядки-заготовки відкинуто
    expect(created.cards).toHaveLength(1)
    // Сторінка набору завантажується ліниво (import()), тож чекаємо завершення переходу
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('set'))
    expect(router.currentRoute.value.params.id).toBe(created.id)
  })

  it('показує помилки валідації і не зберігає', async () => {
    const store = useSetsStore()
    const before = store.sets.length
    const { wrapper } = await mountAt('/sets/new')

    const inputs = wrapper.findAll('input')
    await inputs[1]!.setValue('лише термін') // картка заповнена наполовину
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Введіть назву набору')
    expect(wrapper.text()).toContain('заповнені лише наполовину')
    expect(store.sets.length).toBe(before)
  })

  it('редагує існуючий набір і зберігає id карток', async () => {
    const store = useSetsStore()
    const set = store.createSet({
      title: 'Старе',
      description: '',
      cards: [{ term: 'a', definition: 'b' }],
    })
    const cardId = set.cards[0]!.id
    const { wrapper } = await mountAt(`/sets/${set.id}/edit`)

    const inputs = wrapper.findAll('input')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('Старе')
    await inputs[0]!.setValue('Нове')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const updated = store.getSet(set.id)!
    expect(updated.title).toBe('Нове')
    expect(updated.cards[0]?.id).toBe(cardId)
  })

  it('не змінює стор, доки не натиснуто «Зберегти»', async () => {
    const store = useSetsStore()
    const set = store.createSet({
      title: 'Оригінал',
      description: '',
      cards: [{ term: 'a', definition: 'b' }],
    })
    const { wrapper } = await mountAt(`/sets/${set.id}/edit`)

    await wrapper.findAll('input')[0]!.setValue('Чернетка')
    expect(store.getSet(set.id)!.title).toBe('Оригінал')
  })
})
