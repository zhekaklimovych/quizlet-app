<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useSetsStore } from '@/stores/sets'
import { filterSets } from '@/utils/search'
import { parseJsonSet, ImportError } from '@/utils/importExport'
import SetCard from '@/components/SetCard.vue'

// Назва маршруту (для посилань { name: ... }); props: true — параметри URL приходять як props
definePageMeta({ name: 'home' })

const store = useSetsStore()
const route = useRoute()
const router = useRouter()

/**
 * Пошуковий запит живе в URL (?q=...), а не в локальному ref:
 *  - посилання з пошуком можна скопіювати й відкрити знову
 *  - кнопка «Назад» у браузері повертає до попереднього запиту
 * Writable computed: get читає з URL, set записує в URL.
 */
const query = computed({
  get: () => (typeof route.query.q === 'string' ? route.query.q : ''),
  set: (value: string) => {
    // replace, а не push — щоб кожна введена літера не створювала новий запис в історії
    router.replace({ query: value ? { q: value } : {} })
  },
})

const results = computed(() => filterSets(store.sortedSets, query.value))

// ---------- імпорт з файлу ----------
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const importError = ref('')

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // скидаємо, щоб той самий файл можна було обрати повторно
  if (!file) return

  importError.value = ''
  try {
    const draft = parseJsonSet(await file.text()) // File.text() — читає файл як рядок (Promise)
    const set = store.createSet(draft)
    router.push({ name: 'set', params: { id: set.id } })
  } catch (err) {
    importError.value = err instanceof ImportError ? err.message : 'Не вдалося прочитати файл'
  }
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-3xl font-bold">Мої набори</h1>
      <div class="flex flex-wrap gap-2">
        <!-- Справжній <input type="file"> прихований; кнопка «клікає» по ньому програмно -->
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="hidden"
          data-testid="file-input"
          @change="onFileSelected"
        />
        <button type="button" class="btn btn-secondary" @click="fileInput?.click()">
          ⇪ Імпорт з файлу
        </button>
        <NuxtLink :to="{ name: 'set-create' }" class="btn btn-primary">+ Новий набір</NuxtLink>
      </div>
    </div>

    <p v-if="importError" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
      {{ importError }}
    </p>

    <template v-if="store.sets.length">
      <div class="relative mt-6">
        <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          >🔍</span
        >
        <input
          v-model="query"
          type="search"
          placeholder="Пошук за назвою, терміном або визначенням…"
          aria-label="Пошук наборів"
          class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <p v-if="query" class="mt-2 text-sm text-slate-500">Знайдено: {{ results.length }}</p>

      <div v-if="results.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- v-for з :key — Vue за ключем розуміє, який елемент змінився/перемістився -->
        <SetCard v-for="set in results" :key="set.id" :set="set" />
      </div>
      <div v-else class="mt-6 rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p class="text-slate-500">Нічого не знайдено за запитом «{{ query }}»</p>
        <button type="button" class="btn btn-secondary mt-4" @click="query = ''">
          Очистити пошук
        </button>
      </div>
    </template>

    <div
      v-else
      class="mt-6 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center text-slate-500"
    >
      <p>У вас ще немає наборів.</p>
      <NuxtLink :to="{ name: 'set-create' }" class="btn btn-primary mt-4">
        Створити перший набір
      </NuxtLink>
    </div>
  </section>
</template>
