<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useSetsStore } from '@/stores/sets'
import { useProgressStore } from '@/stores/progress'
import { useTest, TEST_QUESTION_TYPES } from '@/composables/useTest'
import StudyLayout from '@/components/StudyLayout.vue'
import TestQuestionCard from '@/components/test/TestQuestionCard.vue'

const props = defineProps<{
  id: string
}>()

const store = useSetsStore()
const progress = useProgressStore()
const set = computed(() => store.getSet(props.id))

const {
  status,
  settings,
  settingsErrors,
  canGenerate,
  total,
  questions,
  answers,
  answeredCount,
  verdicts,
  score,
  generate,
  submit,
  backToSetup,
} = useTest(() => set.value?.cards ?? [])

const topEl = useTemplateRef<HTMLElement>('top')

async function scrollToTop() {
  await nextTick() // чекаємо, поки Vue оновить DOM
  // ?.() — у тестовому середовищі (jsdom) методу scrollIntoView немає
  topEl.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

function start() {
  generate()
  scrollToTop()
}

function onSubmit() {
  const missing = questions.value.length - answeredCount.value
  if (missing > 0 && !confirm(`Без відповіді: ${missing}. Все одно перевірити?`)) return
  submit()
  // Записуємо кожну відповідь у загальну статистику карток
  for (const q of questions.value) {
    const verdict = verdicts.value[q.id]
    progress.recordAnswer(q.card.id, verdict === 'correct' || verdict === 'typo')
  }
  scrollToTop()
}

/** Колір результату залежить від відсотка */
const scoreColor = computed(() => {
  if (score.value.percent >= 80) return 'text-emerald-600'
  if (score.value.percent >= 50) return 'text-amber-600'
  return 'text-red-600'
})
</script>

<template>
  <StudyLayout :set="set" title="Тест">
    <div ref="top" class="scroll-mt-24" />

    <!-- ===== Налаштування ===== -->
    <form
      v-if="status === 'setup'"
      class="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="start"
    >
      <label class="flex flex-wrap items-center gap-3">
        <span class="font-medium">Кількість питань</span>
        <!-- .number — модифікатор: перетворює введений текст на число -->
        <input
          v-model.number="settings.count"
          type="number"
          min="1"
          :max="total"
          class="w-20 rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-brand-500"
        />
        <span class="text-sm text-slate-500">з {{ total }}</span>
      </label>

      <fieldset>
        <legend class="font-medium">Типи питань</legend>
        <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          <!-- v-model на чекбоксах з масивом: відмічені value потрапляють у settings.types -->
          <label v-for="t in TEST_QUESTION_TYPES" :key="t.type" class="flex items-center gap-2">
            <input
              v-model="settings.types"
              type="checkbox"
              :value="t.type"
              class="size-4 accent-brand-500"
            />
            {{ t.label }}
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend class="font-medium">Відповідати</legend>
        <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          <label class="flex items-center gap-2">
            <input
              v-model="settings.answerWith"
              type="radio"
              value="definition"
              class="size-4 accent-brand-500"
            />
            Визначенням
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="settings.answerWith"
              type="radio"
              value="term"
              class="size-4 accent-brand-500"
            />
            Терміном
          </label>
        </div>
      </fieldset>

      <ul v-if="settingsErrors.length" class="text-sm text-red-600">
        <li v-for="e in settingsErrors" :key="e">• {{ e }}</li>
      </ul>

      <button type="submit" class="btn btn-primary px-8 py-3 text-base" :disabled="!canGenerate">
        Створити тест
      </button>
    </form>

    <!-- ===== Результат (над питаннями) ===== -->
    <div
      v-if="status === 'graded'"
      class="mt-6 flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p class="text-5xl font-bold tabular-nums" :class="scoreColor" data-testid="score">
        {{ score.percent }}%
      </p>
      <div class="flex-1">
        <p class="font-semibold">Правильно {{ score.correct }} з {{ score.total }}</p>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-red-200">
          <div class="h-full bg-emerald-500" :style="{ width: `${score.percent}%` }" />
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary" @click="start">Новий тест</button>
        <button type="button" class="btn btn-secondary" @click="backToSetup">Налаштування</button>
        <RouterLink :to="{ name: 'set', params: { id } }" class="btn btn-secondary">
          До набору
        </RouterLink>
      </div>
    </div>

    <!-- ===== Питання (проходження і розбір) ===== -->
    <template v-if="status !== 'setup'">
      <div class="mt-6 space-y-4">
        <TestQuestionCard
          v-for="(q, i) in questions"
          :key="q.id"
          v-model="answers[q.id]"
          :question="q"
          :number="i + 1"
          :total="questions.length"
          :verdict="verdicts[q.id]"
        />
      </div>

      <div
        v-if="status === 'in-progress'"
        class="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur"
      >
        <span class="text-sm text-slate-500">
          Відповідей: {{ answeredCount }} з {{ questions.length }}
        </span>
        <button type="button" class="btn btn-primary" @click="onSubmit">Перевірити</button>
      </div>
    </template>
  </StudyLayout>
</template>
