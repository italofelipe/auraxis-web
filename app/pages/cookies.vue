<script setup lang="ts">
import LegalDocumentPage from "~/components/legal/LegalDocumentPage.vue";
import { cookiesPolicyDocument } from "~/features/legal/legal-documents";

definePageMeta({ layout: false });

useSeoMeta({
  title: "Política de Cookies | Auraxis",
  description: "Como o Auraxis usa cookies essenciais, preferências, analytics, observabilidade e marketing.",
  robots: "index, follow",
});
</script>

<template>
  <LegalDocumentPage :document="cookiesPolicyDocument" />
</template>
