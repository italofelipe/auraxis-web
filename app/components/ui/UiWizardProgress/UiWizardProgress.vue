<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** Current step number (1-based). */
  current: number;
  /** Total number of steps. */
  total: number;
}>();

/** Progress percentage (0–100) for the visual bar. */
const progressPercent = computed<number>(() => {
  if (props.total === 0) { return 0; }
  return Math.round((props.current / props.total) * 100);
});

/** Human-readable label shown above the progress bar. */
const label = computed<string>(() => `Pergunta ${props.current} de ${props.total}`);
</script>

<template>
  <div class="ui-wizard-progress">
    <span class="ui-wizard-progress__label" aria-hidden="true">{{ label }}</span>
    <div
      class="ui-wizard-progress__track"
      role="progressbar"
      :aria-valuenow="current"
      :aria-valuemin="1"
      :aria-valuemax="total"
      :aria-label="label"
    >
      <div
        class="ui-wizard-progress__fill"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>
  </div>
</template>

<style scoped>
.ui-wizard-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.ui-wizard-progress__label {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-muted, #888);
}

.ui-wizard-progress__track {
  width: 100%;
  height: 6px;
  background: var(--color-bg-elevated, #e0e0e0);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
}

.ui-wizard-progress__fill {
  height: 100%;
  background: var(--color-brand-600, #6366f1);
  border-radius: var(--radius-full, 9999px);
  transition: width 0.25s ease;
}
</style>
