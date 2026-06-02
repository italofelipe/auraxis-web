<script setup lang="ts">
import { computed } from "vue";
import { NButton, NSkeleton, NTag } from "naive-ui";

import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";
import { useSpendingPatternsQuery } from "~/features/spending-patterns/queries/use-spending-patterns-query";
import { buildTransactionInputs } from "~/features/spending-patterns/model/spending-patterns";
import type { SpendingPatternSeverityDto } from "~/features/spending-patterns/contracts/spending-patterns.dto";

const { t, n } = useI18n();

/**
 * @param offsetDays Days to subtract from today.
 * @returns ISO date string (YYYY-MM-DD).
 */
function isoDaysAgo(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

const transactionFilters = computed(() => ({
  type: "expense" as const,
  start_date: isoDaysAgo(90),
  end_date: isoDaysAgo(0),
}));

const transactionsQuery = useListTransactionsQuery(transactionFilters);

const transactionInputs = computed(() =>
  buildTransactionInputs(transactionsQuery.data.value ?? []),
);

const patternsQuery = useSpendingPatternsQuery(transactionInputs, {
  enabled: computed(() => transactionInputs.value.length > 0),
});

const patterns = computed(() => patternsQuery.data.value ?? []);

const isLoading = computed<boolean>(
  () => transactionsQuery.isLoading.value || patternsQuery.isLoading.value,
);
const isError = computed<boolean>(() => patternsQuery.isError.value);
const isEmpty = computed<boolean>(
  () => !isLoading.value && !isError.value && patterns.value.length === 0,
);

const SEVERITY_TAG: Record<SpendingPatternSeverityDto, "default" | "warning" | "error"> = {
  low: "default",
  medium: "warning",
  high: "error",
};

/**
 * @param value Numeric amount.
 * @returns BRL-formatted string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}
</script>

<template>
  <div>
    <div v-if="isLoading" data-testid="spending-insight-loading">
      <NSkeleton text :repeat="3" />
    </div>

    <!-- Soft unavailable state (e.g. backend not yet reachable / 503). -->
    <p v-else-if="isError" class="spending-insight-content__muted" data-testid="spending-insight-error">
      {{ t("spendingPatterns.unavailable") }}
    </p>

    <p v-else-if="isEmpty" class="spending-insight-content__muted" data-testid="spending-insight-empty">
      {{ t("spendingPatterns.empty") }}
    </p>

    <ul v-else class="spending-insight-content__list" data-testid="spending-insight-list">
      <li v-for="(pattern, i) in patterns" :key="i" class="spending-insight-content__item">
        <div class="spending-insight-content__item-head">
          <span class="spending-insight-content__item-title">{{ pattern.description }}</span>
          <NTag :type="SEVERITY_TAG[pattern.severity]" size="small" round>
            {{ t(`spendingPatterns.severity.${pattern.severity}`) }}
          </NTag>
        </div>
        <p class="spending-insight-content__item-meta">
          {{ pattern.frequency }} ·
          {{ t("spendingPatterns.average", { value: formatBrl(pattern.averageValue) }) }}
        </p>
        <p class="spending-insight-content__item-action">{{ pattern.suggestedAction }}</p>
        <NuxtLink to="/budgets">
          <NButton size="tiny" quaternary data-testid="spending-insight-budget-cta">
            {{ t("spendingPatterns.createBudget") }}
          </NButton>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.spending-insight-content__muted {
  margin: 0;
  color: var(--color-text-secondary);
}

.spending-insight-content__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.spending-insight-content__item + .spending-insight-content__item {
  border-top: 1px solid var(--color-outline-soft);
  padding-top: var(--space-3);
}

.spending-insight-content__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.spending-insight-content__item-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.spending-insight-content__item-meta {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.spending-insight-content__item-action {
  margin: var(--space-1) 0;
  color: var(--color-text-secondary);
}
</style>
