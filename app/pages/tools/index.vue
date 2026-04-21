<script setup lang="ts">
import {
  getEnabledToolsByCategory,
  TOOL_CATEGORY_ORDER,
} from "~/features/tools/model/tools-catalog";

definePageMeta({
  pageTitle: "Ferramentas",
  pageSubtitle: "Calculadoras e utilitários financeiros",
});

const { t, locale } = useI18n();
const siteConfig = useSiteConfig();

const canonicalUrl = computed(() => {
  const base = siteConfig.url ?? "https://app.auraxis.com.br";
  const path = locale.value === "en" ? "/en/tools" : "/tools";
  return `${base}${path}`;
});

useSeoMeta({
  title: t("pages.tools.meta.title"),
  description: t("pages.tools.meta.description"),
  ogTitle: t("pages.tools.meta.title"),
  ogDescription: t("pages.tools.meta.description"),
  ogType: "website",
  ogUrl: canonicalUrl,
  twitterCard: "summary_large_image",
  twitterTitle: t("pages.tools.meta.title"),
  twitterDescription: t("pages.tools.meta.description"),
});

useHead({
  link: [{ rel: "canonical", href: canonicalUrl.value }],
  htmlAttrs: { lang: locale.value },
});

const groupedTools = computed(() => getEnabledToolsByCategory());
const hasTools = computed(() => groupedTools.value.length > 0);

void TOOL_CATEGORY_ORDER;
</script>

<template>
  <div class="tools-page">
    <header class="tools-page__header">
      <h1 class="tools-page__h1">{{ t("pages.tools.meta.h1") }}</h1>
      <p class="tools-page__lead">{{ t("pages.tools.meta.lead") }}</p>
    </header>

    <template v-if="hasTools">
      <section
        v-for="group in groupedTools"
        :key="group.category"
        class="tools-page__section"
        :aria-labelledby="`tools-category-${group.category}`"
      >
        <h2
          :id="`tools-category-${group.category}`"
          class="tools-page__category-title"
        >
          {{ t(`pages.tools.categories.${group.category}`) }}
        </h2>
        <div class="tools-page__grid">
          <ToolCatalogCard
            v-for="tool in group.tools"
            :key="tool.id"
            :tool="tool"
          />
        </div>
      </section>
    </template>
    <UiEmptyState
      v-else
      :title="t('pages.tools.empty')"
    />
  </div>
</template>

<style scoped>
.tools-page {
  padding: var(--space-4);
  max-width: 1100px;
  margin-inline: auto;
}

.tools-page__header {
  margin-bottom: var(--space-6);
  text-align: center;
}

.tools-page__h1 {
  font-size: var(--font-size-4xl);
  line-height: var(--line-height-heading-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.tools-page__lead {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 640px;
  margin-inline: auto;
}

.tools-page__section {
  margin-bottom: var(--space-7);
}

.tools-page__category-title {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-heading-md);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-outline-subtle);
}

.tools-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
</style>
