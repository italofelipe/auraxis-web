<script setup lang="ts">
import LegalDocumentPage from "~/components/legal/LegalDocumentPage.vue";
import { privacyPolicyDocument } from "~/features/legal/legal-documents";

definePageMeta({ layout: false });

const siteUrl = String(useRuntimeConfig().public.siteUrl ?? "https://app.auraxis.com.br").replace(
  /\/$/,
  "",
);

useSeoMeta({
  title: "Política de Privacidade v2",
  description: "Como o Auraxis trata dados pessoais, cookies, IA, segurança e direitos LGPD.",
  robots: "index, follow",
});

useHead({
  link: [{ rel: "canonical", href: `${siteUrl}/privacy` }],
});
</script>

<template>
  <LegalDocumentPage :document="privacyPolicyDocument" />
</template>
