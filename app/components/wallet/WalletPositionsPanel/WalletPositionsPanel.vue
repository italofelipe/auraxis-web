<script setup lang="ts">
import { NCard, NTag, NEmpty } from "naive-ui";
import { formatCurrency } from "~/utils/currency";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";
import type { WalletPositionsPanelProps } from "./WalletPositionsPanel.types";

const { t } = useI18n();

const props = defineProps<WalletPositionsPanelProps>();

/**
 * Maps an asset_type value to a NaiveUI NTag type.
 *
 * @param assetType - The asset type value from WalletEntryDto.
 * @returns NaiveUI tag type string.
 */
const tagType = (
  assetType: WalletEntryDto["asset_type"],
): "info" | "success" | "warning" | "default" => {
  const map: Record<WalletEntryDto["asset_type"], "info" | "success" | "warning" | "default"> = {
    stock: "info",
    fii: "success",
    crypto: "warning",
    fixed_income: "default",
    other: "default",
  };
  return map[assetType];
};

/**
 * Returns a translated label for an asset type.
 *
 * @param assetType - The asset type value.
 * @returns Localised label string.
 */
const assetTypeLabel = (assetType: WalletEntryDto["asset_type"]): string => {
  const map: Record<WalletEntryDto["asset_type"], string> = {
    stock: t("wallet.assetType.stock"),
    fii: t("wallet.assetType.fii"),
    crypto: t("wallet.assetType.crypto"),
    fixed_income: t("wallet.assetType.fixedIncome"),
    other: t("wallet.assetType.other"),
  };
  return map[assetType];
};

/**
 * Formats a change percentage with sign for display.
 *
 * @param value - Percentage number.
 * @returns Formatted string like "+1.34%" or "-0.82%".
 */
const formatPercent = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Returns the CSS color variable for a positive, neutral or negative percent.
 *
 * @param value - Percentage value or null.
 * @returns CSS color string.
 */
const changeColor = (value: number | null): string => {
  if (value === null) { return "var(--color-text-muted)"; }
  if (value > 0) { return "var(--color-success, #18a058)"; }
  if (value < 0) { return "var(--color-error, #d03050)"; }
  return "var(--color-text-primary)";
};
</script>

<template>
  <div class="wallet-positions-panel">
    <div class="wallet-positions-panel__header">
      <span class="wallet-positions-panel__title">{{ $t('wallet.positions.title') }}</span>
      <NTag v-if="!props.isLoading" size="small" :bordered="false">
        {{ props.entries.length }}
      </NTag>
    </div>

    <UiPageLoader v-if="props.isLoading" :rows="3" />

    <NEmpty
      v-else-if="props.entries.length === 0"
      :description="$t('wallet.positions.empty')"
      class="wallet-positions-panel__empty"
    />

    <div v-else class="wallet-positions-panel__grid">
      <NCard
        v-for="entry in props.entries"
        :key="entry.id"
        :bordered="true"
        size="small"
        class="wallet-positions-panel__card"
      >
        <div class="wpp-card__top">
          <div class="wpp-card__name-row">
            <span class="wpp-card__name">{{ entry.name }}</span>
            <NTag v-if="entry.ticker" size="small" :bordered="false" class="wpp-card__ticker">
              {{ entry.ticker }}
            </NTag>
          </div>
          <NTag :type="tagType(entry.asset_type)" size="small" :bordered="false">
            {{ assetTypeLabel(entry.asset_type) }}
          </NTag>
        </div>

        <div class="wpp-card__bottom">
          <span class="wpp-card__value">{{ formatCurrency(entry.current_value) }}</span>
          <span
            class="wpp-card__change"
            :style="{ color: changeColor(entry.change_percent) }"
          >
            {{ entry.change_percent !== null ? formatPercent(entry.change_percent) : "—" }}
          </span>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.wallet-positions-panel__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.wallet-positions-panel__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.wallet-positions-panel__empty {
  padding: var(--space-4) 0;
}

.wallet-positions-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.wpp-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.wpp-card__name-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.wpp-card__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.wpp-card__ticker {
  font-size: var(--font-size-xs, 0.75rem);
}

.wpp-card__bottom {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-1);
}

.wpp-card__value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.wpp-card__change {
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold);
}
</style>
