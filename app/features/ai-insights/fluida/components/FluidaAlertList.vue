<script setup lang="ts">
import type { FluidaAlertCard } from "../model/insight-fluida";

defineProps<{
  alerts: readonly FluidaAlertCard[];
}>();
</script>

<template>
  <ul class="fluida-alerts">
    <li
      v-for="(alert, index) in alerts"
      :key="index"
      class="fluida-alerts__item"
      :class="`fluida-alerts__item--${alert.severity.tone}`"
    >
      <span class="fluida-alerts__dot" aria-hidden="true" />
      <span class="fluida-alerts__text">{{ alert.text }}</span>
    </li>
  </ul>
</template>

<style scoped>
.fluida-alerts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.fluida-alerts__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
}

.fluida-alerts__item--danger {
  background: var(--fluida-sev-alert-bg);
}

.fluida-alerts__item--warning {
  background: var(--fluida-sev-warn-bg);
}

.fluida-alerts__item--success {
  background: var(--fluida-sev-ok-bg);
}

.fluida-alerts__item--neutral {
  background: var(--fluida-surface-2);
}

.fluida-alerts__dot {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: var(--fluida-radius-chip);
  background: var(--fluida-warn);
}

.fluida-alerts__item--danger .fluida-alerts__dot {
  background: var(--fluida-neg);
}

.fluida-alerts__item--success .fluida-alerts__dot {
  background: var(--fluida-pos);
}

.fluida-alerts__text {
  font-size: var(--fluida-size-body-sm);
  font-weight: var(--fluida-weight-semibold);
  line-height: var(--fluida-leading-snug);
  color: var(--fluida-ink);
}
</style>
