<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSetsStore } from '@/stores/sets'
import { createId } from '@/utils/id'
import CardEditorRow from '@/components/CardEditorRow.vue'
import ImportTextModal from '@/components/ImportTextModal.vue'
import type { CardDraft } from '@/types'

// Якщо id є — редагуємо існуючий набір; якщо немає (/sets/new) — створюємо новий
const props = defineProps<{
  id?: string
}>()

const store = useSetsStore()
const router = useRouter()

/** Рядок редактора. key — стабільний ключ для v-for (у нових карток ще немає id). */
interface EditorCard {
  key: string
  id?: string
  term: string
  definition: string
}

function emptyCard(): EditorCard {
  return { key: createId(), term: '', definition: '' }
}

// ---------- початковий стан форми ----------
const existing = props.id ? store.getSet(props.id) : undefined
const isEdit = existing !== undefined

// Копіюємо дані, а НЕ посилаємося на об'єкти стору:
// інакше набір змінювався б у сторі ще до натискання «Зберегти»
const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const cards = ref<EditorCard[]>(
  existing
    ? existing.cards.map((c) => ({ key: c.id, id: c.id, term: c.term, definition: c.definition }))
    : [emptyCard(), emptyCard(), emptyCard()],
)

/** Знімок форми, щоб визначати незбережені зміни */
function snapshot() {
  return JSON.stringify({
    title: title.value,
    description: description.value,
    cards: cards.value.map(({ term, definition }) => ({ term, definition })),
  })
}
const initialSnapshot = snapshot()
const isDirty = computed(() => snapshot() !== initialSnapshot)

// ---------- дії з картками ----------
const autofocusKey = ref<string | null>(null)

function addCard() {
  const card = emptyCard()
  cards.value.push(card)
  autofocusKey.value = card.key
}

function removeCard(index: number) {
  cards.value.splice(index, 1)
}

// ---------- імпорт ----------
const importOpen = ref(false)

function importCards(imported: CardDraft[]) {
  // Порожні рядки-заготовки прибираємо, щоб імпортовані картки не стояли після них
  const nonEmpty = cards.value.filter((c) => c.term.trim() !== '' || c.definition.trim() !== '')
  const added = imported.map((c) => ({ key: createId(), term: c.term, definition: c.definition }))
  cards.value = [...nonEmpty, ...added]
}

function moveCard(index: number, direction: -1 | 1) {
  const target = index + direction
  const list = cards.value
  const a = list[index]
  const b = list[target]
  if (!a || !b) return
  // Міняємо місцями два елементи
  list[index] = b
  list[target] = a
}

// ---------- валідація ----------
const submitted = ref(false) // помилки показуємо лише після першої спроби зберегти

const isHalfFilled = (c: EditorCard) => (c.term.trim() === '') !== (c.definition.trim() === '')
const filledCards = computed(() =>
  cards.value.filter((c) => c.term.trim() !== '' && c.definition.trim() !== ''),
)

const errors = computed(() => {
  const list: string[] = []
  if (title.value.trim() === '') list.push('Введіть назву набору')
  if (filledCards.value.length === 0) list.push('Додайте хоча б одну заповнену картку')
  if (cards.value.some(isHalfFilled)) list.push('Деякі картки заповнені лише наполовину')
  return list
})

// ---------- збереження ----------
let saved = false

function save() {
  submitted.value = true
  if (errors.value.length) return

  const draft = {
    title: title.value,
    description: description.value,
    cards: cards.value.map(({ id, term, definition }) => ({ id, term, definition })),
  }

  const result = isEdit && props.id ? store.updateSet(props.id, draft) : store.createSet(draft)

  saved = true
  if (result) router.push({ name: 'set', params: { id: result.id } })
}

// ---------- захист від втрати змін ----------
// Навігаційний guard: спрацьовує перед тим, як router покине цю сторінку
onBeforeRouteLeave(() => {
  if (saved || !isDirty.value) return true
  return confirm('Є незбережені зміни. Вийти без збереження?')
})
</script>

<template>
  <section v-if="!props.id || isEdit">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-3xl font-bold">{{ isEdit ? 'Редагування набору' : 'Новий набір' }}</h1>
      <div class="flex gap-2">
        <NuxtLink
          :to="isEdit && props.id ? { name: 'set', params: { id: props.id } } : { name: 'home' }"
          class="btn btn-secondary"
        >
          Скасувати
        </NuxtLink>
        <button type="button" class="btn btn-primary" @click="save">
          {{ isEdit ? 'Зберегти' : 'Створити' }}
        </button>
      </div>
    </div>

    <!-- @submit.prevent — модифікатор: викликає event.preventDefault(), сторінка не перезавантажується -->
    <form class="mt-6 space-y-4" @submit.prevent="save">
      <div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label class="block">
          <span class="text-sm font-medium text-slate-600">Назва</span>
          <input
            v-model="title"
            type="text"
            placeholder="Наприклад: Англійська — тварини"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            :class="{ 'border-red-300': submitted && !title.trim() }"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-slate-600">Опис (необов'язково)</span>
          <textarea
            v-model="description"
            rows="2"
            class="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>

      <ul v-if="submitted && errors.length" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <li v-for="error in errors" :key="error">• {{ error }}</li>
      </ul>

      <div class="flex items-center justify-between pt-2">
        <h2 class="font-semibold">Картки: {{ filledCards.length }}</h2>
        <button type="button" class="btn btn-secondary" @click="importOpen = true">⇪ Імпорт</button>
      </div>

      <CardEditorRow
        v-for="(card, index) in cards"
        :key="card.key"
        v-model:term="card.term"
        v-model:definition="card.definition"
        :index="index"
        :total="cards.length"
        :autofocus="card.key === autofocusKey"
        :invalid="submitted && isHalfFilled(card)"
        @remove="removeCard(index)"
        @move="moveCard(index, $event)"
      />

      <button
        type="button"
        class="w-full rounded-xl border-2 border-dashed border-slate-300 py-6 font-semibold text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
        @click="addCard"
      >
        + Додати картку
      </button>

      <div class="flex justify-end">
        <button type="submit" class="btn btn-primary px-8 py-3 text-base">
          {{ isEdit ? 'Зберегти' : 'Створити' }}
        </button>
      </div>
    </form>

    <ImportTextModal v-model:open="importOpen" @import="importCards" />
  </section>

  <section v-else class="py-16 text-center">
    <h1 class="text-2xl font-bold">Набір не знайдено</h1>
    <NuxtLink to="/" class="btn btn-primary mt-6">На головну</NuxtLink>
  </section>
</template>
