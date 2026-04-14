<script setup lang="ts">
import { NTag } from "naive-ui";
import type { HoraExtraResult } from "./useHoraExtraCalculator";

defineOptions({ name: "HoraExtraResult" });

const props = defineProps<{
  /** Full calculation result to display. */
  result: HoraExtraResult;
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
  <div class="hora-extra-result">
    <div
      v-if="props.result.overtime50.hours > 0"
      class="hora-extra-result__row"
    >
      <div class="hora-extra-result__label">
        <NTag size="small" type="info">50%</NTag>
        <span>{{ props.result.overtime50.hours }}h &times; {{ formatBrl(props.result.hourlyRate) }} &times; 1,5</span>
      </div>
      <span class="hora-extra-result__value">
        {{ formatBrl(props.result.overtime50.grossAmount) }}
      </span>
    </div>

    <div
      v-if="props.result.overtime75.hours > 0"
      class="hora-extra-result__row"
    >
      <div class="hora-extra-result__label">
        <NTag size="small" type="warning">75%</NTag>
        <span>{{ props.result.overtime75.hours }}h &times; {{ formatBrl(props.result.hourlyRate) }} &times; 1,75</span>
      </div>
      <span class="hora-extra-result__value">
        {{ formatBrl(props.result.overtime75.grossAmount) }}
      </span>
    </div>

    <div
      v-if="props.result.overtime100.hours > 0"
      class="hora-extra-result__row"
    >
      <div class="hora-extra-result__label">
        <NTag size="small" type="error">100%</NTag>
        <span>{{ props.result.overtime100.hours }}h &times; {{ formatBrl(props.result.hourlyRate) }} &times; 2,0</span>
      </div>
      <span class="hora-extra-result__value">
        {{ formatBrl(props.result.overtime100.grossAmount) }}
      </span>
    </div>

    <div class="hora-extra-result__row hora-extra-result__row--total">
      <span>{{ $t('horaExtra.results.totalOvertimeGross') }}</span>
      <span class="hora-extra-result__value--gross">{{ formatBrl(props.result.totalOvertimeGross) }}</span>
    </div>

    <div class="hora-extra-result__row hora-extra-result__row--deduction">
      <span>{{ $t('horaExtra.results.inssOvertimeImpact') }}</span>
      <span class="hora-extra-result__value--negative">
        &minus; {{ formatBrl(props.result.inssOvertimeImpact) }}
      </span>
    </div>

    <div class="hora-extra-result__row hora-extra-result__row--net">
      <span>{{ $t('horaExtra.results.netOvertimeEstimate') }}</span>
      <span class="hora-extra-result__value--positive">{{ formatBrl(props.result.netOvertimeEstimate) }}</span>
    </div>
  </div>
</template>

<style scoped>
.hora-extra-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.hora-extra-result__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.hora-extra-result__label {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.hora-extra-result__value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.hora-extra-result__row--total {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  padding-top: var(--space-2, 8px);
  border-top: 1px solid var(--color-border-subtle);
  margin-top: var(--space-1, 4px);
}

.hora-extra-result__row--deduction {
  color: var(--color-text-secondary);
}

.hora-extra-result__row--net {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  padding-top: var(--space-1, 4px);
  border-top: 1px solid var(--color-border-subtle);
  margin-top: var(--space-1, 4px);
}

.hora-extra-result__value--gross {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.hora-extra-result__value--negative {
  color: var(--color-error);
}

.hora-extra-result__value--positive {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}
</style>
