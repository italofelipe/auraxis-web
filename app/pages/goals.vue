<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Metas",
  pageSubtitle: "Acompanhe suas metas financeiras",
});
</script>

<template>
  <div class="placeholder-page">
    <h1>Metas</h1>
  </div>
</template>

<style scoped>
.placeholder-page { padding: var(--space-4); }
</style>
