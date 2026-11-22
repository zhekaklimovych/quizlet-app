<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useSetsStore } from '@/stores/sets'
import { useFlashcards } from '@/composables/useFlashcards'
import FlipCard from '@/components/FlipCard.vue'
import StudyLayout from '@/components/StudyLayout.vue'

// Назва маршруту (для посилань { name: ... }); props: true — параметри URL приходять як props
definePageMeta({ name: 'study-flashcards', props: true })

const props = defineProps<{
  id: string
}>()

const store = useSetsStore()
const set = computed(() => store.getSet(props.id))

// Передаємо getter-функцію: composable сам «розгорне» її через toValue().
// Деструктуризація: кожна змінна — ref верхнього рівня, тож у шаблоні .value не потрібне.
const {
  index,
  flipped,
  isShuffled,
  total,
  current,
  isFirst,
  isLast,
  progress,
  flip,
  next,
  prev,
  toggleShuffle,
  restart,
} = useFlashcards(() => set.value?.cards ?? [])

// ---------- клавіатура ----------
function onKeydown(e: KeyboardEvent) {
  const target = e.target
  // Не перехоплюємо клавіші, якщо користувач друкує в полі вводу
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
  // Пробіл/Enter на сфокусованій кнопці браузер сам перетворить на click — не дублюємо
  if (target instanceof HTMLButtonElement && (e.key === ' ' || e.key === 'Enter')) return

  switch (e.key) {
    case ' ':
    case 'ArrowUp':
    case 'ArrowDown':
      e.preventDefault() // пробіл і стрілки інакше прокрутили б сторінку
      flip()
      break
    case 'ArrowRight':
      next()
      break
    case 'ArrowLeft':
      prev()
      break
  }
}

// Глобальний слухач додаємо при появі сторінки і ОБОВ'ЯЗКОВО прибираємо при виході,
// інакше він продовжить працювати на інших сторінках (витік пам'яті)
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <StudyLayout :set="set" title="Картки">
    <template v-if="current">
      <!-- Прогрес -->
      <div class="mt-6 flex items-center gap-4 text-sm text-slate-500">
        <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-brand-500 transition-all"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <span class="tabular-nums">{{ index + 1 }} / {{ total }}</span>
      </div>

      <!--
        :key — коли змінюється картка, FlipCard створюється заново.
        Інакше при переході «вперед» з перевернутої картки було б видно,
        як наступна картка обертається назад і на мить показує свою відповідь.
      -->
      <div class="mt-4">
        <FlipCard
          :key="current.id"
          :front="current.term"
          :back="current.definition"
          :flipped="flipped"
          @flip="flip"
        />
      </div>

      <!-- Керування -->
      <div class="mt-6 flex items-center justify-between gap-2">
        <button
          type="button"
          class="btn btn-secondary"
          :class="{ 'border-brand-500 text-brand-600': isShuffled }"
          :aria-pressed="isShuffled"
          @click="toggleShuffle"
        >
          🔀 <span class="hidden sm:inline">Перемішати</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-secondary size-12 rounded-full p-0 text-lg"
            :disabled="isFirst"
            aria-label="Попередня"
            @click="prev"
          >
            ←
          </button>
          <button
            type="button"
            class="btn btn-secondary size-12 rounded-full p-0 text-lg"
            :disabled="isLast"
            aria-label="Наступна"
            @click="next"
          >
            →
          </button>
        </div>

        <button type="button" class="btn btn-secondary" @click="restart">
          ↺ <span class="hidden sm:inline">Спочатку</span>
        </button>
      </div>

      <!-- Фінальне повідомлення на останній картці -->
      <div
        v-if="isLast && flipped"
        class="mt-6 rounded-xl bg-brand-50 p-4 text-center text-brand-700"
      >
        🎉 Ви переглянули всі картки!
        <button type="button" class="ml-2 font-semibold underline" @click="restart">Ще раз</button>
      </div>

      <p class="mt-6 hidden text-center text-xs text-slate-400 sm:block">
        Клавіші: <kbd class="rounded border px-1">Пробіл</kbd> — перевернути ·
        <kbd class="rounded border px-1">←</kbd> <kbd class="rounded border px-1">→</kbd> —
        навігація
      </p>
    </template>
  </StudyLayout>
</template>
