<script setup lang="ts">
import SetEditor from '~/components/SetEditor.vue'

// Статичний сегмент «new» має пріоритет над динамічним [id] — Nuxt ранжує маршрути сам
definePageMeta({ name: 'set-create' })
</script>

<template>
  <SetEditor />
</template>
