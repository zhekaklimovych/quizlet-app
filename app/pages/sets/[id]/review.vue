<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useSetsStore } from '@/stores/sets'
import { useProgressStore } from '@/stores/progress'
import { useReview } from '@/composables/useReview'
import { vFocus } from '@/directives/focus'
import { formatDueDate } from '@/utils/format'
import { GRADES, type Grade } from '@/utils/srs'
import StudyLayout from '@/components/StudyLayout.vue'
import FlipCard from '@/components/FlipCard.vue'

// Назва маршруту (для посилань { name: ... }); props: true — параметри URL приходять як props
definePageMeta({ name: 'study-review', props: true })

const props = defineProps<{
  id: string
}>()

const store = useSetsStore()
const progress = useProgressStore()
const set = computed(() => store.getSet(props.id))
const cards = computed(() => set.value?.cards ?? [])

const {
  status,
  current,
  remaining,
  flipped,
  previews,
  reviewedCount,
  gradeCounts,
  start,
  reveal,
  grade,
} = useReview(cards)

const summary = computed(() => progress.summarize(cards.value))

/** Кольори кнопок оцінки — від «погано» до «відмінно» */
const gradeClass: Record<Grade, string> = {
  again: 'border-red-200 bg-red-50 text-red-700 hover:border-red-400',
  hard: 'border-amber-400/40 bg-white text-amber-700 hover:border-amber-400',
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
  easy: 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-500',
}

// ---------- клавіатура: Пробіл/Enter — показати, 1–4 — оцінка ----------
function onKeydown(e: KeyboardEvent) {
  if (status.value !== 'reviewing') return
  const target = e.target
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
  if (target instanceof HTMLButtonElement && (e.key === ' ' || e.key === 'Enter')) return

  if (!flipped.value && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault()
    reveal()
    return
  }
  const g = GRADES.find((x) => x.key === e.key)
  if (flipped.value && g) grade(g.grade)
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <StudyLayout :set="set" title="Повторення">
    <!-- ===== Сесія ===== -->
    <template v-if="status === 'reviewing' && current">
      <p class="mt-6 text-sm text-slate-500">
        Залишилось: <span class="font-semibold tabular-nums">{{ remaining }}</span> · Повторено:
        <span class="tabular-nums">{{ reviewedCount }}</span>
      </p>

      <!-- key з лічильником: та сама картка після «Не пам’ятаю» — новий екземпляр, без анімації назад -->
      <div class="mt-4">
        <FlipCard
          :key="`${current.id}-${reviewedCount}`"
          :front="current.term"
          :back="current.definition"
          :flipped="flipped"
          @flip="reveal"
        />
      </div>

      <div v-if="!flipped" class="mt-6 text-center">
        <button type="button" class="btn btn-primary px-8 py-3 text-base" @click="reveal">
          Показати відповідь
          <kbd class="rounded bg-white/20 px-1.5 text-xs">Пробіл</kbd>
        </button>
      </div>

      <div v-else class="mt-6">
        <p class="text-center text-sm text-slate-500">Наскільки легко ви згадали?</p>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            v-for="p in previews"
            :key="p.grade"
            type="button"
            class="flex flex-col items-center rounded-xl border-2 p-3 font-semibold transition"
            :class="gradeClass[p.grade]"
            :data-testid="`grade-${p.grade}`"
            @click="grade(p.grade)"
          >
            {{ p.label }}
            <span class="text-xs font-normal opacity-75">{{ p.interval }} · {{ p.key }}</span>
          </button>
        </div>
      </div>
    </template>

    <!-- ===== Нічого повторювати / сесія завершена ===== -->
    <div v-else class="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p class="text-5xl">{{ status === 'finished' ? '🎉' : '☕' }}</p>
      <h2 class="mt-3 text-2xl font-bold">
        {{ status === 'finished' ? 'Сесію завершено!' : 'На зараз усе повторено' }}
      </h2>

      <p v-if="status === 'finished'" class="mt-2 text-slate-500">
        Повторено: {{ reviewedCount }} · ✗ {{ gradeCounts.again }} · ✓
        {{ gradeCounts.hard + gradeCounts.good + gradeCounts.easy }}
      </p>
      <p v-if="summary.due + summary.new === 0 && summary.nextDue" class="mt-2 text-slate-500">
        Наступне повторення: <strong>{{ formatDueDate(summary.nextDue) }}</strong>
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button
          v-if="summary.due + summary.new > 0"
          v-focus
          type="button"
          class="btn btn-primary"
          @click="start"
        >
          Продовжити ({{ summary.due + summary.new }})
        </button>
        <NuxtLink :to="{ name: 'set', params: { id } }" class="btn btn-secondary">
          До набору
        </NuxtLink>
      </div>
    </div>
  </StudyLayout>
</template>
