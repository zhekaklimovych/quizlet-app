<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTheme, THEME_LABELS } from '@/composables/useTheme'

const { mode, cycle } = useTheme()
const theme = computed(() => THEME_LABELS[mode.value])
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
      <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold text-brand-600">
        <span class="grid size-8 place-items-center rounded-lg bg-brand-500 text-on-brand">Q</span>
        <span class="hidden sm:inline">Quizlet App</span>
      </RouterLink>

      <nav class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-secondary px-3"
          :title="`Тема: ${theme.label}`"
          :aria-label="`Тема: ${theme.label}. Натисніть, щоб змінити`"
          data-testid="theme-toggle"
          @click="cycle"
        >
          {{ theme.icon }}
        </button>
        <RouterLink to="/" class="btn btn-secondary hidden sm:inline-flex">Мої набори</RouterLink>
        <RouterLink :to="{ name: 'set-create' }" class="btn btn-primary">+ Створити</RouterLink>
      </nav>
    </div>
  </header>
</template>
