<script setup lang="ts">
import type { AnswerResult } from '@/composables/useLearn'
import { vFocus } from '@/directives/focus'

defineProps<{
  result: AnswerResult
  /** Показувати кнопку «Зарахувати як правильну» */
  canOverride: boolean
}>()

const emit = defineEmits<{
  continue: []
  override: []
}>()
</script>

<template>
  <div
    class="rounded-xl border p-4"
    :class="result.correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'"
    role="status"
  >
    <p class="font-semibold" :class="result.correct ? 'text-emerald-700' : 'text-red-700'">
      <template v-if="!result.correct">Не зовсім</template>
      <template v-else-if="result.typo">Зараховано, але є описка</template>
      <template v-else>Правильно! 🎉</template>
    </p>

    <dl v-if="!result.correct || result.typo" class="mt-2 space-y-1 text-sm">
      <div v-if="result.given" class="flex gap-2">
        <dt class="text-slate-500">Ваша відповідь:</dt>
        <dd :class="result.correct ? 'text-amber-700' : 'text-red-700 line-through'">
          {{ result.given }}
        </dd>
      </div>
      <p v-else class="text-slate-500">Ви пропустили це питання</p>
      <div class="flex gap-2">
        <dt class="text-slate-500">Правильна відповідь:</dt>
        <dd class="font-semibold text-emerald-700">{{ result.expected }}</dd>
      </div>
    </dl>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        v-if="canOverride"
        type="button"
        class="text-sm text-slate-500 underline hover:text-slate-700"
        @click="emit('override')"
      >
        Зарахувати як правильну
      </button>
      <!-- v-focus: фокус на кнопці, тож Enter одразу натискає «Продовжити» -->
      <button v-focus type="button" class="btn btn-primary ml-auto" @click="emit('continue')">
        Продовжити
        <kbd class="rounded bg-white/20 px-1.5 text-xs">Enter</kbd>
      </button>
    </div>
  </div>
</template>
