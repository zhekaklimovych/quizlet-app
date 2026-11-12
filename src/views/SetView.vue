<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useSetsStore } from '@/stores/sets'
import { pluralizeCards } from '@/utils/pluralize'
import ExportModal from '@/components/ExportModal.vue'
import SpeakButton from '@/components/SpeakButton.vue'
import ReviewPanel from '@/components/ReviewPanel.vue'
import { useProgressStore } from '@/stores/progress'

// id приходить з URL завдяки `props: true` у маршруті
const props = defineProps<{
  id: string
}>()

const store = useSetsStore()
const progress = useProgressStore()
const router = useRouter()

// computed: якщо id в URL зміниться (перехід між наборами) — set перерахується автоматично
const set = computed(() => store.getSet(props.id))

// Режими навчання: назва маршруту для кожного (кнопки неактивні, якщо в наборі немає карток)
const studyModes = [
  { key: 'flashcards', label: 'Картки', icon: '🃏', route: 'study-flashcards' },
  { key: 'learn', label: 'Заучування', icon: '🎯', route: 'study-learn' },
  { key: 'match', label: 'Підбір пар', icon: '🧩', route: 'study-match' },
  { key: 'test', label: 'Тест', icon: '📝', route: 'study-test' },
] as const

const exportOpen = ref(false)

const modeClass =
  'flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-4 font-semibold shadow-sm transition'

function onDelete() {
  if (!set.value) return
  if (!confirm(`Видалити набір «${set.value.title}»?`)) return
  store.deleteSet(set.value.id)
  // router.push — програмна навігація (як клік по RouterLink, але з коду)
  router.push({ name: 'home' })
}
</script>

<template>
  <section v-if="set">
    <RouterLink to="/" class="text-sm text-slate-500 hover:text-brand-600">← Усі набори</RouterLink>

    <div class="mt-2 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ set.title }}</h1>
        <p v-if="set.description" class="mt-1 text-slate-500">{{ set.description }}</p>
        <p class="mt-1 text-sm text-slate-400">{{ pluralizeCards(set.cards.length) }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <RouterLink :to="{ name: 'set-edit', params: { id: set.id } }" class="btn btn-secondary">
          Редагувати
        </RouterLink>
        <button type="button" class="btn btn-secondary" @click="exportOpen = true">
          ⇩ Експорт
        </button>
        <button type="button" class="btn btn-danger" @click="onDelete">Видалити</button>
      </div>
    </div>

    <ReviewPanel v-if="set.cards.length" :set="set" class="mt-6" />

    <!-- Режими навчання. <template v-for> — цикл без зайвого обгорткового елемента -->
    <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <template v-for="mode in studyModes" :key="mode.key">
        <RouterLink
          v-if="set.cards.length"
          :to="{ name: mode.route, params: { id: set.id } }"
          :class="[modeClass, 'hover:border-brand-200 hover:text-brand-600']"
        >
          <span class="text-2xl">{{ mode.icon }}</span>
          {{ mode.label }}
        </RouterLink>
        <button
          v-else
          type="button"
          disabled
          :class="[modeClass, 'cursor-not-allowed opacity-50']"
          title="Спершу додайте картки"
        >
          <span class="text-2xl">{{ mode.icon }}</span>
          {{ mode.label }}
        </button>
      </template>
    </div>

    <h2 class="mt-10 text-xl font-semibold">Терміни в наборі</h2>
    <ul v-if="set.cards.length" class="mt-4 space-y-2">
      <li
        v-for="card in set.cards"
        :key="card.id"
        class="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_2fr] sm:gap-6"
      >
        <div>
          <span class="flex items-start justify-between gap-2 font-medium">
            {{ card.term }}
            <SpeakButton :text="card.term" class="-mt-1" />
          </span>
          <!-- Статистика відповідей з усіх режимів (з progress-стору) -->
          <span
            v-if="progress.stats[card.id]?.correct || progress.stats[card.id]?.wrong"
            class="text-xs text-slate-400"
            data-testid="card-stats"
          >
            <span class="text-emerald-600">✓ {{ progress.stats[card.id]?.correct }}</span>
            ·
            <span class="text-red-600">✗ {{ progress.stats[card.id]?.wrong }}</span>
          </span>
        </div>
        <span
          class="flex items-start justify-between gap-2 text-slate-600 sm:border-l sm:border-slate-200 sm:pl-6"
        >
          {{ card.definition }}
          <SpeakButton :text="card.definition" class="-mt-1" />
        </span>
      </li>
    </ul>
    <p v-else class="mt-4 text-slate-500">У наборі ще немає карток.</p>

    <ExportModal v-model:open="exportOpen" :set="set" />
  </section>

  <!-- Набору з таким id немає (видалений або неправильний URL) -->
  <section v-else class="py-16 text-center">
    <h1 class="text-2xl font-bold">Набір не знайдено</h1>
    <RouterLink to="/" class="btn btn-primary mt-6">На головну</RouterLink>
  </section>
</template>
