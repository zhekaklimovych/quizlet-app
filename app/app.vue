<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Оголошує скрінрідерам зміну сторінки (у SPA браузер сам цього не робить) -->
    <NuxtRouteAnnouncer />
    <AppHeader />

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <!--
        NuxtPage — аналог RouterView: сюди підставляється сторінка з app/pages.
        page-key = шлях без ?query: при зміні шляху сторінка створюється заново
        (перехід «Редагування A» → «Новий набір» не залишить старих даних у формі),
        а при зміні лише ?q=... (пошук на головній) — ні.
      -->
      <NuxtPage :page-key="(route) => route.path" />
    </main>
  </div>
</template>
