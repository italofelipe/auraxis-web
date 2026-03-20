<script setup lang="ts" generic="T extends string">
import type { UiSegmentedControlProps, UiSegmentedControlEmits } from "./UiSegmentedControl.types";

const props = withDefaults(defineProps<UiSegmentedControlProps<T>>(), {
  ariaLabel: "Selecionar opção",
});

const emit = defineEmits<UiSegmentedControlEmits<T>>();
</script>

<template>
  <div
    class="ui-segmented-control"
    role="group"
    :aria-label="props.ariaLabel"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="ui-segmented-control__option"
      :class="{ 'ui-segmented-control__option--active': props.modelValue === option.value }"
      :aria-pressed="props.modelValue === option.value"
      :disabled="option.disabled"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented-control {
  display: inline-flex;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}
.ui-segmented-control__option {
  padding: 6px var(--space-2);
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
  font-family: var(--font-body);
}
.ui-segmented-control__option:hover:not(:disabled):not(.ui-segmented-control__option--active) {
  color: var(--color-text-secondary);
}
.ui-segmented-control__option--active {
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  font-weight: var(--font-weight-semibold);
}
.ui-segmented-control__option:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
