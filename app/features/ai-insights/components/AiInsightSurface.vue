<script setup lang="ts">
import { computed } from "vue";

import AiInsightButton from "./AiInsightButton.vue";
import AiInsightSection from "./AiInsightSection.vue";
import { filterInsightItemsByDimension } from "~/features/ai-insights/composables/use-insights-by-dimension";
import { useAIInsights } from "~/features/ai-insights/composables/useAIInsights";
import type { InsightDimension, InsightItem } from "~/features/ai-insights/contracts/ai-insight";

const props = defineProps<{
  dimension?: InsightDimension;
}>();

const aiInsights = useAIInsights();
const visibleInsight = computed<InsightItem[] | null>(() => {
  const items = aiInsights.currentInsight.value;
  if (!items) {
    return null;
  }

  return props.dimension ? filterInsightItemsByDimension(items, props.dimension) : items;
});

const hasGeneratedInsight = computed(() => Boolean(aiInsights.currentInsight.value?.length));
const shouldShowContextualEmptyState = computed(() =>
  Boolean(props.dimension && hasGeneratedInsight.value && !visibleInsight.value?.length),
);
</script>

<template>
  <section class="ai-insight-surface" aria-label="Insights de IA">
    <AiInsightButton />
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
