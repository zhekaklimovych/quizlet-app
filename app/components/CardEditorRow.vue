<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

const props = defineProps<{
  index: number
  total: number
  /** Чи сфокусувати поле «Термін» одразу після появи рядка */
  autofocus?: boolean
  /** Підсвітити рядок як помилковий (заповнена лише одна сторона) */
  invalid?: boolean
}>()

// defineModel — двостороннє зв'язування з батьком.
// Батько пише <CardEditorRow v-model:term="card.term" v-model:definition="card.definition" />
const term = defineModel<string>('term', { required: true })
const definition = defineModel<string>('definition', { required: true })

// Події, які рядок надсилає батькові: «видали мене», «посунь мене»
const emit = defineEmits<{
  remove: []
  move: [direction: -1 | 1]
}>()

// Посилання на DOM-елемент <input ref="termInput">
const termInput = useTemplateRef<HTMLInputElement>('termInput')

// onMounted — хук життєвого циклу: компонент уже вставлено в DOM
onMounted(() => {
  if (props.autofocus) termInput.value?.focus()
})
</script>

<template>
  <div
    class="rounded-xl border bg-white p-4 shadow-sm"
    :class="invalid ? 'border-red-300' : 'border-slate-200'"
  >
    <div class="flex items-center justify-between text-sm text-slate-400">
      <span class="font-semibold">{{ index + 1 }}</span>
      <div class="flex gap-1">
        <button
          type="button"
          class="rounded p-1 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          :disabled="index === 0"
          title="Вгору"
          @click="emit('move', -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="rounded p-1 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          :disabled="index === total - 1"
          title="Вниз"
          @click="emit('move', 1)"
        >
          ↓
        </button>
        <button
          type="button"
          class="rounded p-1 hover:bg-red-50 hover:text-red-600"
          title="Видалити картку"
          @click="emit('remove')"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="mt-2 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <input
          ref="termInput"
          v-model="term"
          type="text"
          class="w-full border-b-2 border-slate-300 bg-transparent py-1 outline-none focus:border-brand-500"
        />
        <span class="mt-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
          Термін
        </span>
      </label>
      <label class="block">
        <input
          v-model="definition"
          type="text"
          class="w-full border-b-2 border-slate-300 bg-transparent py-1 outline-none focus:border-brand-500"
        />
        <span class="mt-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
          Визначення
        </span>
      </label>
    </div>

    <p v-if="invalid" class="mt-2 text-sm text-red-600">
      Заповніть обидва поля або видаліть картку
    </p>
  </div>
</template>
