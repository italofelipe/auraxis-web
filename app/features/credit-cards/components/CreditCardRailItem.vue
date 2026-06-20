<script setup lang="ts">
import { computed } from "vue";

import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import { formatCurrency } from "~/utils/currency";

import type { CreditCardBrand } from "../contracts/credit-card.dto";
import { utilizationBarWidthPct } from "../utils/utilization";
import CreditCardBrandLogo from "./CreditCardBrandLogo.vue";

const props = withDefaults(
  defineProps<{
    label: string;
    subtitle: string;
    amount: number;
    selected: boolean;
    color: string;
    color2?: string;
    brand?: CreditCardBrand | null;
    isAll?: boolean;
    utilizationPct?: number | null;
  }>(),
  { color2: undefined, brand: null, isAll: false, utilizationPct: null },
);

const emit = defineEmits<{ select: [] }>();

const spineStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.color}, ${props.color2 ?? props.color})`,
}));
const accentStyle = computed(() =>
  props.selected
    ? { borderColor: props.color, boxShadow: `0 4px 14px ${props.color}22` }
    : {},
);
const hasMeter = computed<boolean>(
  () => props.utilizationPct !== null && props.utilizationPct !== undefined,
);
const meterColor = computed<string>(() =>
  (props.utilizationPct ?? 0) > 90 ? "#E5484D" : props.color,
);
</script>

<template>
  <button
    type="button"
    class="cc-rail-item"
    :class="{ 'cc-rail-item--selected': selected }"
    :style="accentStyle"
    :aria-pressed="selected"
    data-testid="cc-rail-item"
    @click="emit('select')"
  >
    <span class="cc-rail-item__top">
      <span v-if="isAll" class="cc-rail-item__all">
        <UiIcon name="layers" :size="18" />
      </span>
      <span v-else class="cc-rail-item__spine" :style="spineStyle" />

      <span class="cc-rail-item__id">
        <span class="cc-rail-item__name">{{ label }}</span>
        <span class="cc-rail-item__sub">{{ subtitle }}</span>
      </span>

      <span class="cc-rail-item__right">
        <CreditCardBrandLogo
          v-if="!isAll"
          :brand="brand"
          :width="30"
          class="cc-rail-item__brand"
        />
        <span class="cc-rail-item__amount">{{ formatCurrency(amount) }}</span>
      </span>
    </span>

    <span v-if="hasMeter" class="cc-rail-item__meter" aria-hidden="true">
      <span
        class="cc-rail-item__meter-fill"
        :style="{ width: `${utilizationBarWidthPct(utilizationPct ?? 0)}%`, background: meterColor }"
      />
    </span>
  </button>
</template>

<style scoped>
.cc-rail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.cc-rail-item:hover {
  border-color: var(--color-outline-strong, var(--color-outline-soft));
}
.cc-rail-item--selected {
  background: var(--color-brand-hover-surface, var(--color-bg-surface));
}
.cc-rail-item__top {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.cc-rail-item__all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--color-brand-500);
  color: #fff;
  flex-shrink: 0;
}
.cc-rail-item__spine {
  width: 38px;
  height: 26px;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}
.cc-rail-item__id {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.cc-rail-item__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cc-rail-item__sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.cc-rail-item__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.cc-rail-item__amount {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.cc-rail-item__meter {
  display: block;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  overflow: hidden;
}
.cc-rail-item__meter-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
}
</style>
