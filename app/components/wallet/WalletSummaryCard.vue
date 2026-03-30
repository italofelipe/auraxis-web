<script setup lang="ts">
import { NCard, NSpace, NStatistic, NTag } from "naive-ui";

import { formatCurrency } from "~/utils/currency";
import type { WalletSummary } from "~/features/wallet/model/wallet";


interface Props {
  /** Wallet summary data to display. */
  summary: WalletSummary;
}

const props = defineProps<Props>();

/**
 * Formats a percentage variation value with a sign prefix for display.
 *
 * @param value Percentage value.
 * @returns Formatted string with sign prefix and two decimal places.
 */
const formatVariationPct = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Resolves the NaiveUI tag type for positive, neutral and negative variation.
 *
 * @param value Variation percentage.
 * @returns NaiveUI tag type string.
 */
const variationTagType = (value: number): "success" | "error" | "default" => {
  if (value > 0) { return "success"; }
  if (value < 0) { return "error"; }
  return "default";
};

/**
 * Returns the Unicode trend arrow character for positive or negative variation.
 *
 * @param value Variation percentage.
 * @returns Arrow character representing the trend direction.
 */
const trendArrow = (value: number): string => {
  if (value > 0) { return "↑"; }
  if (value < 0) { return "↓"; }
  return "→";
};

/**
 * Formats the lastUpdated ISO timestamp into a human-readable date label.
 *
 * @returns Localized date/time string or empty string when lastUpdated is missing.
 */
const lastUpdatedLabel = computed((): string => {
  if (!props.summary.lastUpdated) { return ""; }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(props.summary.lastUpdated));
});
</script>

<template>
  <NCard class="wallet-summary-card" :title="$t('wallet.summary.title')">
    <NSpace vertical :size="16">
      <div class="wallet-summary-card__primary">
        <NStatistic
          :label="$t('wallet.summary.totalPatrimony')"
          :value="formatCurrency(summary.totalPatrimony)"
          class="wallet-summary-card__total"
        />
        <NTag
          :type="variationTagType(summary.periodVariationPct)"
          size="medium"
          class="wallet-summary-card__variation-tag"
        >
          {{ trendArrow(summary.periodVariationPct) }}
          {{ formatVariationPct(summary.periodVariationPct) }}
          ({{ formatCurrency(summary.periodVariation) }})
        </NTag>
      </div>

      <NSpace :size="24" class="wallet-summary-card__secondary">
        <NStatistic
          :label="$t('wallet.summary.investedValue')"
          :value="formatCurrency(summary.investedValue)"
        />
        <NStatistic
          :label="$t('wallet.summary.currentValue')"
          :value="formatCurrency(summary.currentValue)"
        />
      </NSpace>

      <p v-if="lastUpdatedLabel" class="wallet-summary-card__updated">
        {{ $t('wallet.summary.updatedAt', { date: lastUpdatedLabel }) }}
      </p>
    </NSpace>
  </NCard>
</template>

<style scoped>
.wallet-summary-card__primary {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 12px);
  flex-wrap: wrap;
}

.wallet-summary-card__total {
  flex: 1 1 auto;
}

.wallet-summary-card__variation-tag {
  align-self: center;
}

.wallet-summary-card__secondary {
  flex-wrap: wrap;
}

.wallet-summary-card__updated {
  margin: 0;
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #888);
}
</style>
