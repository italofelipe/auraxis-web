<script setup lang="ts">
import { NCard, NSpace, NStatistic } from "naive-ui";

import { formatCurrency } from "~/utils/currency";
import type { RevenueSummary } from "~/features/receivables/model/receivables";

interface Props {
  /** Revenue summary data to display. */
  summary: RevenueSummary;
}

defineProps<Props>();

</script>

<template>
  <NCard class="revenue-summary-card" :title="$t('receivable.summary.title')">
    <NSpace :size="24" class="revenue-summary-card__stats">
      <NStatistic
        :label="$t('receivable.summary.expectedTotal')"
        :value="formatCurrency(summary.expectedTotal)"
        class="revenue-summary-card__stat"
      />
      <NStatistic
        :label="$t('receivable.summary.receivedTotal')"
        :value="formatCurrency(summary.receivedTotal)"
        class="revenue-summary-card__stat revenue-summary-card__stat--received"
      />
      <NStatistic
        :label="$t('receivable.summary.pendingTotal')"
        :value="formatCurrency(summary.pendingTotal)"
        class="revenue-summary-card__stat revenue-summary-card__stat--pending"
      />
    </NSpace>
  </NCard>
</template>

<style scoped>
.revenue-summary-card__stats {
  flex-wrap: wrap;
}

.revenue-summary-card__stat--received :deep(.n-statistic-value) {
  color: var(--color-success, #18a058);
}

.revenue-summary-card__stat--pending :deep(.n-statistic-value) {
  color: var(--color-warning, #f0a020);
}
</style>
