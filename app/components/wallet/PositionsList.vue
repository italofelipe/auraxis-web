<script setup lang="ts">
import { NCard, NEmpty, NTag, NSpace } from "naive-ui";

import { formatCurrency } from "~/utils/currency";
import type { Position } from "~/features/wallet/model/wallet";


interface Props {
  /** List of portfolio positions to display. */
  positions: Position[];
}

defineProps<Props>();

/**
 * Formats a percentage variation value with a sign prefix for display.
 *
 * @param value Percentage value.
 * @returns Formatted string with sign prefix and two decimal places.
 */
const formatVariationPct = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Resolves the CSS modifier class for positive, neutral and negative variation.
 *
 * @param value Variation percentage.
 * @returns CSS modifier class name.
 */
const variationClass = (value: number): string => {
  if (value > 0) { return "positions-list__variation--positive"; }
  if (value < 0) { return "positions-list__variation--negative"; }
  return "positions-list__variation--neutral";
};
</script>

<template>
  <NCard :title="$t('positions.title')">
    <NEmpty
      v-if="positions.length === 0"
      :description="$t('positions.empty')"
    />

    <ul v-else class="positions-list">
      <li
        v-for="position in positions"
        :key="position.id"
        class="positions-list__item"
      >
        <div class="positions-list__info">
          <div class="positions-list__name-row">
            <span class="positions-list__name">{{ position.name }}</span>
            <NTag v-if="position.ticker" size="small" type="info">
              {{ position.ticker }}
            </NTag>
            <NTag size="small">{{ position.category }}</NTag>
          </div>
        </div>

        <div class="positions-list__values">
          <NSpace :size="24" class="positions-list__amounts">
            <div class="positions-list__amount-block">
              <span class="positions-list__amount-label">{{ $t('positions.invested') }}</span>
              <span class="positions-list__amount-value">
                {{ formatCurrency(position.invested) }}
              </span>
            </div>
            <div class="positions-list__amount-block">
              <span class="positions-list__amount-label">{{ $t('positions.current') }}</span>
              <span class="positions-list__amount-value">
                {{ formatCurrency(position.currentValue) }}
              </span>
            </div>
          </NSpace>

          <span
            class="positions-list__variation"
            :class="variationClass(position.variationPct)"
          >
            {{ formatVariationPct(position.variationPct) }}
          </span>
        </div>
      </li>
    </ul>
  </NCard>
</template>

<style scoped>
.positions-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0;
}

.positions-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) 0;
  border-bottom: 1px solid var(--color-outline-subtle);
  flex-wrap: wrap;
}

.positions-list__item:last-child {
  border-bottom: none;
}

.positions-list__info {
  flex: 1 1 auto;
  min-width: 0;
}

.positions-list__name-row {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  flex-wrap: wrap;
}

.positions-list__name {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-primary);
}

.positions-list__values {
  display: flex;
  align-items: center;
  gap: var(--space-4, 16px);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.positions-list__amounts {
  flex-wrap: wrap;
}

.positions-list__amount-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.positions-list__amount-label {
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle);
}

.positions-list__amount-value {
  font-weight: var(--font-weight-medium, 500);
}

.positions-list__variation {
  font-weight: var(--font-weight-semibold, 600);
  min-width: 70px;
  text-align: right;
}

.positions-list__variation--positive {
  color: var(--color-positive);
}

.positions-list__variation--negative {
  color: var(--color-negative);
}

.positions-list__variation--neutral {
  color: var(--color-text-subtle);
}
</style>
