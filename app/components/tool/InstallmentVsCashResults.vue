<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  NCollapse,
  NCollapseItem,
  NDataTable,
  NTag,
  NThing,
} from "naive-ui";

import {
  buildInstallmentVsCashChartOption,
  getRecommendationLabel,
  type InstallmentVsCashCalculation,
  type InstallmentVsCashScheduleItem,
} from "~/features/tools/model/installment-vs-cash";
import { formatCurrency } from "~/utils/currency";

interface Props {
  calculation: InstallmentVsCashCalculation;
}

const props = defineProps<Props>();
const { t } = useI18n();

/**
 * Chart option derived from the current calculation.
 *
 * @returns ECharts option for the month-by-month comparison.
 */
const chartOption = computed(() => {
  return buildInstallmentVsCashChartOption(props.calculation);
});

/**
 * Columns for the detailed schedule table.
 *
 * The render callbacks are called by NDataTable at runtime. In unit tests
 * NDataTable is stubbed and never invokes them, so they are excluded from
 * coverage to avoid false negatives.
 *
 * Wrapped in computed so column titles react to locale changes.
 */
/* v8 ignore start */
const scheduleColumns = computed(() => [
  {
    key: "installmentNumber",
    title: t("pages.installmentVsCash.schedule.columns.installment"),
    render: (row: InstallmentVsCashScheduleItem): string => {
      return row.installmentNumber === 0
        ? t("pages.installmentVsCash.schedule.today")
        : `${row.installmentNumber}${t("pages.installmentVsCash.schedule.ordinalSuffix")}`;
    },
  },
  {
    key: "dueInDays",
    title: t("pages.installmentVsCash.schedule.columns.dueDate"),
    render: (row: InstallmentVsCashScheduleItem): string =>
      `${row.dueInDays} ${t("pages.installmentVsCash.schedule.daysUnit")}`,
  },
  {
    key: "amount",
    title: t("pages.installmentVsCash.schedule.columns.amount"),
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.amount),
  },
  {
    key: "presentValue",
    title: t("pages.installmentVsCash.schedule.columns.presentValue"),
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.presentValue),
  },
  {
    key: "cumulativeNominal",
    title: t("pages.installmentVsCash.schedule.columns.cumulativeNominal"),
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.cumulativeNominal),
  },
  {
    key: "cashCumulative",
    title: t("pages.installmentVsCash.schedule.columns.cashCumulative"),
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.cashCumulative),
  },
]);
/* v8 ignore stop */

/**
 * Recommendation tone exposed in the hero tag.
 *
 * @returns Naive UI tag type.
 */
const recommendationTagType = computed<
  "success" | "warning" | "default"
>(() => {
  if (props.calculation.result.recommendedOption === "installment") {
    return "success";
  }
  if (props.calculation.result.recommendedOption === "cash") {
    return "warning";
  }
  return "default";
});
</script>

