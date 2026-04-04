<script setup lang="ts">
import { computed } from "vue";
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
 */
/* v8 ignore start */
const scheduleColumns = [
  {
    key: "installmentNumber",
    title: "Parcela",
    render: (row: InstallmentVsCashScheduleItem): string => {
      return row.installmentNumber === 0 ? "Hoje" : `${row.installmentNumber}ª`;
    },
  },
  {
    key: "dueInDays",
    title: "Vence em",
    render: (row: InstallmentVsCashScheduleItem): string => `${row.dueInDays} dias`,
  },
  {
    key: "amount",
    title: "Valor",
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.amount),
  },
  {
    key: "presentValue",
    title: "Valor presente",
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.presentValue),
  },
  {
    key: "cumulativeNominal",
    title: "Acumulado nominal",
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.cumulativeNominal),
  },
  {
    key: "cashCumulative",
    title: "Acumulado à vista",
    render: (row: InstallmentVsCashScheduleItem): string => formatCurrency(row.cashCumulative),
  },
];
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
          label="Preço à vista"
          :value="formatCurrency(props.calculation.result.comparison.cashOptionTotal)"
        />
        <UiMetricCard
          label="Parcelado nominal"
          :value="formatCurrency(props.calculation.result.comparison.installmentOptionTotal)"
        />
        <UiMetricCard
          label="Parcelado em valor presente"
          :value="formatCurrency(props.calculation.result.comparison.installmentPresentValue)"
          :trend="props.calculation.result.comparison.relativeDeltaVsCashPercent"
        />
      </div>
    </UiGlassPanel>

    <UiSurfaceCard class="installment-vs-cash-results__chart-card">
      <NThing
        title="Comparação mês a mês"
        description="Veja o desembolso acumulado e o valor presente do parcelamento ao longo do tempo."
      />
      <UiChart
        :option="chartOption"
        height="360px"
        update-key="installment-vs-cash"
      />
    </UiSurfaceCard>

    <NCollapse arrow-placement="right">
      <NCollapseItem title="Entenda o cálculo" name="formula">
        <NThing
          title="Fórmula e premissas"
          :description="props.calculation.result.formulaExplainer"
        >
          <template #default>
            <div class="installment-vs-cash-results__assumptions">
              <span>
                Taxa de oportunidade:
                <strong>{{ props.calculation.result.assumptions.opportunityRateAnnualPercent.toFixed(2).replace(".", ",") }}% a.a.</strong>
              </span>
              <span>
                Inflação:
                <strong>{{ props.calculation.result.assumptions.inflationRateAnnualPercent.toFixed(2).replace(".", ",") }}% a.a.</strong>
              </span>
              <span>
                Faixa de neutralidade:
                <strong>{{ formatCurrency(props.calculation.result.neutralityBand.absoluteBrl) }}</strong>
                ou
                <strong>{{ props.calculation.result.neutralityBand.relativePercent.toFixed(2).replace(".", ",") }}%</strong>
              </span>
            </div>
          </template>
        </NThing>
      </NCollapseItem>

      <NCollapseItem title="Break-even e comparação detalhada" name="break-even">
        <div class="installment-vs-cash-results__details-grid">
          <UiMetricCard
            label="Diferença vs à vista"
            :value="formatCurrency(props.calculation.result.comparison.absoluteDeltaVsCash)"
          />
          <UiMetricCard
            label="Desconto à vista para empatar"
            :value="`${props.calculation.result.comparison.breakEvenDiscountPercent.toFixed(2).replace('.', ',')}%`"
          />
          <UiMetricCard
            label="Taxa mínima para o parcelado empatar"
            :value="`${props.calculation.result.comparison.breakEvenOpportunityRateAnnual.toFixed(2).replace('.', ',')}% a.a.`"
          />
        </div>
      </NCollapseItem>

      <NCollapseItem title="Cronograma mês a mês" name="schedule">
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
