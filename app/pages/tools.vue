<script setup lang="ts">
import { getEnabledTools } from "~/features/tools/model/tools-catalog";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Ferramentas",
  pageSubtitle: "Calculadoras e utilitários financeiros",
});

const { t } = useI18n();

useSeoMeta({
  title: t("pages.tools.meta.title"),
  description: t("pages.tools.meta.description"),
});

const enabledTools = computed(() => getEnabledTools());
</script>

<template>
  <div class="tools-page">
    <div v-if="enabledTools.length > 0" class="tools-page__grid">
      <ToolCatalogCard
        v-for="tool in enabledTools"
        :key="tool.id"
        :tool="tool"
      />
    </div>
    <UiEmptyState
      v-else
      :title="t('pages.tools.empty')"
    />
  </div>
</template>

<style scoped>
.tools-page {
  padding: var(--space-4);
  max-width: 960px;
  margin-inline: auto;
}

.tools-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
</style>
