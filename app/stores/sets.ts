import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Card, StudySet, StudySetDraft } from '@/types'
import { createId } from '@/utils/id'
import { demoSets } from '@/data/demoSets'
import { createVersionedStorage, isRecord } from '@/utils/storage'

export const STORAGE_KEY = 'quizlet-app:sets'

function isStudySet(value: unknown): value is StudySet {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    Array.isArray(value.cards) &&
    typeof value.createdAt === 'number' &&
    typeof value.updatedAt === 'number'
  )
}

/**
 * Історія формату:
 *  v1 — голий масив наборів (кроки 3–10)
 *  v2 — конверт { version, data }; під час міграції «лікуємо» відсутні поля
 */
const storage = createVersionedStorage<StudySet[]>({
  key: STORAGE_KEY,
  version: 2,
  migrations: {
    1: (data) =>
      (Array.isArray(data) ? data : []).filter(isRecord).map((set) => ({
        ...set,
        description: typeof set.description === 'string' ? set.description : '',
        cards: Array.isArray(set.cards) ? set.cards : [],
        createdAt: typeof set.createdAt === 'number' ? set.createdAt : Date.now(),
        updatedAt: typeof set.updatedAt === 'number' ? set.updatedAt : Date.now(),
      })),
  },
  validate: (data): data is StudySet[] => Array.isArray(data) && data.every(isStudySet),
})

/** Перетворює чернетку з редактора на повноцінний набір: проставляє id, чистить пробіли, відкидає порожні картки. */
function normalizeCards(draft: StudySetDraft): Card[] {
  return draft.cards
    .map((c) => ({
      id: c.id ?? createId(),
      term: c.term.trim(),
      definition: c.definition.trim(),
    }))
    .filter((c) => c.term !== '' || c.definition !== '')
}

/**
 * Setup-стор (той самий стиль, що й <script setup>):
 *  - ref()      → state (стан)
 *  - computed() → getters (похідні значення)
 *  - function   → actions (дії, що змінюють стан)
 */
export const useSetsStore = defineStore('sets', () => {
  // ---------- state ----------
  const sets = ref<StudySet[]>(storage.load() ?? createDemoSets())

  // ---------- getters ----------
  /** Набори, відсортовані від найновішого. */
  const sortedSets = computed(() => [...sets.value].sort((a, b) => b.updatedAt - a.updatedAt))

  function getSet(id: string): StudySet | undefined {
    return sets.value.find((s) => s.id === id)
  }

  // ---------- actions ----------
  function createSet(draft: StudySetDraft): StudySet {
    const now = Date.now()
    const set: StudySet = {
      id: createId(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      cards: normalizeCards(draft),
      createdAt: now,
      updatedAt: now,
    }
    sets.value.push(set)
    // Повертаємо саме реактивну версію (Proxy) з масиву, а не вихідний об'єкт:
    // зміни через Proxy відстежуються Vue, а зміни «сирого» об'єкта — ні.
    return getSet(set.id)!
  }

  function updateSet(id: string, draft: StudySetDraft): StudySet | undefined {
    const set = getSet(id)
    if (!set) return undefined
    set.title = draft.title.trim()
    set.description = draft.description.trim()
    set.cards = normalizeCards(draft)
    set.updatedAt = Date.now()
    return set
  }

  function deleteSet(id: string) {
    sets.value = sets.value.filter((s) => s.id !== id)
  }

  // ---------- persistence ----------
  // deep: true — спрацьовує і при зміні вкладених полів (наприклад, set.title), а не лише при заміні масиву
  watch(sets, (value) => storage.save(value), { deep: true })

  return { sets, sortedSets, getSet, createSet, updateSet, deleteSet }
})

function createDemoSets(): StudySet[] {
  const now = Date.now()
  return demoSets.map((draft, i) => ({
    id: createId(),
    title: draft.title,
    description: draft.description,
    cards: normalizeCards(draft),
    createdAt: now - i,
    updatedAt: now - i,
  }))
}
