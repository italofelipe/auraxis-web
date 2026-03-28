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
  <NCard class="revenue-summary-card" title="Resumo de Receitas">
    <NSpace :size="24" class="revenue-summary-card__stats">
      <NStatistic
        label="Total Esperado"
        :value="formatCurrency(summary.expectedTotal)"
        class="revenue-summary-card__stat"
      />
      <NStatistic
        label="Total Recebido"
        :value="formatCurrency(summary.receivedTotal)"
        class="revenue-summary-card__stat revenue-summary-card__stat--received"
      />
      <NStatistic
        label="Total Pendente"
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
