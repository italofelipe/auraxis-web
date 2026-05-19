<script setup lang="ts">
import LegalDocumentPage from "~/components/legal/LegalDocumentPage.vue";
import { privacyPolicyDocument } from "~/features/legal/legal-documents";

definePageMeta({ layout: false });

useSeoMeta({
  title: "Política de Privacidade v2 | Auraxis",
  description: "Como o Auraxis trata dados pessoais, cookies, IA, segurança e direitos LGPD.",
  robots: "index, follow",
});
</script>

<template>
  <LegalDocumentPage :document="privacyPolicyDocument" />
</template>
