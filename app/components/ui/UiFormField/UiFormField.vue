<script setup lang="ts">
import type { UiFormFieldProps } from "./UiFormField.types";

const props = withDefaults(defineProps<UiFormFieldProps>(), {
  error: undefined,
  hint: undefined,
  required: false,
});
</script>

<template>
  <div
    class="ui-form-field"
    :class="{ 'ui-form-field--error': !!props.error }"
  >
    <label :for="props.fieldId" class="ui-form-field__label">
      {{ props.label }}
      <span v-if="props.required" class="ui-form-field__required" aria-hidden="true">*</span>
    </label>

    <div class="ui-form-field__control">
      <slot />
    </div>

    <p v-if="props.error" class="ui-form-field__error" role="alert" aria-live="assertive">
      {{ props.error }}
    </p>
    <p v-else-if="props.hint" class="ui-form-field__hint">
      {{ props.hint }}
    </p>
  </div>
</template>

<style scoped>
.ui-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ui-form-field__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.ui-form-field__required {
  color: var(--color-negative);
  margin-left: 2px;
}
.ui-form-field__control {
  position: relative;
}
.ui-form-field__error {
  font-size: var(--font-size-xs);
  color: var(--color-negative);
  margin: 0;
}
.ui-form-field__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
}
.ui-form-field--error .ui-form-field__label {
  color: var(--color-negative);
}
</style>
