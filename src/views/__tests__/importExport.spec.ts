import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { mountAt } from '@/__tests__/helpers'
import { useSetsStore } from '@/stores/sets'
import { exportAsJson } from '@/utils/importExport'

const clickButton = async (wrapper: VueWrapper, text: string) => {
  await wrapper
    .findAll('button')
    .find((b) => b.text().includes(text))!
    .trigger('click')
  await flushPromises()
}

/** Імітує вибір файлу в <input type="file"> */
async function selectFile(wrapper: VueWrapper, content: string) {
  const input = wrapper.find('[data-testid="file-input"]')
  const file = new File([content], 'set.json', { type: 'application/json' })
  // files — властивість лише для читання, тож підміняємо її через defineProperty
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

describe('імпорт / експорт в інтерфейсі', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    setActivePinia(createPinia())
  })

  it('редактор: імпорт тексту замінює порожні рядки картками', async () => {
    const { wrapper } = await mountAt('/sets/new')
    expect(wrapper.text()).toContain('Картки: 0')

    await clickButton(wrapper, 'Імпорт')
    const textarea = wrapper.find('textarea[aria-label="Текст для імпорту"]')
    await textarea.setValue('cat\tкіт\ndog\tпес')
    expect(wrapper.text()).toContain('Попередній перегляд: 2 картки')

    await clickButton(wrapper, 'Імпортувати (2)')
    expect(wrapper.text()).toContain('Картки: 2')
    // 3 порожні заготовки прибрано → лишилось рівно 2 рядки карток + поле назви
    expect(wrapper.findAll('input[type="text"]')).toHaveLength(1 + 2 * 2)
  })

  it('сторінка набору: вікно експорту показує текст', async () => {
    const set = useSetsStore().createSet({
      title: 'T',
      description: '',
      cards: [{ term: 'cat', definition: 'кіт' }],
    })
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    await clickButton(wrapper, 'Експорт')
    const textarea = wrapper.find('textarea[aria-label="Текст для експорту"]')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('cat\tкіт')
  })

  it('головна: імпорт JSON-файлу створює набір і відкриває його', async () => {
    const store = useSetsStore()
    const json = exportAsJson({
      id: 'x',
      title: 'З файлу',
      description: '',
      cards: [{ id: '1', term: 'a', definition: 'b' }],
      createdAt: 0,
      updatedAt: 0,
    })
    const { wrapper, router } = await mountAt('/')
    await selectFile(wrapper, json)

    const created = store.sets.find((s) => s.title === 'З файлу')
    expect(created).toBeDefined()
    await vi.waitFor(() => expect(router.currentRoute.value.params.id).toBe(created!.id))
  })

  it('головна: некоректний файл → повідомлення про помилку', async () => {
    const { wrapper } = await mountAt('/')
    await selectFile(wrapper, '{"oops": true}')
    expect(wrapper.find('[role="alert"]').text()).toContain('Це не файл набору карток')
  })
})
