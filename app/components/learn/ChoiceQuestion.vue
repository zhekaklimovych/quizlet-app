<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  options: string[]
  /** Правильна відповідь — для підсвічування після вибору */
  answer: string
  /** Що обрав користувач; null — ще не відповів */
  selected: string | null
}>()

const emit = defineEmits<{
  choose: [option: string]
}>()

const answered = computed(() => props.selected !== null)

function choose(option: string) {
  if (!answered.value) emit('choose', option)
}

/** Колір кожного варіанта залежить від стану: до відповіді / правильний / помилково обраний / інші */
function optionClass(option: string) {
  if (!answered.value) return 'border-slate-200 hover:border-brand-500 hover:bg-brand-50'
  if (option === props.answer) return 'border-emerald-500 bg-emerald-50 text-emerald-800'
  if (option === props.selected) return 'border-red-400 bg-red-50 text-red-800'
  return 'border-slate-200 opacity-50'
}

// Клавіші 1–4 — швидкий вибір варіанта
function onKeydown(e: KeyboardEvent) {
  if (answered.value || e.target instanceof HTMLInputElement) return
  const option = props.options[Number(e.key) - 1]
  if (option !== undefined) choose(option)
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div>
    <p class="text-sm font-medium text-slate-500">Оберіть правильну відповідь</p>
    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <button
        v-for="(option, i) in options"
        :key="option"
        type="button"
        data-testid="option"
        class="flex items-center gap-3 rounded-xl border-2 p-4 text-left transition"
        :class="optionClass(option)"
        :disabled="answered"
        @click="choose(option)"
      >
        <span
          class="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500"
        >
          {{ i + 1 }}
        </span>
        {{ option }}
      </button>
    </div>
    <button
      v-if="!answered"
      type="button"
      class="mt-3 text-sm text-slate-500 underline hover:text-slate-700"
      @click="choose('')"
    >
      Не знаю
    </button>
  </div>
</template>
