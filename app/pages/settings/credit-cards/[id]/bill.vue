<script setup lang="ts">
// A fatura passou a viver no detalhe do cartão na área dedicada (/credit-cards/[id], #1012).
// Redirect permanente preserva links antigos para a fatura.
definePageMeta({ middleware: ["authenticated"] });

const route = useRoute();
await navigateTo(`/credit-cards/${String(route.params.id ?? "")}`, {
  redirectCode: 301,
  replace: true,
});
</script>

<template>
  <div />
</template>
