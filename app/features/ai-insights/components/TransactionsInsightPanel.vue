<script setup lang="ts">
import { computed } from "vue";
import { NCollapse } from "naive-ui";

import AiInsightAccordionItem from "./AiInsightAccordionItem.vue";
import AiInsightSection from "./AiInsightSection.vue";
import type { InsightDimension } from "~/features/ai-insights/contracts/ai-insight";
import { splitTodayAndPast } from "~/features/ai-insights/model/insight-history";
import { mapAIInsightDto, type AIInsight } from "~/features/ai-insights/model/ai-insight";
import { useAIInsightsHistory } from "~/features/ai-insights/queries/use-ai-insights-history";

const props = withDefaults(
  defineProps<{
    dimension?: InsightDimension;
  }>(),
  { dimension: "transactions" },
);

const { t } = useI18n();

const historyQuery = useAIInsightsHistory();

/**
 * Resolves the local current date (YYYY-MM-DD) without UTC drift.
 *
 * @returns Today's date in the user's local timezone.
 */
const todayIso = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const split = computed(() =>
  splitTodayAndPast(historyQuery.data.value?.items ?? [], todayIso.value),
);

const todayInsight = computed<AIInsight | null>(() =>
  split.value.todayInsight ? mapAIInsightDto(split.value.todayInsight) : null,
);

const pastInsights = computed<AIInsight[]>(() => split.value.past.map(mapAIInsightDto));

const hasAnyInsight = computed(() =>
  Boolean(todayInsight.value) || pastInsights.value.length > 0,
);

const isInitialLoading = computed(
  () => historyQuery.isLoading.value && !historyQuery.data.value,
);
</script>

<template>
  <section class="transactions-insight-panel" aria-label="Histórico de insights de IA">
    <UiInlineError
      v-if="historyQuery.isError.value"
      :title="t('insights.history.loadErrorTitle')"
      :message="t('insights.history.loadErrorMessage')"
    />

    <AppSkeleton v-else-if="isInitialLoading" :rows="3" />

    <p v-else-if="!hasAnyInsight" class="transactions-insight-panel__empty">
      {{ t("insights.history.empty") }}
    </p>

    <template v-else>
      <AiInsightSection
        v-if="todayInsight"
        :insight="todayInsight.items"
        :dimension="props.dimension"
        :period-label="todayInsight.periodLabel"
        :is-stale="false"
        :model="todayInsight.model"
        :tokens-used="todayInsight.tokensUsed"
        :cost-usd="todayInsight.costUsd"
        data-testid="transactions-today-insight"
      />
      <p v-else class="transactions-insight-panel__no-today" data-testid="transactions-no-today">
        {{ t("insights.history.noTodayYet") }}
      </p>

      <div v-if="pastInsights.length > 0" class="transactions-insight-panel__history">
        <h3 class="transactions-insight-panel__history-title">
          {{ t("insights.history.pastTitle") }}
        </h3>
        <NCollapse data-testid="transactions-past-insights">
          <AiInsightAccordionItem
            v-for="item in pastInsights"
            :key="item.id"
            :item="item"
          />
        </NCollapse>
      </div>
    </template>
  </section>
</template>

<style scoped>
.transactions-insight-panel {
  display: grid;
  gap: var(--space-3);
  align-items: start;
}

.transactions-insight-panel__empty,
.transactions-insight-panel__no-today {
  margin: 0;
  padding: var(--space-3);
  border: 1px dashed var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-bg-elevated) 86%, transparent);
}

.transactions-insight-panel__history {
  display: grid;
  gap: var(--space-2);
}

.transactions-insight-panel__history-title {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
</style>
