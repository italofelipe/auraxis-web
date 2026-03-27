<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Lançamentos Compartilhados",
  pageSubtitle: "Entradas compartilhadas com você",
});
</script>

<template>
  <div class="placeholder-page">
    <h1>Lançamentos Compartilhados</h1>
  </div>
</template>

<style scoped>
.placeholder-page { padding: var(--space-4); }
</style>
