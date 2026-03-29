<script setup lang="ts">
import type { QuestionnaireOptionDto } from "~/features/investor-profile/contracts/investor-profile.dto";

const props = withDefaults(
  defineProps<{
    /** The option to render. */
    option: QuestionnaireOptionDto;
    /** Whether this option is currently selected. */
    selected: boolean;
    /** When true, the card is non-interactive. */
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  /** Emitted when the user selects this option. Payload is the option id. */
  select: [id: number];
}>();

/**
 * Handles card activation via click or keyboard (Enter/Space).
 */
const handleSelect = (): void => {
  if (!props.disabled) {
    emit("select", props.option.id);
  }
};

/**
 * Forwards keyboard Enter and Space as selection events.
 *
 * @param event Keyboard event from the card element.
 */
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleSelect();
  }
};
</script>

<template>
  <div
    class="ui-option-card-radio"
    :class="{
      'ui-option-card-radio--selected': selected,
      'ui-option-card-radio--disabled': disabled,
    }"
    role="radio"
    :aria-checked="selected"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    @click="handleSelect"
    @keydown="handleKeydown"
  >
    <span class="ui-option-card-radio__indicator" aria-hidden="true" />
    <span class="ui-option-card-radio__text">{{ option.text }}</span>
  </div>
</template>

<style scoped>
.ui-option-card-radio {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: var(--space-3, 12px) var(--space-3, 12px);
  border: 2px solid var(--color-outline-soft, #e0e0e0);
  border-radius: var(--radius-md, 8px);
  background: var(--color-bg-surface, #fff);
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  outline: none;
}

.ui-option-card-radio:hover:not(.ui-option-card-radio--disabled) {
  border-color: var(--color-brand-600, #6366f1);
}

.ui-option-card-radio:focus-visible {
  box-shadow: 0 0 0 3px var(--color-brand-200, #c7d2fe);
}

.ui-option-card-radio--selected {
  border-color: var(--color-brand-600, #6366f1);
  background: var(--color-brand-50, #eef2ff);
}

.ui-option-card-radio--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.ui-option-card-radio__indicator {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 50%;
  border: 2px solid var(--color-outline-soft, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
}

.ui-option-card-radio--selected .ui-option-card-radio__indicator {
  border-color: var(--color-brand-600, #6366f1);
  background: var(--color-brand-600, #6366f1);
  box-shadow: inset 0 0 0 3px var(--color-bg-surface, #fff);
}

.ui-option-card-radio__text {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-primary, #111);
  line-height: 1.4;
}
</style>
