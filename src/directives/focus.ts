import type { Directive } from 'vue'

/**
 * Власна директива v-focus: ставить фокус на елемент, щойно він з'явився в DOM.
 * Використання: import { vFocus } from '@/directives/focus' → <button v-focus>
 * (у <script setup> будь-яка змінна з назвою vЩось автоматично стає директивою v-щось)
 */
export const vFocus: Directive<HTMLElement> = {
  mounted: (el) => el.focus(),
}