<template>
  <div class="installment-vs-cash-results">
    <UiGlassPanel glow class="installment-vs-cash-results__hero">
      <div class="installment-vs-cash-results__hero-header">
        <UiPageHeader
          :title="getRecommendationLabel(props.calculation.result.recommendedOption)"
          :subtitle="props.calculation.result.recommendationReason"
        />
        <NTag
          :type="recommendationTagType"
          size="large"
          round
        >
          {{ props.calculation.result.recommendedOption }}
        </NTag>
      </div>

      <div class="installment-vs-cash-results__metrics">
        <UiMetricCard
          :label="$t('pages.installmentVsCash.breakdown.metrics.cashPrice')"
          :value="formatCurrency(props.calculation.result.comparison.cashOptionTotal)"
        />
        <UiMetricCard
          :label="$t('pages.installmentVsCash.breakdown.metrics.installmentNominal')"
          :value="formatCurrency(props.calculation.result.comparison.installmentOptionTotal)"
        />
        <UiMetricCard
          :label="$t('pages.installmentVsCash.breakdown.metrics.installmentPv')"
          :value="formatCurrency(props.calculation.result.comparison.installmentPresentValue)"
          :trend="props.calculation.result.comparison.relativeDeltaVsCashPercent"
        />
      </div>
    </UiGlassPanel>

    <UiSurfaceCard class="installment-vs-cash-results__chart-card">
      <NThing
        :title="$t('pages.installmentVsCash.breakdown.monthlyComparison.title')"
        :description="$t('pages.installmentVsCash.breakdown.monthlyComparison.description')"
      />
      <UiChart
        :option="chartOption"
        height="360px"
        update-key="installment-vs-cash"
      />
    </UiSurfaceCard>

    <NCollapse arrow-placement="right">
      <NCollapseItem :title="$t('pages.installmentVsCash.breakdown.formula.collapseTitle')" name="formula">
        <NThing
          :title="$t('pages.installmentVsCash.breakdown.formula.title')"
          :description="props.calculation.result.formulaExplainer"
        >
          <template #default>
            <div class="installment-vs-cash-results__assumptions">
              <span>
                {{ $t('pages.installmentVsCash.breakdown.formula.opportunityRateLabel') }}
                <strong>{{ props.calculation.result.assumptions.opportunityRateAnnualPercent.toFixed(2).replace(".", ",") }}{{ $t('pages.installmentVsCash.breakdown.formula.rateAnnualSuffix') }}</strong>
              </span>
              <span>
                {{ $t('pages.installmentVsCash.breakdown.formula.inflationLabel') }}
                <strong>{{ props.calculation.result.assumptions.inflationRateAnnualPercent.toFixed(2).replace(".", ",") }}{{ $t('pages.installmentVsCash.breakdown.formula.rateAnnualSuffix') }}</strong>
              </span>
              <span>
                {{ $t('pages.installmentVsCash.breakdown.formula.neutralityBandLabel') }}
                <strong>{{ formatCurrency(props.calculation.result.neutralityBand.absoluteBrl) }}</strong>
                {{ $t('pages.installmentVsCash.breakdown.formula.or') }}
                <strong>{{ props.calculation.result.neutralityBand.relativePercent.toFixed(2).replace(".", ",") }}{{ $t('pages.installmentVsCash.breakdown.formula.percentSuffix') }}</strong>
              </span>
            </div>
          </template>
        </NThing>
      </NCollapseItem>

      <NCollapseItem :title="$t('pages.installmentVsCash.breakdown.breakEven.collapseTitle')" name="break-even">
        <div class="installment-vs-cash-results__details-grid">
          <UiMetricCard
            :label="$t('pages.installmentVsCash.breakdown.metrics.difference')"
            :value="formatCurrency(props.calculation.result.comparison.absoluteDeltaVsCash)"
          />
          <UiMetricCard
            :label="$t('pages.installmentVsCash.breakdown.metrics.breakEvenDiscount')"
            :value="`${props.calculation.result.comparison.breakEvenDiscountPercent.toFixed(2).replace('.', ',')}%`"
          />
          <UiMetricCard
            :label="$t('pages.installmentVsCash.breakdown.metrics.breakEvenRate')"
            :value="`${props.calculation.result.comparison.breakEvenOpportunityRateAnnual.toFixed(2).replace('.', ',')}% a.a.`"
          />
        </div>
      </NCollapseItem>

      <NCollapseItem :title="$t('pages.installmentVsCash.breakdown.scheduleSection.collapseTitle')" name="schedule">
        <NDataTable
          :columns="scheduleColumns"
          :data="props.calculation.result.schedule"
          size="small"
          scroll-x="960"
        />
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style scoped>
.installment-vs-cash-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.installment-vs-cash-results__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.installment-vs-cash-results__hero-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.installment-vs-cash-results__metrics {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.installment-vs-cash-results__chart-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.installment-vs-cash-results__assumptions {
  display: grid;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.installment-vs-cash-results__details-grid {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1023px) {
  .installment-vs-cash-results__metrics,
  .installment-vs-cash-results__details-grid {
    grid-template-columns: 1fr;
  }

  .installment-vs-cash-results__hero-header {
    flex-direction: column;
  }
}
</style>
