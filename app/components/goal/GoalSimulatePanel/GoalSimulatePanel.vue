<script setup lang="ts">
import { NInputNumber } from "naive-ui";
import type { GoalSimulatePanelProps } from "./GoalSimulatePanel.types";

const { t } = useI18n();

const props = defineProps<GoalSimulatePanelProps>();

const monthlyContribution = ref<number>(props.initialMonthly ?? 0);
const annualReturnPercent = ref<number>(0);

watch(
  () => props.initialMonthly,
  (val) => {
    if (val !== undefined) {
      monthlyContribution.value = val;
    }
  },
);

type ProjectionInput = {
  current: number;
  target: number;
  monthly: number;
  annualRate: number;
};

/**
 * Projects how many months it takes to reach the target amount given
 * an initial balance, a fixed monthly contribution and an annual return rate.
 *
 * @param input - Projection parameters.
 * @param input.current - Current accumulated amount.
 * @param input.target - Target amount.
 * @param input.monthly - Monthly contribution.
 * @param input.annualRate - Annual return rate in percentage (e.g., 6 = 6%).
 * @returns Number of months required, or Infinity when monthly <= 0.
 */
function projectMonths(input: ProjectionInput): number {
  const { current, target, monthly, annualRate } = input;
  if (monthly <= 0) { return Infinity; }
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return Math.ceil((target - current) / monthly);
  }
  // FV formula: FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r
  // Solve for n iteratively (max 600 months)
  let balance = current;
  for (let n = 1; n <= 600; n++) {
    balance = balance * (1 + monthlyRate) + monthly;
    if (balance >= target) { return n; }
  }
  return 600;
}

const projectedMonths = computed((): number =>
  projectMonths({
    current: props.goal.current_amount,
    target: props.goal.target_amount,
    monthly: monthlyContribution.value,
    annualRate: annualReturnPercent.value,
  }),
);

/**
 * Formats a completion date from today + N months in "MMM/YYYY" format (pt-BR).
 *
 * @param months - Number of months from today.
 * @returns Formatted string like "dez/2028".
 */
function completionDateLabel(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(date);
}

const projectionLabel = computed((): string => {
  if (projectedMonths.value === Infinity) {
    return t("goal.simulate.unreachable");
  }
  const dateStr = completionDateLabel(projectedMonths.value);
  return t("goal.simulate.projection", { n: projectedMonths.value, date: dateStr });
});
</script>

<template>
  <UiSurfaceCard class="goal-simulate-panel">
    <div class="goal-simulate-panel__header">
      <span class="goal-simulate-panel__title">{{ $t('goal.simulate.title') }}</span>
    </div>

    <div class="goal-simulate-panel__inputs">
      <div class="goal-simulate-panel__field">
        <label class="goal-simulate-panel__label">{{ $t('goal.simulate.monthlyLabel') }}</label>
        <NInputNumber
          v-model:value="monthlyContribution"
          :min="0"
          :precision="2"
          :show-button="false"
          class="goal-simulate-panel__input"
        />
      </div>

      <div class="goal-simulate-panel__field">
        <label class="goal-simulate-panel__label">{{ $t('goal.simulate.returnLabel') }}</label>
        <NInputNumber
          v-model:value="annualReturnPercent"
          :min="0"
          :max="100"
          :precision="2"
          :show-button="false"
          class="goal-simulate-panel__input"
        />
      </div>
    </div>

    <p class="goal-simulate-panel__result">{{ projectionLabel }}</p>
  </UiSurfaceCard>
</template>

<style scoped>
.goal-simulate-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.goal-simulate-panel__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.goal-simulate-panel__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.goal-simulate-panel__inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}

.goal-simulate-panel__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.goal-simulate-panel__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.goal-simulate-panel__input {
  width: 100%;
}

.goal-simulate-panel__result {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  margin: 0;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
}
</style>
