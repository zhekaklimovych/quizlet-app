<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue'

/**
 * Модальне вікно на нативному <dialog>.
 * Браузер сам дає: затемнення фону, закриття по Esc, «пастку фокусу» всередині вікна.
 *
 *   <BaseModal v-model:open="isOpen" title="Заголовок"> вміст </BaseModal>
 */
defineProps<{
  title: string
}>()

const open = defineModel<boolean>('open', { required: true })

defineSlots<{
  default(): unknown
  /** Кнопки внизу вікна */
  footer?(): unknown
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

/** Синхронізуємо стан open (Vue) зі станом <dialog> (DOM) */
function sync(isOpen: boolean) {
  const el = dialog.value
  if (!el) return
  // showModal/close можуть бути відсутні в тестовому середовищі (jsdom) — тоді керуємо атрибутом
  if (isOpen && !el.open) {
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
  } else if (!isOpen && el.open) {
    if (typeof el.close === 'function') el.close()
    else el.removeAttribute('open')
  }
}

watch(open, sync)
onMounted(() => sync(open.value))

/** Клік по затемненому фону (поза вмістом) закриває вікно */
function onBackdropClick(e: MouseEvent) {
  if (e.target === dialog.value) open.value = false
}
</script>

<template>
  <!-- @close — подія <dialog>: спрацьовує і на Esc, тож оновлюємо open -->
  <dialog
    ref="dialog"
    class="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    :aria-label="title"
    @close="open = false"
    @click="onBackdropClick"
  >
    <!-- v-if: вміст рендериться лише коли вікно відкрите (і щоразу заново — свіжий стан) -->
    <div v-if="open" class="flex max-h-[85vh] flex-col">
      <header class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button
          type="button"
          class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Закрити"
          @click="open = false"
        >
          ✕
        </button>
      </header>
      <div class="overflow-y-auto px-6 py-4">
        <slot />
      </div>
      <footer
        v-if="$slots.footer"
        class="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4"
      >
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>
