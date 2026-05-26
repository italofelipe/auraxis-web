<script setup lang="ts">
definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
});

await navigateTo("/dashboard", { replace: true });
</script>

<template>
  <span class="sr-only">Redirecionando para o dashboard...</span>
</template>
