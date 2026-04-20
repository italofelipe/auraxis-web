<script setup lang="ts">
import {
  PERIOD_OPTIONS,
  type DashboardPeriod,
} from "~/features/dashboard/model/dashboard-period";

interface Props {
  modelValue: DashboardPeriod;
}

interface Emits {
  (event: "update:modelValue" | "period-change", value: DashboardPeriod): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Handles period selection changes from the button group.
 *
 * @param period The newly selected period.
 * @returns void
 */
const handleSelect = (period: DashboardPeriod): void => {
  emit("update:modelValue", period);
  emit("period-change", period);
};
</script>

<template>
  <div class="period-selector" role="group" :aria-label="$t('dashboard.periodSelector.ariaLabel')">
    <button
      v-for="option in PERIOD_OPTIONS"
      :key="option.value"
      type="button"
      class="period-selector__btn"
      :class="{ 'period-selector__btn--active': props.modelValue === option.value }"
      :aria-pressed="props.modelValue === option.value"
      @click="handleSelect(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.period-selector {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.period-selector__btn {
  min-height: 36px;
  padding-inline: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast);
}

.period-selector__btn:hover {
  background: var(--color-bg-surface);
  border-color: var(--color-text-muted);
  color: var(--color-text-primary);
}

.period-selector__btn--active {
  background: var(--color-brand-500);
  border-color: var(--color-brand-500);
  color: var(--color-bg-base);
}
</style>
