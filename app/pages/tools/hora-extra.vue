<script setup lang="ts">
/**
 * Route entry-point for /tools/hora-extra.
 *
 * This file is intentionally thin — all logic lives in the feature module:
 *   app/features/tools/hora-extra/page.vue
 */
import HoraExtraPage from "~/features/tools/hora-extra/page.vue";
import { useToolPageStructuredData } from "~/features/tools/composables/useToolPageStructuredData";
import { HORA_EXTRA_FAQS } from "~/features/tools/content/hora-extra-faqs";

definePageMeta({ layout: false });

const { t } = useI18n();

useSeoMeta({
  title: t("horaExtra.seo.title"),
  description: t("horaExtra.seo.description"),
  ogTitle: t("horaExtra.seo.ogTitle"),
  ogDescription: t("horaExtra.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

useToolPageStructuredData({
  slug: "hora-extra",
  name: t("horaExtra.seo.title"),
  description: t("horaExtra.seo.description"),
  faqs: HORA_EXTRA_FAQS,
});
</script>

<template>
  <HoraExtraPage />
</template>
