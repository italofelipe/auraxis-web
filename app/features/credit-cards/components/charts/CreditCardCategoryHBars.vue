<script setup lang="ts">
import { computed } from "vue";

import { formatCurrency } from "~/utils/currency";

/** Item de uma barra horizontal (categoria ou cartão). */
export interface HBarItem {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

const props = withDefaults(
  defineProps<{
    items: readonly HBarItem[];
    limit?: number;
  }>(),
  { limit: 6 },
);

const visible = computed<HBarItem[]>(() => [...props.items].slice(0, props.limit));
const maxValue = computed<number>(() => Math.max(1, ...visible.value.map((item) => item.value)));

/**
 * Largura da barra proporcional ao maior valor (mínimo visível de 2%).
 *
 * @param value Valor do item.
 * @returns Largura CSS em porcentagem.
 */
const widthPct = (value: number): string => `${Math.max(2, (value / maxValue.value) * 100)}%`;
</script>

<template>
  <ul class="cc-hbars">
    <li v-for="item in visible" :key="item.label" class="cc-hbars__row">
      <span class="cc-hbars__label">{{ item.label }}</span>
      <span class="cc-hbars__track">
        <span
          class="cc-hbars__fill"
          :style="{ width: widthPct(item.value), background: item.color }"
        />
      </span>
      <span class="cc-hbars__value">{{ formatCurrency(item.value) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.cc-hbars {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.cc-hbars__row {
  display: grid;
  grid-template-columns: minmax(72px, 0.9fr) minmax(0, 2fr) auto;
  align-items: center;
  gap: var(--space-2);
}
.cc-hbars__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cc-hbars__track {
  height: 9px;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  overflow: hidden;
}
.cc-hbars__fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--motion-standard, 0.2s ease);
}
.cc-hbars__value {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: right;
  white-space: nowrap;
}
</style>
