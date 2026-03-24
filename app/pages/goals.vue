<script setup lang="ts">
import { Target } from "lucide-vue-next";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Metas",
  pageSubtitle: "Acompanhe e gerencie suas metas financeiras",
});
</script>

<template>
  <div class="goals-page">
    <UiEmptyState
      :icon="Target"
      :title="t('pages.goals.emptyTitle')"
      :description="t('pages.goals.emptyDescription')"
    />
  </div>
</template>

<style scoped>
.goals-page {
  display: grid;
  gap: var(--space-4);
}
</style>
