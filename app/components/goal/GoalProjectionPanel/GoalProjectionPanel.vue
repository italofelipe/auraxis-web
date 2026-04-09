<script setup lang="ts">
import { NSlider, NStatistic, NTag, NAlert } from "naive-ui";
import { computed, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import type { GoalProjectionPanelProps } from "./GoalProjectionPanel.types";
import { useGoalProjectionQuery } from "~/features/goals/queries/use-goal-projection-query";
import { formatCurrency } from "~/utils/currency";

const { t } = useI18n();

const props = defineProps<GoalProjectionPanelProps>();

const goalIdRef = ref<string | null>(props.goalId);

watch(
  () => props.goalId,
  (val) => {
    goalIdRef.value = val;
  },
);

const { data, isLoading, isError } = useGoalProjectionQuery(goalIdRef);

/**
 * Interactive monthly contribution driven by the slider.
 * Initialised from the API value once data loads.
 */
const contribution = ref<number>(0);
const contributionInitialised = ref<boolean>(false);

watch(
  data,
  (val) => {
    if (val && !contributionInitialised.value) {
      contribution.value = parseFloat(val.projection.monthly_contribution);
      contributionInitialised.value = true;
    }
  },
  { immediate: true },
);

/** Portfolio blended monthly return rate from API (e.g. 0.009489). */
const monthlyRate = computed((): number => {
  if (!data.value) { return 0; }
  return parseFloat(data.value.projection.portfolio_monthly_return_rate);
});

/** Annualised return rate as a percentage for display (e.g. "12.00"). */
const annualRatePct = computed((): string => {
  if (!data.value) { return "—"; }
  return `${data.value.projection.portfolio_annual_return_rate_pct}%`;
});

/** Current accumulated amount as a number. */
const currentAmount = computed((): number => {
  if (!data.value) { return 0; }
  return parseFloat(data.value.projection.current_amount);
});

/** Target amount as a number. */
const targetAmount = computed((): number => {
  if (!data.value) { return 0; }
  return parseFloat(data.value.projection.target_amount);
});

/**
 * Computes the number of months to reach the target given a contribution and
 * the portfolio monthly return rate from the API.
 *
 * Uses the compound-interest n-solver: n = log((T + C/r) / (PV + C/r)) / log(1+r).
 * Falls back to linear when rate is zero.
 *
 * @param c - Monthly contribution amount.
 * @returns Number of months, or null if goal is unreachable.
 */
function computeMonths(c: number): number | null {
  const pv = currentAmount.value;
  const target = targetAmount.value;
  if (pv >= target) { return 0; }
  if (c <= 0) { return null; }
  const r = monthlyRate.value;
  if (r === 0) {
    return Math.ceil((target - pv) / c);
  }
  const n = Math.log((target + c / r) / (pv + c / r)) / Math.log(1 + r);
  if (!isFinite(n) || n < 0) { return null; }
  return Math.ceil(n);
}

/** Number of months to reach target using the current slider contribution. */
const localMonths = computed((): number | null => computeMonths(contribution.value));

/**
 * Formats a future date N months from today using pt-BR short format.
 *
 * @param n - Number of months from today.
 * @returns Formatted string like "jun/2027".
 */
function futureMonthLabel(n: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + n);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(date);
}

/** Human-readable estimated completion label for KPI display. */
const completionLabel = computed((): string => {
  const n = localMonths.value;
  if (n === null) { return t("goal.projection.unreachable"); }
  if (n === 0) { return t("goal.projection.alreadyDone"); }
  return futureMonthLabel(n);
});

/** Months-to-completion label for KPI display. */
const monthsLabel = computed((): string => {
  const n = localMonths.value;
  if (n === null) { return "—"; }
  if (n === 0) { return "0"; }
  return String(n);
});

/** On-track status from the API projection. */
const onTrack = computed((): boolean => data.value?.projection.on_track ?? false);

/** Suggested monthly contribution when off-track, or null. */
const suggestedContribution = computed((): number | null => {
  const s = data.value?.projection.suggested_monthly_contribution;
  return s !== null && s !== undefined ? parseFloat(s) : null;
});

/** Upper bound for the slider: 5× the API contribution, minimum R$5000. */
const sliderMax = computed((): number => {
  if (!data.value) { return 5000; }
  return Math.max(parseFloat(data.value.projection.monthly_contribution) * 5, 5000);
});

