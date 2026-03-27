<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Alertas",
  pageSubtitle: "Notificações e alertas do período",
});
</script>

<template>
  <div class="placeholder-page">
    <h1>Alertas</h1>
  </div>
</template>

<style scoped>
.placeholder-page { padding: var(--space-4); }
</style>
