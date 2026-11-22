import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, press } from './helpers'
import { useSetsStore } from '@/stores/sets'
import { useProgressStore } from '@/stores/progress'

function createSet() {
  return useSetsStore().createSet({
    title: 'Тварини',
    description: '',
    cards: [
      { term: 'cat', definition: 'кіт' },
      { term: 'dog', definition: 'пес' },
    ],
  })
}

describe('режим «Повторення»', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('клавіатура: Пробіл — показати, 3 — «Добре»; кінець сесії', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}/review`)
    expect(wrapper.text()).toContain('Залишилось: 2')

    for (let i = 0; i < 2; i++) {
      await press(' ')
      expect(wrapper.text()).toContain('Наскільки легко ви згадали?')
      await press('3')
    }

    expect(wrapper.text()).toContain('Сесію завершено!')
    expect(wrapper.text()).toContain('Наступне повторення: завтра')
    expect(useProgressStore().summarize(set.cards).scheduled).toBe(2)
  })

  it('сторінка набору: панель повторення і посилання', async () => {
    const set = createSet()
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    const panel = wrapper.find('[data-testid="review-panel"]')
    expect(panel.text()).toContain('0 до повторення')
    expect(panel.text()).toContain('2 нових')
    expect(panel.find(`a[href="/sets/${set.id}/review"]`).text()).toContain('Повторювати (2)')
  })

  it('статистика відповідей видна біля терміна', async () => {
    const set = createSet()
    const progress = useProgressStore()
    progress.recordAnswer(set.cards[0]!.id, true)
    progress.recordAnswer(set.cards[0]!.id, false)
    const { wrapper } = await mountAt(`/sets/${set.id}`)
    await flushPromises()
    const stats = wrapper.findAll('[data-testid="card-stats"]')
    expect(stats).toHaveLength(1)
    expect(stats[0]!.text()).toContain('✓ 1')
    expect(stats[0]!.text()).toContain('✗ 1')
  })
})
