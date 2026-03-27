<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Ferramentas",
  pageSubtitle: "Calculadoras e utilitários financeiros",
});
</script>

<template>
  <div class="placeholder-page">
    <h1>Ferramentas</h1>
  </div>
</template>

<style scoped>
.placeholder-page { padding: var(--space-4); }
</style>
