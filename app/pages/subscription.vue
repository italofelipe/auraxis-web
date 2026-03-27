<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Assinatura",
  pageSubtitle: "Gerencie seu plano",
});
</script>

<template>
  <div class="placeholder-page">
    <h1>Assinatura</h1>
  </div>
</template>

<style scoped>
.placeholder-page { padding: var(--space-4); }
</style>
