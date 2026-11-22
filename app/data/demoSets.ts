import type { StudySetDraft } from '@/types'

/** Демо-набори, які з'являються при першому запуску, щоб було з чим працювати. */
export const demoSets: StudySetDraft[] = [
  {
    title: 'Англійська: базові дієслова',
    description: 'Найуживаніші англійські дієслова з перекладом',
    cards: [
      { term: 'to be', definition: 'бути' },
      { term: 'to have', definition: 'мати' },
      { term: 'to go', definition: 'йти, їхати' },
      { term: 'to make', definition: 'робити, створювати' },
      { term: 'to know', definition: 'знати' },
      { term: 'to take', definition: 'брати' },
      { term: 'to see', definition: 'бачити' },
      { term: 'to come', definition: 'приходити' },
    ],
  },
  {
    title: 'Vue 3: основні поняття',
    description: 'Терміни Composition API',
    cards: [
      { term: 'ref()', definition: 'Реактивне посилання на значення; доступ через .value' },
      {
        term: 'computed()',
        definition: 'Обчислюване значення, що кешується й оновлюється від залежностей',
      },
      { term: 'watch()', definition: 'Виконує побічну дію при зміні реактивного джерела' },
      { term: 'defineProps()', definition: 'Оголошує вхідні параметри компонента' },
      {
        term: 'defineEmits()',
        definition: 'Оголошує події, які компонент може надсилати батькові',
      },
      {
        term: 'v-model',
        definition: 'Двостороннє зв’язування значення з полем вводу чи компонентом',
      },
    ],
  },
]
