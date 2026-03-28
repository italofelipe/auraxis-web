<script setup lang="ts">
import { NCard, NStatistic, NSkeleton } from "naive-ui";
import { formatCurrency } from "~/utils/currency";
import type { PortfolioSummaryBarProps } from "./PortfolioSummaryBar.types";

const props = defineProps<PortfolioSummaryBarProps>();

/**
 * Formats a percentage value with a sign prefix for display.
 *
 * @param value - Percentage number.
 * @returns Formatted string like "+15.81%" or "-2.30%".
 */
const formatPercent = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Resolves the CSS color variable for a positive, neutral or negative percent value.
 *
 * @param value - Percentage value or null.
 * @returns CSS color string.
 */
const percentColor = (value: number | null): string => {
  if (value === null) {return "var(--color-text-muted)";}
  if (value > 0) {return "var(--color-success, #18a058)";}
  if (value < 0) {return "var(--color-error, #d03050)";}
  return "var(--color-text-primary)";
};
</script>

<template>
  <NCard :bordered="true" class="portfolio-summary-bar">
    <template v-if="props.loading">
      <div class="portfolio-summary-bar__grid">
        <NSkeleton
          v-for="i in 4"
          :key="i"
          height="56px"
          :sharp="false"
          class="portfolio-summary-bar__skeleton"
        />
      </div>
    </template>

    <template v-else>
      <div class="portfolio-summary-bar__grid">
        <NStatistic
          label="Patrimônio total"
          :value="props.summary ? formatCurrency(props.summary.total_value) : 'N/A'"
          class="portfolio-summary-bar__stat"
        />

        <NStatistic
          label="Custo total"
          :value="props.summary ? formatCurrency(props.summary.total_cost) : 'N/A'"
          class="portfolio-summary-bar__stat"
        />

        <div class="portfolio-summary-bar__stat">
          <NStatistic
            label="Retorno total"
            :value="props.summary?.total_return_percent != null
              ? formatPercent(props.summary.total_return_percent)
              : 'N/A'"
            :value-style="{
              color: percentColor(props.summary?.total_return_percent ?? null),
            }"
          />
        </div>

        <div class="portfolio-summary-bar__stat">
          <NStatistic
            label="Variação do dia"
            :value="props.summary?.day_change_percent != null
              ? formatPercent(props.summary.day_change_percent)
              : 'N/A'"
            :value-style="{
              color: percentColor(props.summary?.day_change_percent ?? null),
            }"
          />
        </div>
      </div>
    </template>
  </NCard>
</template>

<style scoped>
.portfolio-summary-bar__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
}

.portfolio-summary-bar__skeleton {
  width: 100%;
}
</style>
