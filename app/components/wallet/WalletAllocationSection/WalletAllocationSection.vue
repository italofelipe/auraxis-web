<script setup lang="ts">
import { NCard, NProgress, NEmpty } from "naive-ui";
import { formatCurrency } from "~/utils/currency";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";
import type { WalletAllocationSectionProps } from "./WalletAllocationSection.types";

const { t } = useI18n();

const props = defineProps<WalletAllocationSectionProps>();

/** Internal representation of a single asset-type allocation row. */
interface AllocationRow {
  readonly assetType: WalletEntryDto["asset_type"];
  readonly label: string;
  readonly count: number;
  readonly totalValue: number;
  readonly percentage: number;
}

/**
 * Returns a translated label for an asset type.
 *
 * @param assetType - The asset type value.
 * @returns Localised label string.
 */
const assetTypeLabel = (assetType: WalletEntryDto["asset_type"]): string => {
  const map: Record<WalletEntryDto["asset_type"], string> = {
    stock: t("wallet.assetTypeAllocation.stock"),
    fii: t("wallet.assetTypeAllocation.fii"),
    crypto: t("wallet.assetTypeAllocation.crypto"),
    fixed_income: t("wallet.assetTypeAllocation.fixedIncome"),
    other: t("wallet.assetTypeAllocation.other"),
  };
  return map[assetType];
};

/**
 * Computes allocation breakdown from the entries array.
 *
 * Groups entries by asset_type, sums their current_value and derives
 * the percentage share of each group against the grand total.
 *
 * @returns Sorted array of AllocationRow (descending by totalValue).
 */
const allocations = computed((): AllocationRow[] => {
  if (props.entries.length === 0) { return []; }

  const grandTotal = props.entries.reduce((acc, e) => acc + e.current_value, 0);

  const grouped = new Map<WalletEntryDto["asset_type"], { count: number; totalValue: number }>();

  for (const entry of props.entries) {
    const existing = grouped.get(entry.asset_type);
    if (existing) {
      existing.count += 1;
      existing.totalValue += entry.current_value;
    } else {
      grouped.set(entry.asset_type, { count: 1, totalValue: entry.current_value });
    }
  }

  const rows: AllocationRow[] = [];

  for (const [assetType, { count, totalValue }] of grouped.entries()) {
    rows.push({
      assetType,
      label: assetTypeLabel(assetType),
      count,
      totalValue,
      percentage: grandTotal > 0 ? (totalValue / grandTotal) * 100 : 0,
    });
  }

  return rows.sort((a, b) => b.totalValue - a.totalValue);
});

/**
 * Returns a localised label for the asset count.
 *
 * @param count - The number of assets in the allocation group.
 * @returns Singular or plural label string with the count.
 */
const assetCountLabel = (count: number): string => {
  return count === 1
    ? t("wallet.allocation.assetCount", { n: count })
    : t("wallet.allocation.assetCountPlural", { n: count });
};
</script>

<template>
  <NCard :bordered="true" class="wallet-allocation-section">
    <template #header>
      <span class="wallet-allocation-section__title">{{ $t('wallet.allocation.title') }}</span>
    </template>

    <UiPageLoader v-if="props.isLoading" :rows="3" />

    <NEmpty
      v-else-if="allocations.length === 0"
      :description="$t('wallet.allocation.empty')"
      class="wallet-allocation-section__empty"
    />

    <div v-else class="wallet-allocation-section__list">
      <div
        v-for="row in allocations"
        :key="row.assetType"
        class="wallet-allocation-section__row"
      >
        <div class="was-row__meta">
          <span class="was-row__label">{{ row.label }}</span>
          <div class="was-row__stats">
            <span class="was-row__count">{{ assetCountLabel(row.count) }}</span>
            <span class="was-row__value">{{ formatCurrency(row.totalValue) }}</span>
            <span class="was-row__pct">{{ row.percentage.toFixed(1) }}%</span>
          </div>
        </div>
        <NProgress
          type="line"
          :percentage="row.percentage"
          :show-indicator="false"
          :height="6"
          class="was-row__progress"
        />
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.wallet-allocation-section__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.wallet-allocation-section__empty {
  padding: var(--space-4) 0;
}

.wallet-allocation-section__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.was-row__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
  gap: var(--space-2);
}

.was-row__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.was-row__stats {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.was-row__count {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-muted);
}

.was-row__value {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-secondary, var(--color-text-primary));
}

.was-row__pct {
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  min-width: 40px;
  text-align: right;
}
</style>
