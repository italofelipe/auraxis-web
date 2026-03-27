<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Simulações",
  pageSubtitle: "Simule cenários financeiros",
});
</script>

<template>
  <div class="placeholder-page">
    <h1>Simulações</h1>
  </div>
</template>

<style scoped>
.placeholder-page { padding: var(--space-4); }
</style>
