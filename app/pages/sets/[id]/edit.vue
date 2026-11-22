<script setup lang="ts">
import SetEditor from '~/components/SetEditor.vue'

definePageMeta({ name: 'set-edit', props: true })

defineProps<{
  id: string
}>()
</script>

<template>
  <SetEditor :id="id" />
</template>
