<script setup lang="ts">
// Cartões saiu de Settings para a área dedicada top-level (/credit-cards, #1012).
// Mantemos esta rota apenas como redirect permanente para não quebrar bookmarks.
definePageMeta({ middleware: ["authenticated"] });

await navigateTo("/credit-cards", { redirectCode: 301, replace: true });
</script>

<template>
  <div />
</template>
