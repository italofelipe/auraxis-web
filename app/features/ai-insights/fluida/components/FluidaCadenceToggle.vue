<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { FluidaCadence } from "../model/insight-fluida";

defineProps<{
  cadence: FluidaCadence;
}>();

const emit = defineEmits<{
  (event: "update:cadence", value: FluidaCadence): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="fluida-cadence" role="group" :aria-label="t('insights.fluida.cadence.daily')">
    <button
      type="button"
      class="fluida-cadence__option"
      :class="{ 'fluida-cadence__option--on': cadence === 'daily' }"
      :aria-pressed="cadence === 'daily'"
      @click="emit('update:cadence', 'daily')"
    >
      {{ t("insights.fluida.cadence.daily") }}
    </button>
    <button
      type="button"
      class="fluida-cadence__option"
      :class="{ 'fluida-cadence__option--on': cadence === 'weekly' }"
      :aria-pressed="cadence === 'weekly'"
      @click="emit('update:cadence', 'weekly')"
    >
      {{ t("insights.fluida.cadence.weekly") }}
    </button>
  </div>
</template>

<style scoped>
.fluida-cadence {
  display: inline-flex;
  gap: 3px;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--fluida-surface-2);
}

.fluida-cadence__option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  white-space: nowrap;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--fluida-radius-chip);
  background: transparent;
  color: var(--fluida-body);
  font-family: inherit;
  font-size: var(--fluida-size-body-sm);
  font-weight: var(--fluida-weight-strong);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast);
}

.fluida-cadence__option--on {
  background: var(--fluida-surface);
  color: var(--fluida-brand);
  box-shadow: var(--shadow-sm);
}
</style>
