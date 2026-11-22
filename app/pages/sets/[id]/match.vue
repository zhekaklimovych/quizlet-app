<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSetsStore } from '@/stores/sets'
import { useMatch, PENALTY_MS, type MatchTile } from '@/composables/useMatch'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { vFocus } from '@/directives/focus'
import { formatSeconds } from '@/utils/format'
import StudyLayout from '@/components/StudyLayout.vue'

// Назва маршруту (для посилань { name: ... }); props: true — параметри URL приходять як props
definePageMeta({ name: 'study-match', props: true })

const props = defineProps<{
  id: string
}>()

const store = useSetsStore()
const set = computed(() => store.getSet(props.id))

const {
  status,
  tiles,
  selectedId,
  wrongIds,
  mistakes,
  elapsed,
  canPlay,
  totalPairs,
  matchedPairs,
  start,
  select,
  reset,
} = useMatch(() => set.value?.cards ?? [])

// ---------- рекорд ----------
// Один composable використовує інший: рекорд живе в localStorage окремо для кожного набору
const bestTime = useLocalStorage<number | null>(`quizlet-app:match-best:${props.id}`, null)
const isNewRecord = ref(false)

// watch на статус: коли гра закінчилась — порівнюємо з рекордом
watch(status, (value) => {
  if (value !== 'finished') return
  isNewRecord.value = bestTime.value === null || elapsed.value < bestTime.value
  if (isNewRecord.value) bestTime.value = elapsed.value
})

/** Стиль плитки залежить від її стану. Порядок перевірок важливий: matched → wrong → selected */
function tileClass(tile: MatchTile) {
  if (tile.matched) return 'pointer-events-none scale-90 opacity-0'
  if (wrongIds.value.includes(tile.id)) return 'animate-shake border-red-400 bg-red-50 text-red-800'
  if (selectedId.value === tile.id)
    return 'border-brand-500 bg-brand-50 ring-2 ring-brand-200 text-brand-800'
  return 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
}
</script>

<template>
  <StudyLayout :set="set" title="Підбір пар">
    <template v-if="status === 'playing'" #actions>
      <button type="button" class="btn btn-secondary" @click="reset">Здатися</button>
    </template>

    <!-- ===== Старт ===== -->
    <div
      v-if="status === 'idle'"
      class="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <p class="text-5xl">🧩</p>
      <h2 class="mt-3 text-xl font-bold">Готові?</h2>
      <p class="mx-auto mt-2 max-w-md text-slate-500">
        Знайдіть пари «термін — визначення» якнайшвидше. Кожна помилка додає
        {{ PENALTY_MS / 1000 }} с.
      </p>
      <p v-if="bestTime !== null" class="mt-4 text-sm font-medium text-brand-700">
        🏆 Рекорд: {{ formatSeconds(bestTime) }}
      </p>
      <button
        v-if="canPlay"
        v-focus
        type="button"
        class="btn btn-primary mt-6 px-8 py-3 text-base"
        @click="start"
      >
        Почати гру
      </button>
      <p v-else class="mt-6 text-sm text-slate-500">Для гри потрібно щонайменше 2 картки.</p>
    </div>

    <!-- ===== Гра ===== -->
    <template v-else-if="status === 'playing'">
      <div class="mt-6 flex items-center justify-between text-sm text-slate-500">
        <span class="text-2xl font-bold text-slate-800 tabular-nums" data-testid="timer">
          {{ formatSeconds(elapsed) }}
        </span>
        <span>
          Пари: {{ matchedPairs }} / {{ totalPairs }}
          <span v-if="mistakes" class="ml-3 text-red-600">Помилки: {{ mistakes }}</span>
        </span>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        <button
          v-for="tile in tiles"
          :key="tile.id"
          type="button"
          data-testid="tile"
          class="flex min-h-24 items-center justify-center rounded-xl border-2 p-3 text-center text-sm font-medium break-words shadow-sm transition duration-200 sm:text-base"
          :class="tileClass(tile)"
          :disabled="tile.matched"
          :aria-pressed="selectedId === tile.id"
          @click="select(tile.id)"
        >
          {{ tile.text }}
        </button>
      </div>
    </template>

    <!-- ===== Фініш ===== -->
    <div v-else class="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p class="text-5xl">{{ isNewRecord ? '🏆' : '🎉' }}</p>
      <p class="mt-3 text-4xl font-bold tabular-nums">{{ formatSeconds(elapsed) }}</p>
      <p v-if="isNewRecord" class="mt-2 font-semibold text-brand-600">Новий рекорд!</p>
      <p v-else-if="bestTime !== null" class="mt-2 text-slate-500">
        Рекорд: {{ formatSeconds(bestTime) }}
      </p>
      <p class="mt-1 text-sm text-slate-500">
        {{
          mistakes ? `Помилок: ${mistakes} (+${(mistakes * PENALTY_MS) / 1000} с)` : 'Без помилок!'
        }}
      </p>
      <div class="mt-8 flex justify-center gap-3">
        <button v-focus type="button" class="btn btn-primary" @click="start">Грати ще раз</button>
        <NuxtLink :to="{ name: 'set', params: { id } }" class="btn btn-secondary">
          До набору
        </NuxtLink>
      </div>
    </div>
  </StudyLayout>
</template>
