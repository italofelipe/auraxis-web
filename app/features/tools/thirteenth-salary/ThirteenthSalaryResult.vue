<script setup lang="ts">
import { NTag } from "naive-ui";
import type { ThirteenthSalaryResult } from "./useThirteenthSalaryCalculator";

defineOptions({ name: "ThirteenthSalaryResult" });

const props = defineProps<{
  /** Full calculation result to display. */
  result: ThirteenthSalaryResult;
}>();

const { n } = useI18n();

/**
 * Formats a numeric value as Brazilian Real currency string.
 *
 * @param value Number to format.
 * @returns Formatted BRL string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}
</script>

<template>
  <div class="thirteenth-salary-result">
    <!-- First installment -->
    <div class="thirteenth-salary-result__installment">
      <div class="thirteenth-salary-result__installment-header">
        <span class="thirteenth-salary-result__installment-title">
          {{ $t('thirteenthSalary.results.firstInstallment') }}
        </span>
        <NTag size="small" round>
          {{ $t('thirteenthSalary.results.firstInstallmentDate') }}
        </NTag>
      </div>
      <div class="thirteenth-salary-result__rows">
        <div class="thirteenth-salary-result__row">
          <span>{{ $t('thirteenthSalary.results.firstInstallmentGross') }}</span>
          <span>{{ formatBrl(props.result.firstInstallment.gross) }}</span>
        </div>
        <div class="thirteenth-salary-result__row thirteenth-salary-result__row--net">
          <span>{{ $t('thirteenthSalary.results.firstInstallmentNet') }}</span>
          <span class="thirteenth-salary-result__value--positive">
            {{ formatBrl(props.result.firstInstallment.net) }}
          </span>
        </div>
      </div>
      <p class="thirteenth-salary-result__note">
        {{ $t('thirteenthSalary.results.firstInstallmentNote') }}
      </p>
    </div>

    <!-- Second installment -->
    <div class="thirteenth-salary-result__installment">
      <div class="thirteenth-salary-result__installment-header">
        <span class="thirteenth-salary-result__installment-title">
          {{ $t('thirteenthSalary.results.secondInstallment') }}
        </span>
        <NTag size="small" round>
          {{ $t('thirteenthSalary.results.secondInstallmentDate') }}
        </NTag>
      </div>
      <div class="thirteenth-salary-result__rows">
        <div class="thirteenth-salary-result__row">
          <span>{{ $t('thirteenthSalary.results.secondInstallmentGross') }}</span>
          <span>{{ formatBrl(props.result.secondInstallment.gross) }}</span>
        </div>
        <div class="thirteenth-salary-result__row thirteenth-salary-result__row--deduction">
          <span>{{ $t('thirteenthSalary.results.deductionInss') }}</span>
          <span class="thirteenth-salary-result__value--negative">
            &minus; {{ formatBrl(props.result.secondInstallment.inss) }}
          </span>
        </div>
        <div class="thirteenth-salary-result__row thirteenth-salary-result__row--deduction">
          <span>{{ $t('thirteenthSalary.results.deductionIrrf') }}</span>
          <span class="thirteenth-salary-result__value--negative">
            &minus; {{ formatBrl(props.result.secondInstallment.irrf) }}
          </span>
        </div>
        <div class="thirteenth-salary-result__row thirteenth-salary-result__row--net">
          <span>{{ $t('thirteenthSalary.results.secondInstallmentNet') }}</span>
          <span class="thirteenth-salary-result__value--positive">
            {{ formatBrl(props.result.secondInstallment.net) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thirteenth-salary-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.thirteenth-salary-result__installment {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.thirteenth-salary-result__installment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2, 8px);
}

.thirteenth-salary-result__installment-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.thirteenth-salary-result__rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.thirteenth-salary-result__row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.thirteenth-salary-result__row--net {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  padding-top: var(--space-1, 4px);
  border-top: 1px solid var(--color-border-subtle);
  margin-top: var(--space-1, 4px);
}

.thirteenth-salary-result__note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.thirteenth-salary-result__value--positive {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.thirteenth-salary-result__value--negative {
  color: var(--color-error);
}
</style>
