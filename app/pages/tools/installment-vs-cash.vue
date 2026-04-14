<script setup lang="ts">
/**
 * Route entry-point for /tools/installment-vs-cash.
 *
 * This file is intentionally thin — all logic lives in the feature module:
 *   app/features/tools/installment-vs-cash/page.vue
 */
import InstallmentVsCashPage from "~/features/tools/installment-vs-cash/page.vue";

definePageMeta({
  layout: false,
});

const { t } = useI18n();

useSeoMeta({
  title: t("pages.installmentVsCash.seo.title"),
  description: t("pages.installmentVsCash.seo.description"),
  ogTitle: t("pages.installmentVsCash.seo.ogTitle"),
  ogDescription: t("pages.installmentVsCash.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: t("pages.installmentVsCash.faq.q1"),
            acceptedAnswer: {
              "@type": "Answer",
              text: t("pages.installmentVsCash.faq.a1"),
            },
          },
          {
            "@type": "Question",
            name: t("pages.installmentVsCash.faq.q2"),
            acceptedAnswer: {
              "@type": "Answer",
              text: t("pages.installmentVsCash.faq.a2"),
            },
          },
        ],
      }),
    },
  ],
});
</script>

<template>
  <InstallmentVsCashPage />
</template>
