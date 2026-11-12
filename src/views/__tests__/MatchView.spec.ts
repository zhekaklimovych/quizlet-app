import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { mountAt } from '@/__tests__/helpers'
import { useSetsStore } from '@/stores/sets'

const pairs: Record<string, string> = { red: 'червоний', green: 'зелений', blue: 'синій' }

function createSet() {
  return useSetsStore().createSet({
    title: 'Кольори',
    description: '',
    cards: Object.entries(pairs).map(([term, definition]) => ({ term, definition })),
  })
}

async function clickTile(wrapper: VueWrapper, text: string) {
  const tile = wrapper.findAll('[data-testid="tile"]').find((t) => t.text() === text)!
  await tile.trigger('click')
  await flushPromises()
}

describe('режим «Підбір пар»', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    setActivePinia(createPinia())
  })

  it('стартовий екран → гра → фініш з рекордом', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/match`)

    expect(wrapper.text()).toContain('Готові?')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Почати гру')!
      .trigger('click')
    expect(wrapper.findAll('[data-testid="tile"]')).toHaveLength(6)

    // Одна помилка, потім усі правильні пари
    await clickTile(wrapper, 'red')
    await clickTile(wrapper, 'зелений')
    expect(wrapper.text()).toContain('Помилки: 1')

    for (const [term, definition] of Object.entries(pairs)) {
      await clickTile(wrapper, term)
      await clickTile(wrapper, definition)
    }

    expect(wrapper.text()).toContain('Новий рекорд!')
    expect(wrapper.text()).toContain('Помилок: 1 (+1 с)')
    expect(localStorage.getItem(`quizlet-app:match-best:${set.id}`)).not.toBeNull()
  })

  it('показує збережений рекорд на старті', async () => {
    const set = createSet()
    localStorage.setItem(`quizlet-app:match-best:${set.id}`, '12345')
    const { wrapper } = await mountAt(`/sets/${set.id}/match`)
    expect(wrapper.text()).toContain('Рекорд: 12,3 с')
  })

  it('кнопка на сторінці набору веде в режим', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    expect(wrapper.find(`a[href="/sets/${set.id}/match"]`).exists()).toBe(true)
  })
})