/**
 * Builds the ECharts option for the accumulation curve.
 * Generates month-by-month balance using FV(PV, r, C) and overlays a
 * dashed mark-line at the target amount.
 */
const chartOption = computed((): EChartsOption => {
  const c = contribution.value;
  const r = monthlyRate.value;
  const pv = currentAmount.value;
  const target = targetAmount.value;
  const horizon = Math.min(120, (localMonths.value ?? 60) + 6);

  const xLabels: string[] = [];
  const balances: number[] = [];

  let balance = pv;
  for (let i = 0; i <= horizon; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    xLabels.push(
      new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(d),
    );
    balances.push(Math.round(balance * 100) / 100);
    balance = balance * (1 + r) + c;
  }

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown): string => {
        const items = params as Array<{ name: string; value: number }>;
        const item = items[0];
        if (!item) { return ""; }
        return `${item.name}<br/><strong>${formatCurrency(item.value)}</strong>`;
      },
    },
    grid: { left: "14%", right: "4%", top: "8%", bottom: "16%" },
    xAxis: {
      type: "category",
      data: xLabels,
      axisLabel: { rotate: 30, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (val: number): string => formatCurrency(val),
        fontSize: 10,
      },
    },
    series: [
      {
        name: t("goal.projection.seriesBalance"),
        type: "line",
        data: balances,
        smooth: true,
        areaStyle: {},
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: { type: "dashed" },
          data: [{ yAxis: target, name: t("goal.projection.seriesTarget") }],
          label: { formatter: t("goal.projection.seriesTarget") },
        },
      },
    ],
  };
});
</script>

<template>
  <UiSurfaceCard
    v-if="props.goalId !== null"
    class="goal-projection-panel"
  >
    <div class="goal-projection-panel__header">
      <span class="goal-projection-panel__title">{{ $t('goal.projection.title') }}</span>
      <NTag
        v-if="data"
        :type="onTrack ? 'success' : 'warning'"
        size="small"
        :bordered="false"
      >
        {{ onTrack ? $t('goal.projection.onTrack') : $t('goal.projection.offTrack') }}
      </NTag>
    </div>

    <UiPageLoader v-if="isLoading" :rows="4" />

    <UiInlineError
      v-else-if="isError"
      :title="$t('goal.projection.loadError')"
      :message="$t('goal.projection.loadErrorMessage')"
    />

    <template v-else-if="data">
      <NAlert
        v-if="!onTrack && suggestedContribution !== null"
        type="warning"
        :show-icon="true"
        class="goal-projection-panel__alert"
      >
        {{ $t('goal.projection.suggestedAlert', { amount: formatCurrency(suggestedContribution) }) }}
      </NAlert>

      <div class="goal-projection-panel__stats">
        <NStatistic
          :label="$t('goal.projection.portfolioRate')"
          :value="annualRatePct"
        />
        <NStatistic
          :label="$t('goal.projection.monthsToCompletion')"
          :value="monthsLabel"
        />
        <NStatistic
          :label="$t('goal.projection.estimatedCompletion')"
          :value="completionLabel"
        />
      </div>

      <div class="goal-projection-panel__slider-section">
        <div class="goal-projection-panel__slider-header">
          <label class="goal-projection-panel__slider-label">
            {{ $t('goal.projection.monthlyContribution') }}
          </label>
          <span class="goal-projection-panel__slider-value">
            {{ formatCurrency(contribution) }}
          </span>
        </div>
        <NSlider
          v-model:value="contribution"
          :min="0"
          :max="sliderMax"
          :step="10"
          class="goal-projection-panel__slider"
        />
      </div>

      <UiChartPanel
        :title="$t('goal.projection.chartTitle')"
        chart-height="260px"
        class="goal-projection-panel__chart"
      >
        <UiChart :option="chartOption" height="260px" />
      </UiChartPanel>
    </template>
  </UiSurfaceCard>
</template>

<style scoped>
.goal-projection-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.goal-projection-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.goal-projection-panel__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.goal-projection-panel__alert {
  border-radius: var(--radius-md);
}

.goal-projection-panel__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
}

.goal-projection-panel__slider-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.goal-projection-panel__slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-projection-panel__slider-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.goal-projection-panel__slider-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.goal-projection-panel__slider {
  width: 100%;
}

.goal-projection-panel__chart {
  margin: 0 calc(-1 * var(--space-3));
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}
</style>
