<script setup lang="ts">
import { computed } from 'vue'
import { useSetsStore } from '@/stores/sets'
import { useProgressStore } from '@/stores/progress'
import { useLearn, type AnswerWith } from '@/composables/useLearn'
import { vFocus } from '@/directives/focus'
import { pluralizeRounds, pluralizeTerms } from '@/utils/pluralize'
import StudyLayout from '@/components/StudyLayout.vue'
import ChoiceQuestion from '@/components/learn/ChoiceQuestion.vue'
import WrittenQuestion from '@/components/learn/WrittenQuestion.vue'
import FeedbackPanel from '@/components/learn/FeedbackPanel.vue'
import SpeakButton from '@/components/SpeakButton.vue'

// Назва маршруту (для посилань { name: ... }); props: true — параметри URL приходять як props
definePageMeta({ name: 'study-learn', props: true })

const props = defineProps<{
  id: string
}>()

const store = useSetsStore()
const progress = useProgressStore()
const set = computed(() => store.getSet(props.id))

const {
  status,
  question,
  result,
  answerWith,
  round,
  roundPos,
  roundNumber,
  roundResults,
  total,
  masteredCount,
  learningCount,
  newCount,
  correctInRound,
  hardest,
  answerChoice,
  answerWritten,
  overrideCorrect,
  proceed,
  startRound,
  restart,
  setAnswerWith,
} = useLearn(() => set.value?.cards ?? [], {
  onAnswered: (card, correct) => progress.recordAnswer(card.id, correct),
})

const answerWithOptions: { value: AnswerWith; label: string }[] = [
  { value: 'definition', label: 'Визначенням' },
  { value: 'term', label: 'Терміном' },
]

/** Частка від загальної кількості, у відсотках — для ширини сегментів прогресу */
const percent = (n: number) => (total.value ? (n / total.value) * 100 : 0)
</script>

<template>
  <StudyLayout :set="set" title="Заучування">
    <!-- Іменований слот #actions — потрапляє праворуч від заголовка в StudyLayout -->
    <template #actions>
      <div class="flex items-center gap-2 text-sm text-slate-500">
        Відповідати:
        <div class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="group">
          <button
            v-for="opt in answerWithOptions"
            :key="opt.value"
            type="button"
            class="rounded-md px-3 py-1 font-medium transition"
            :class="
              answerWith === opt.value
                ? 'bg-brand-500 text-on-brand'
                : 'text-slate-600 hover:bg-slate-100'
            "
            :aria-pressed="answerWith === opt.value"
            @click="setAnswerWith(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </template>

    <!-- Прогрес: сегменти «вивчено» + «вивчаю» -->
    <div class="mt-6">
      <div class="flex h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          class="bg-emerald-500 transition-all"
          :style="{ width: `${percent(masteredCount)}%` }"
        />
        <div class="bg-amber-400 transition-all" :style="{ width: `${percent(learningCount)}%` }" />
      </div>
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span class="flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-emerald-500" /> Вивчено: {{ masteredCount }}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-amber-400" /> Вивчаю: {{ learningCount }}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-slate-300" /> Нові: {{ newCount }}
        </span>
      </div>
    </div>

    <!-- ===== Питання + зворотний зв'язок ===== -->
    <div
      v-if="question && (status === 'question' || status === 'feedback')"
      class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div class="flex justify-between text-xs font-medium tracking-wide text-slate-400 uppercase">
        <span>{{ answerWith === 'definition' ? 'Термін' : 'Визначення' }}</span>
        <span>Раунд {{ roundNumber }} · {{ roundPos + 1 }} / {{ round.length }}</span>
      </div>
      <div class="mt-3 flex items-start justify-between gap-3">
        <p class="text-2xl font-semibold break-words" data-testid="prompt">
          {{ question.prompt }}
        </p>
        <SpeakButton :text="question.prompt" />
      </div>

      <!-- :key="question.id" — для кожного питання компонент створюється заново (чистий стан) -->
      <ChoiceQuestion
        v-if="question.type === 'choice'"
        :key="question.id"
        class="mt-6"
        :options="question.options"
        :answer="question.answer"
        :selected="result?.given ?? null"
        @choose="answerChoice"
      />
      <WrittenQuestion
        v-else
        :key="question.id"
        class="mt-6"
        :answered="status === 'feedback'"
        @submit="answerWritten"
      />

      <FeedbackPanel
        v-if="status === 'feedback' && result"
        class="mt-6"
        :result="result"
        :can-override="question.type === 'written' && !result.correct"
        @continue="proceed"
        @override="overrideCorrect"
      />
    </div>

    <!-- ===== Підсумок раунду ===== -->
    <div
      v-else-if="status === 'summary'"
      class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 class="text-xl font-bold">Раунд {{ roundNumber }} завершено</h2>
      <p class="mt-1 text-slate-500">
        Правильних відповідей: {{ correctInRound }} з {{ roundResults.length }}
      </p>
      <ul class="mt-4 divide-y divide-slate-100">
        <li v-for="(r, i) in roundResults" :key="i" class="flex gap-3 py-2">
          <span :class="r.correct ? 'text-emerald-600' : 'text-red-600'">
            {{ r.correct ? '✓' : '✗' }}
          </span>
          <span class="font-medium">{{ r.card.term }}</span>
          <span class="text-slate-500">— {{ r.card.definition }}</span>
        </li>
      </ul>
      <button v-focus type="button" class="btn btn-primary mt-6" @click="startRound">
        Наступний раунд
      </button>
    </div>

    <!-- ===== Усе вивчено ===== -->
    <div
      v-else-if="status === 'finished'"
      class="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <p class="text-5xl">🎉</p>
      <h2 class="mt-3 text-2xl font-bold">Усі терміни вивчено!</h2>
      <p class="mt-1 text-slate-500">
        {{ pluralizeTerms(total) }} за {{ pluralizeRounds(roundNumber) }}
      </p>

      <div v-if="hardest.length" class="mx-auto mt-6 max-w-md text-left">
        <h3 class="text-sm font-semibold text-slate-600">Варто повторити:</h3>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="h in hardest" :key="h.card.id" class="flex justify-between gap-4">
            <span>
              <span class="font-medium">{{ h.card.term }}</span>
              <span class="text-slate-500"> — {{ h.card.definition }}</span>
            </span>
            <span class="shrink-0 text-red-600">✗ {{ h.misses }}</span>
          </li>
        </ul>
      </div>

      <div class="mt-8 flex justify-center gap-3">
        <button v-focus type="button" class="btn btn-primary" @click="restart">
          Пройти ще раз
        </button>
        <NuxtLink :to="{ name: 'set', params: { id } }" class="btn btn-secondary">
          До набору
        </NuxtLink>
      </div>
    </div>
  </StudyLayout>
</template>
