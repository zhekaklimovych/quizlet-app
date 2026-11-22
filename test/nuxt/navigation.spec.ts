import { describe, it, expect, beforeEach } from 'vitest'
import { mountAt } from './helpers'
import { useSetsStore } from '@/stores/sets'

describe('навігація', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('головна показує список наборів', async () => {
    const { wrapper } = await mountAt('/')
    expect(wrapper.text()).toContain('Мої набори')
    expect(wrapper.text()).toContain('Англійська: базові дієслова')
  })

  it('сторінка набору показує терміни', async () => {
    const store = useSetsStore()
    const set = store.createSet({
      title: 'Тварини',
      description: '',
      cards: [{ term: 'cat', definition: 'кіт' }],
    })
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    expect(wrapper.text()).toContain('Тварини')
    expect(wrapper.text()).toContain('cat')
    expect(wrapper.text()).toContain('1 картка')
  })

  it('невідомий id набору → «Набір не знайдено»', async () => {
    const { wrapper } = await mountAt('/sets/missing')
    expect(wrapper.text()).toContain('Набір не знайдено')
  })

  it('невідомий URL → 404', async () => {
    const { wrapper } = await mountAt('/some/random/page')
    expect(wrapper.text()).toContain('404')
  })
})
