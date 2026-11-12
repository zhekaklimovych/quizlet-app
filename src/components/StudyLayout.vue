<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { StudySet } from '@/types'

/**
 * Спільна обгортка для всіх режимів навчання:
 * посилання назад, заголовок, обробка «набір не знайдено» і «немає карток».
 * Сам вміст режиму передається через слоти.
 */
defineProps<{
  set: StudySet | undefined
  title: string
}>()

// defineSlots — лише для TypeScript: описує, які слоти приймає компонент
defineSlots<{
  /** Основний вміст режиму (рендериться лише якщо набір існує і має картки) */
  default(): unknown
  /** Додаткові елементи праворуч від заголовка (налаштування режиму) */
  actions?(): unknown
}>()
</script>

<template>
  <section v-if="set" class="mx-auto max-w-3xl">
    <RouterLink
      :to="{ name: 'set', params: { id: set.id } }"
      class="text-sm text-slate-500 hover:text-brand-600"
    >
      ← {{ set.title }}
    </RouterLink>

    <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">{{ title }}</h1>
      <slot name="actions" />
    </div>

    <slot v-if="set.cards.length" />
    <p v-else class="mt-6 text-slate-500">У наборі немає карток.</p>
  </section>

  <section v-else class="py-16 text-center">
    <h1 class="text-2xl font-bold">Набір не знайдено</h1>
    <RouterLink to="/" class="btn btn-primary mt-6">На головну</RouterLink>
  </section>
</template>
