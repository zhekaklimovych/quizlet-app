<script setup lang="ts">
import SpeakButton from './SpeakButton.vue'

defineProps<{
  front: string
  back: string
  flipped: boolean
}>()

const emit = defineEmits<{
  flip: []
}>()
</script>

<template>
  <!--
    3D-перевертання:
    - perspective на батьку задає «глибину» сцени
    - внутрішній блок обертається по осі Y на 180°
    - обидві сторони лежать одна на одній; backface-hidden ховає ту, що повернута «спиною»
    - зворотна сторона заздалегідь повернута на 180°, тож після обертання вона дивиться на нас

    Корінь — div з role="button", а не <button>: усередині є кнопка озвучування,
    а вкладати <button> у <button> HTML не дозволяє.
    tabindex="0" робить div доступним з клавіатури (Tab), @keydown.enter — перевертає.
    Пробіл обробляє глобальний слухач у FlashcardsView.
  -->
  <div
    role="button"
    tabindex="0"
    class="group block h-72 w-full cursor-pointer rounded-2xl perspective-distant focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:h-80"
    :aria-label="flipped ? 'Показати термін' : 'Показати визначення'"
    data-testid="flip-card"
    @click="emit('flip')"
    @keydown.enter.prevent="emit('flip')"
  >
    <div
      class="relative h-full w-full transition-transform duration-500 transform-3d"
      :class="{ 'rotate-y-180': flipped }"
    >
      <!-- pointer-events-none на невидимій стороні — щоб кліки не потрапляли в її кнопку -->
      <div
        class="absolute inset-0 grid place-items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-lg backface-hidden"
        :class="{ 'pointer-events-none': flipped }"
      >
        <span class="text-center text-3xl font-semibold break-words">{{ front }}</span>
        <span class="absolute bottom-4 text-xs text-slate-400">
          Термін · натисніть, щоб перевернути
        </span>
        <SpeakButton :text="front" class="absolute top-3 right-3" />
      </div>
      <div
        class="absolute inset-0 grid rotate-y-180 place-items-center rounded-2xl border border-brand-200 bg-brand-50 p-8 shadow-lg backface-hidden"
        :class="{ 'pointer-events-none': !flipped }"
      >
        <span class="text-center text-2xl break-words">{{ back }}</span>
        <span class="absolute bottom-4 text-xs text-brand-700/60">Визначення</span>
        <SpeakButton :text="back" class="absolute top-3 right-3" />
      </div>
    </div>
  </div>
</template>
