<script setup lang="ts">
/**
 * Route entry-point for /tools/thirteenth-salary.
 *
 * This file is intentionally thin — all logic lives in the feature module:
 *   app/features/tools/thirteenth-salary/page.vue
 */
import ThirteenthSalaryPage from "~/features/tools/thirteenth-salary/page.vue";

definePageMeta({ layout: false });

useSeoMeta({
  title: useI18n().t("thirteenthSalary.seo.title"),
  description: useI18n().t("thirteenthSalary.seo.description"),
  ogTitle: useI18n().t("thirteenthSalary.seo.ogTitle"),
  ogDescription: useI18n().t("thirteenthSalary.seo.ogDescription"),
  twitterCard: "summary_large_image",
});
</script>

<template>
  <ThirteenthSalaryPage />
</template>
