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
  </section>
</template>

<style scoped>
.ai-insight-surface {
  display: grid;
  gap: var(--space-3);
  align-items: start;
}
</style>
