<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Carteira",
  pageSubtitle: "Seus ativos e posições",
});
</script>

<template>
  <div class="placeholder-page">
    <h1>Carteira</h1>
  </div>
</template>

<style scoped>
.placeholder-page { padding: var(--space-4); }
</style>
