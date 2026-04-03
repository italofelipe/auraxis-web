<script setup lang="ts">
import { h, type VNodeChild } from "vue";
import {
  NCard,
  NDataTable,
  NTag,
  NButton,
  NEmpty,
  type DataTableColumns,
} from "naive-ui";
import { formatCurrency } from "~/utils/currency";
import type { PortfolioTableProps } from "./PortfolioTable.types";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

const { t } = useI18n();

const props = defineProps<PortfolioTableProps>();

/**
 * Resolves the NaiveUI tag type for a given asset type.
 *
 * @param assetType - The asset type value from WalletEntryDto.
 * @returns NaiveUI tag type string.
 */
const assetTypeTagType = (
  assetType: WalletEntryDto["asset_type"],
): "info" | "success" | "warning" | "default" => {
  const map: Record<
    WalletEntryDto["asset_type"],
    "info" | "success" | "warning" | "default"
  > = {
    stock: "info",
    fii: "success",
    crypto: "warning",
    fixed_income: "default",
    other: "default",
  };
  return map[assetType];
};

/**
 * Returns a human-readable label for an asset type.
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
 * Formats a percentage value with a sign prefix for display.
 *
 * @param value - Percentage number.
 * @returns Formatted string like "+1.34%" or "-0.82%".
 */
const formatPercent = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Returns the NaiveUI tag type for a portfolio change-percent value.
 * @param changePercent Signed percentage; positive = gain, negative = loss.
 * @returns NaiveUI semantic color tag type.
 */
const changePercentTagType = (changePercent: number): "success" | "error" | "default" => {
  if (changePercent > 0) { return "success"; }
  if (changePercent < 0) { return "error"; }
  return "default";
};

const columns = computed((): DataTableColumns<WalletEntryDto> => [
  {
    title: t("portfolio.table.columns.asset"),
    key: "name",
    render(row): VNodeChild {
      return h("div", { class: "pt-name-cell" }, [
        h("span", { class: "pt-name-cell__name" }, row.name),
        row.ticker !== null
          ? h(
              NTag,
              { size: "small", bordered: false, class: "pt-name-cell__ticker" },
              { default: () => row.ticker },
            )
          : null,
      ]);
    },
  },
  {
    title: t("portfolio.table.columns.type"),
    key: "asset_type",
    render(row): VNodeChild {
      return h(
        NTag,
        { type: assetTypeTagType(row.asset_type), size: "small", bordered: false },
        { default: () => assetTypeLabel(row.asset_type) },
      );
    },
  },
  {
    title: t("portfolio.table.columns.currentValue"),
    key: "current_value",
    render(row): VNodeChild {
      return h(
        "span",
        { class: "pt-value-cell" },
        formatCurrency(row.current_value),
      );
    },
  },
  {
    title: t("portfolio.table.columns.cost"),
    key: "cost_basis",
    render(row): VNodeChild {
      return h(
        "span",
        {},
        row.cost_basis !== null ? formatCurrency(row.cost_basis) : "—",
      );
    },
  },
  {
    title: t("portfolio.table.columns.variation"),
    key: "change_percent",
    render(row): VNodeChild {
      if (row.change_percent === null) {
        return h("span", {}, "—");
      }
      const tagType = changePercentTagType(row.change_percent);
      return h(
        NTag,
        { type: tagType, size: "small", bordered: false },
        { default: () => formatPercent(row.change_percent!) },
      );
    },
  },
  {
    title: t("portfolio.table.columns.quantity"),
    key: "quantity",
    render(row): VNodeChild {
      if (row.quantity === null) { return h("span", {}, "—"); }
      return h("span", {}, String(row.quantity));
    },
  },
]);

const entryCount = computed(() => props.entries.length);
</script>

<template>
  <NCard :bordered="true" class="portfolio-table">
    <template #header>
      <div class="portfolio-table__header">
        <div class="portfolio-table__title-row">
          <span class="portfolio-table__title">{{ $t('portfolio.table.title') }}</span>
          <NTag size="small" type="default" :bordered="false">
            {{ entryCount }}
          </NTag>
        </div>
        <NButton size="small" secondary>{{ $t('portfolio.table.addAsset') }}</NButton>
      </div>
    </template>

    <NEmpty
      v-if="!props.loading && props.entries.length === 0"
      :description="$t('portfolio.table.empty')"
      class="portfolio-table__empty"
    />

    <NDataTable
      v-else
      :columns="columns"
      :data="props.entries"
      :loading="props.loading"
      :bordered="false"
      :single-line="false"
      size="small"
      class="portfolio-table__data-table"
    />
  </NCard>
</template>

<style scoped>
.portfolio-table__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.portfolio-table__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.portfolio-table__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.portfolio-table__empty {
  padding: var(--space-4) 0;
}

:deep(.pt-name-cell) {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

:deep(.pt-name-cell__name) {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

:deep(.pt-value-cell) {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
</style>
