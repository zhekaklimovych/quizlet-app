<script setup lang="ts">
import { computed } from 'vue'
import type { TestAnswer, TestQuestion } from '@/composables/useTest'
import type { AnswerVerdict } from '@/utils/answers'

const props = defineProps<{
  question: TestQuestion
  number: number
  total: number
  /** Оцінка після перевірки; undefined — тест ще проходять (режим відповіді) */
  verdict?: AnswerVerdict
}>()

// Відповідь — двостороннє зв'язування з батьком: v-model="answers[q.id]"
const answer = defineModel<TestAnswer>()

const graded = computed(() => props.verdict !== undefined)
const isCorrect = computed(() => props.verdict === 'correct' || props.verdict === 'typo')

/**
 * Writable computed: get/set.
 * <input v-model> працює лише з рядками, а answer може бути й boolean —
 * тож робимо «адаптер», що завжди віддає рядок і записує рядок.
 */
const text = computed({
  get: () => (typeof answer.value === 'string' ? answer.value : ''),
  set: (value: string) => (answer.value = value),
})

/** Стиль варіанта (вибір або правда/неправда) у режимі відповіді та після перевірки */
function optionClass(value: TestAnswer, correctValue: TestAnswer) {
  const chosen = answer.value === value
  if (!graded.value) {
    return chosen
      ? 'border-brand-500 bg-brand-50 text-brand-800'
      : 'border-slate-200 hover:border-brand-300'
  }
  if (value === correctValue) return 'border-emerald-500 bg-emerald-50 text-emerald-800'
  if (chosen) return 'border-red-400 bg-red-50 text-red-800'
  return 'border-slate-200 opacity-50'
}
</script>

<template>
  <article
    class="rounded-2xl border bg-white p-6 shadow-sm"
    :class="!graded ? 'border-slate-200' : isCorrect ? 'border-emerald-300' : 'border-red-300'"
    data-testid="test-question"
  >
    <header class="flex justify-between text-xs font-medium tracking-wide text-slate-400 uppercase">
      <span>Питання {{ number }} з {{ total }}</span>
      <span v-if="graded" :class="isCorrect ? 'text-emerald-600' : 'text-red-600'">
        {{ isCorrect ? '✓ Правильно' : '✗ Неправильно' }}
      </span>
    </header>

    <p class="mt-3 text-xl font-semibold break-words">{{ question.prompt }}</p>

    <!-- v-if / v-else-if по question.type: TypeScript «звужує» тип у кожній гілці -->

    <!-- ===== Правда / неправда ===== -->
    <template v-if="question.type === 'true-false'">
      <p class="mt-2 text-lg break-words text-slate-600">
        <span class="text-slate-400">=</span> {{ question.shown }}
      </p>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <button
          v-for="opt in [
            { value: true, label: 'Правда' },
            { value: false, label: 'Неправда' },
          ]"
          :key="String(opt.value)"
          type="button"
          class="rounded-xl border-2 p-3 font-semibold transition"
          :class="optionClass(opt.value, question.isTrue)"
          :disabled="graded"
          :aria-pressed="answer === opt.value"
          @click="answer = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
      <p v-if="graded && !isCorrect && !question.isTrue" class="mt-3 text-sm text-slate-600">
        Правильна відповідь:
        <span class="font-semibold text-emerald-700">{{ question.answer }}</span>
      </p>
    </template>

    <!-- ===== Вибір відповіді ===== -->
    <div v-else-if="question.type === 'choice'" class="mt-4 grid gap-3 sm:grid-cols-2">
      <button
        v-for="option in question.options"
        :key="option"
        type="button"
        data-testid="test-option"
        class="rounded-xl border-2 p-3 text-left transition"
        :class="optionClass(option, question.answer)"
        :disabled="graded"
        :aria-pressed="answer === option"
        @click="answer = option"
      >
        {{ option }}
      </button>
    </div>

    <!-- ===== Письмова відповідь ===== -->
    <div v-else class="mt-4">
      <input
        v-model="text"
        type="text"
        autocomplete="off"
        placeholder="Введіть відповідь"
        :disabled="graded"
        :aria-label="`Відповідь на питання ${number}`"
        class="w-full rounded-lg border-2 px-4 py-3 outline-none focus:border-brand-500"
        :class="
          !graded
            ? 'border-slate-300'
            : isCorrect
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-red-300 bg-red-50 line-through'
        "
      />
      <p v-if="graded && verdict === 'typo'" class="mt-2 text-sm text-amber-700">
        Зараховано з опискою. Правильно: <span class="font-semibold">{{ question.answer }}</span>
      </p>
      <p v-else-if="graded && !isCorrect" class="mt-2 text-sm text-slate-600">
        Правильна відповідь:
        <span class="font-semibold text-emerald-700">{{ question.answer }}</span>
      </p>
    </div>
  </article>
</template>
