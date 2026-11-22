<script setup lang="ts">
// Назва маршруту (для посилань { name: ... }); props: true — параметри URL приходять як props
definePageMeta({ name: 'not-found' })
</script>

<template>
  <section class="py-16 text-center">
    <p class="text-6xl font-bold text-brand-500">404</p>
    <h1 class="mt-4 text-2xl font-bold">Сторінку не знайдено</h1>
    <NuxtLink to="/" class="btn btn-primary mt-6">На головну</NuxtLink>
  </section>
</template>
