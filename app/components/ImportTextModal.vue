<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { CardDraft } from '@/types'
import {
  parseImport,
  DEFAULT_IMPORT_OPTIONS,
  type ImportOptions,
  type TermSeparator,
  type CardSeparator,
} from '@/utils/importExport'
import { pluralizeCards } from '@/utils/pluralize'
import BaseModal from './BaseModal.vue'

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  import: [cards: CardDraft[]]
}>()

const text = ref('')
// reactive() — реактивний об'єкт без .value (зручно для форми з кількома полями)
const options = reactive<ImportOptions>({
  ...DEFAULT_IMPORT_OPTIONS,
  customTermSeparator: '',
  customCardSeparator: '',
})

const termSeparators: { value: TermSeparator; label: string }[] = [
  { value: 'tab', label: 'Табуляція' },
  { value: 'comma', label: 'Кома' },
  { value: 'dash', label: 'Тире ( - )' },
  { value: 'custom', label: 'Свій' },
]
const cardSeparators: { value: CardSeparator; label: string }[] = [
  { value: 'newline', label: 'Новий рядок' },
  { value: 'semicolon', label: 'Крапка з комою' },
  { value: 'custom', label: 'Свій' },
]

// Попередній перегляд оновлюється «наживо» при зміні тексту чи роздільників
const parsed = computed(() => parseImport(text.value, options))
const PREVIEW_LIMIT = 5

const placeholder = 'cat\tкіт\ndog\tпес\nbird\tптах'

function submit() {
  if (!parsed.value.length) return
  emit('import', parsed.value)
  text.value = ''
  open.value = false
}
</script>

<template>
  <BaseModal v-model:open="open" title="Імпорт карток">
    <p class="text-sm text-slate-500">
      Вставте дані з Excel, Google Sheets, Word тощо — по одній картці в рядку.
    </p>
    <textarea
      v-model="text"
      rows="7"
      :placeholder="placeholder"
      class="mt-3 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-brand-500"
      aria-label="Текст для імпорту"
    />

    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <fieldset>
        <legend class="text-sm font-medium">Між терміном і визначенням</legend>
        <label v-for="s in termSeparators" :key="s.value" class="mt-1 flex items-center gap-2">
          <input
            v-model="options.termSeparator"
            type="radio"
            :value="s.value"
            class="accent-brand-500"
          />
          {{ s.label }}
          <input
            v-if="s.value === 'custom' && options.termSeparator === 'custom'"
            v-model="options.customTermSeparator"
            class="w-20 rounded border border-slate-300 bg-white px-2 py-0.5 text-sm"
            aria-label="Свій роздільник терміна"
          />
        </label>
      </fieldset>
      <fieldset>
        <legend class="text-sm font-medium">Між картками</legend>
        <label v-for="s in cardSeparators" :key="s.value" class="mt-1 flex items-center gap-2">
          <input
            v-model="options.cardSeparator"
            type="radio"
            :value="s.value"
            class="accent-brand-500"
          />
          {{ s.label }}
          <input
            v-if="s.value === 'custom' && options.cardSeparator === 'custom'"
            v-model="options.customCardSeparator"
            class="w-20 rounded border border-slate-300 bg-white px-2 py-0.5 text-sm"
            aria-label="Свій роздільник карток"
          />
        </label>
      </fieldset>
    </div>

    <div v-if="parsed.length" class="mt-4">
      <p class="text-sm font-medium">Попередній перегляд: {{ pluralizeCards(parsed.length) }}</p>
      <ul class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
        <li
          v-for="(card, i) in parsed.slice(0, PREVIEW_LIMIT)"
          :key="i"
          class="grid grid-cols-2 gap-4 px-3 py-2"
        >
          <span class="font-medium">{{ card.term || '—' }}</span>
          <span :class="card.definition ? 'text-slate-600' : 'text-red-500'">
            {{ card.definition || 'немає визначення' }}
          </span>
        </li>
        <li v-if="parsed.length > PREVIEW_LIMIT" class="px-3 py-2 text-slate-400">
          …і ще {{ parsed.length - PREVIEW_LIMIT }}
        </li>
      </ul>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="open = false">Скасувати</button>
      <button type="button" class="btn btn-primary" :disabled="!parsed.length" @click="submit">
        Імпортувати{{ parsed.length ? ` (${parsed.length})` : '' }}
      </button>
    </template>
  </BaseModal>
</template>
