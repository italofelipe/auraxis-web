<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import AiInsightButton from "./AiInsightButton.vue";
import AiInsightSection from "./AiInsightSection.vue";
import {
  filterInsightItemsByDimension,
  getInsightSurfaceConfig,
} from "~/features/ai-insights/composables/use-insights-by-dimension";
import { useAIInsights } from "~/features/ai-insights/composables/useAIInsights";
import type {
  InsightDimension,
  InsightItem,
  InsightSourceSurface,
} from "~/features/ai-insights/contracts/ai-insight";

const props = defineProps<{
  dimension?: InsightDimension;
  sourceSurface?: InsightSourceSurface;
}>();

const route = useRoute();
const aiInsights = useAIInsights();

const sourceSurfaceByDimension: Partial<Record<InsightDimension, InsightSourceSurface>> = {
  transactions: "transactions",
  credit_cards: "credit_cards",
  goals: "goals",
  budgets: "budgets",
  wallet: "wallet",
};

const surfaceConfig = computed(() => getInsightSurfaceConfig(route.path));
const resolvedDimension = computed(() => props.dimension ?? surfaceConfig.value.dimension);
const resolvedSourceSurface = computed(
  () =>
    props.sourceSurface ??
    (resolvedDimension.value ? sourceSurfaceByDimension[resolvedDimension.value] : undefined) ??
    surfaceConfig.value.sourceSurface,
);

const visibleInsight = computed<InsightItem[] | null>(() => {
  const items = aiInsights.currentInsight.value;
  if (!items) {
    return null;
  }

  return resolvedDimension.value
    ? filterInsightItemsByDimension(items, resolvedDimension.value)
    : items;
});

const hasGeneratedInsight = computed(() => Boolean(aiInsights.currentInsight.value?.length));
const shouldShowContextualEmptyState = computed(() =>
  Boolean(resolvedDimension.value && hasGeneratedInsight.value && !visibleInsight.value?.length),
);
</script>

<template>
  <section class="ai-insight-surface" aria-label="Insights de IA">
    <AiInsightButton :source-surface="resolvedSourceSurface" />
    <AiInsightSection
      v-if="visibleInsight?.length"
      :insight="visibleInsight"
      :period-label="aiInsights.insightPeriodLabel.value"
      :is-stale="aiInsights.isStale.value"
      :model="aiInsights.insightModel.value"
      :tokens-used="aiInsights.tokensUsed.value"
      :cost-usd="aiInsights.costUsd.value"
    />
    <p v-else-if="shouldShowContextualEmptyState" class="ai-insight-surface__empty">
      Nenhum insight específico para esta área no período atual. A visão completa continua
      disponível em Insights.
    </p>
  </section>
</template>

<style scoped>
.ai-insight-surface {
  display: grid;
  gap: var(--space-3);
  align-items: start;
}

.ai-insight-surface__empty {
  margin: 0;
  padding: var(--space-3);
  border: 1px dashed var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-bg-elevated) 86%, transparent);
}
</style>
