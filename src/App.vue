<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <!--
        v-slot дає доступ до компонента поточної сторінки.
        :key="route.path" — при зміні шляху сторінка створюється заново
        (наприклад, перехід з «Редагування A» на «Новий набір» не залишить старих даних у формі).
      -->
      <RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" />
      </RouterView>
    </main>
  </div>
</template>
