<script setup lang="ts">
/**
 * Route entry-point for /tools/hora-extra.
 *
 * This file is intentionally thin — all logic lives in the feature module:
 *   app/features/tools/hora-extra/page.vue
 */
import HoraExtraPage from "~/features/tools/hora-extra/page.vue";

definePageMeta({ layout: false });

useSeoMeta({
  title: useI18n().t("horaExtra.seo.title"),
  description: useI18n().t("horaExtra.seo.description"),
  ogTitle: useI18n().t("horaExtra.seo.ogTitle"),
  ogDescription: useI18n().t("horaExtra.seo.ogDescription"),
  twitterCard: "summary_large_image",
});
</script>

<template>
  <HoraExtraPage />
</template>
