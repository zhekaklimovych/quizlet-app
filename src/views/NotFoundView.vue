<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="py-16 text-center">
    <p class="text-6xl font-bold text-brand-500">404</p>
    <h1 class="mt-4 text-2xl font-bold">Сторінку не знайдено</h1>
    <RouterLink to="/" class="btn btn-primary mt-6">На головну</RouterLink>
  </section>
</template>
