<script setup lang="ts">
import LegalDocumentPage from "~/components/legal/LegalDocumentPage.vue";
import { termsOfUseDocument } from "~/features/legal/legal-documents";

definePageMeta({ layout: false });

const siteUrl = String(useRuntimeConfig().public.siteUrl ?? "https://app.auraxis.com.br").replace(
  /\/$/,
  "",
);

useSeoMeta({
  title: "Termos de Uso v2 | Auraxis",
  description:
    "Condições de uso do Auraxis, incluindo recursos de IA, privacidade, cookies e limites do produto.",
  robots: "index, follow",
});

useHead({
  link: [{ rel: "canonical", href: `${siteUrl}/terms` }],
});
</script>

<template>
  <LegalDocumentPage :document="termsOfUseDocument" />
</template>
