<script setup lang="ts">
import { ref } from 'vue'
import { vFocus } from '@/directives/focus'

const props = defineProps<{
  answered: boolean
}>()

const emit = defineEmits<{
  submit: [text: string]
}>()

// Локальний стан компонента: текст поля живе тут, а батькові передаємо лише готову відповідь
const text = ref('')

function submit(value: string) {
  if (!props.answered) emit('submit', value)
}
</script>

<template>
  <form @submit.prevent="submit(text)">
    <label class="text-sm font-medium text-slate-500" for="written-answer">Введіть відповідь</label>
    <div class="mt-3 flex flex-col gap-3 sm:flex-row">
      <input
        id="written-answer"
        v-model="text"
        v-focus
        type="text"
        autocomplete="off"
        :disabled="answered"
        class="flex-1 rounded-lg border-2 border-slate-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-slate-50"
      />
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary flex-1 py-3" :disabled="answered">
          Відповісти
        </button>
        <button
          type="button"
          class="btn btn-secondary flex-1 py-3"
          :disabled="answered"
          @click="submit('')"
        >
          Не знаю
        </button>
      </div>
    </div>
  </form>
</template>
