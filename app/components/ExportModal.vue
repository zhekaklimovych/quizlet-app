<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import type { StudySet } from '@/types'
import { exportAsJson, exportAsText, downloadFile, toFilename } from '@/utils/importExport'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  set: StudySet
}>()

const open = defineModel<boolean>('open', { required: true })

const text = computed(() => exportAsText(props.set))

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    // Clipboard API — асинхронний, працює лише на https або localhost
    await navigator.clipboard.writeText(text.value)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    alert('Не вдалося скопіювати. Виділіть текст і скопіюйте вручну (Ctrl+C).')
  }
}
onScopeDispose(() => clearTimeout(copiedTimer))

function downloadJson() {
  downloadFile(toFilename(props.set.title, 'json'), exportAsJson(props.set))
}

function selectAll(e: FocusEvent) {
  ;(e.target as HTMLTextAreaElement).select()
}
</script>

<template>
  <BaseModal v-model:open="open" title="Експорт набору">
    <p class="text-sm text-slate-500">
      Текст у форматі «термін ⇥ визначення» — можна вставити в Excel, Google Sheets або назад у
      редактор через «Імпорт».
    </p>
    <textarea
      :value="text"
      readonly
      rows="8"
      class="mt-3 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm"
      aria-label="Текст для експорту"
      @focus="selectAll"
    />

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="downloadJson">
        ⇩ Завантажити .json
      </button>
      <button type="button" class="btn btn-primary" @click="copy">
        {{ copied ? '✓ Скопійовано' : 'Копіювати текст' }}
      </button>
    </template>
  </BaseModal>
</template>
