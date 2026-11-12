<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { StudySet } from '@/types'
import { pluralizeCards } from '@/utils/pluralize'

// defineProps — оголошення вхідних даних компонента.
// Батько передає: <SetCard :set="someSet" />
defineProps<{
  set: StudySet
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'set', params: { id: set.id } }"
    class="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
  >
    <h2 class="text-lg font-semibold group-hover:text-brand-600">{{ set.title }}</h2>
    <p v-if="set.description" class="mt-1 line-clamp-2 text-sm text-slate-500">
      {{ set.description }}
    </p>
    <span
      class="mt-4 w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
    >
      {{ pluralizeCards(set.cards.length) }}
    </span>
  </RouterLink>
</template>
