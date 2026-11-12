<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { StudySet } from '@/types'
import { useProgressStore } from '@/stores/progress'
import { formatDueDate } from '@/utils/format'

const props = defineProps<{
  set: StudySet
}>()

const progress = useProgressStore()

// computed над функцією стору: перерахується, коли зміниться статистика або картки набору
const summary = computed(() => progress.summarize(props.set.cards))
const toReview = computed(() => summary.value.due + summary.value.new)
const hasProgress = computed(() => summary.value.new < summary.value.total)

/** Частки для смуги: повторені (заплановані) / пора повторити / нові */
const percent = (n: number) => (summary.value.total ? (n / summary.value.total) * 100 : 0)

function onReset() {
  if (!confirm('Скинути прогрес повторення для цього набору?')) return
  progress.resetCards(props.set.cards.map((c) => c.id))
}
</script>

<template>
  <section
    class="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-brand-200 bg-brand-50 p-5"
    data-testid="review-panel"
  >
    <div class="min-w-48 flex-1">
      <h2 class="font-semibold text-brand-800">🧠 Інтервальне повторення</h2>
      <p class="mt-1 text-sm text-slate-600">
        <template v-if="toReview">
          На зараз: <strong>{{ summary.due }}</strong> до повторення,
          <strong>{{ summary.new }}</strong> нових
        </template>
        <template v-else-if="summary.nextDue">
          Усе повторено. Наступне: {{ formatDueDate(summary.nextDue) }}
        </template>
      </p>
      <div class="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white">
        <div class="bg-emerald-500" :style="{ width: `${percent(summary.scheduled)}%` }" />
        <div class="bg-amber-400" :style="{ width: `${percent(summary.due)}%` }" />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        v-if="hasProgress"
        type="button"
        class="text-sm text-slate-500 underline hover:text-slate-700"
        @click="onReset"
      >
        Скинути
      </button>
      <RouterLink
        v-if="toReview"
        :to="{ name: 'study-review', params: { id: set.id } }"
        class="btn btn-primary"
      >
        Повторювати ({{ toReview }})
      </RouterLink>
    </div>
  </section>
</template>
