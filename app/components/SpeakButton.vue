<script setup lang="ts">
import { useSpeech } from '@/composables/useSpeech'

const props = defineProps<{
  text: string
}>()

const { isSupported, speak } = useSpeech()
</script>

<template>
  <!--
    @click.stop — модифікатор: зупиняє «спливання» події до батьків.
    Без нього клік по динаміку всередині картки ще й перевертав би її.
  -->
  <button
    v-if="isSupported"
    type="button"
    class="inline-grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
    :aria-label="`Озвучити: ${props.text}`"
    title="Озвучити"
    @click.stop="speak(props.text)"
  >
    🔊
  </button>
</template>
