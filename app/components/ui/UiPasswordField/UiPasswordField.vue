<script setup lang="ts">
import { ref, useAttrs } from "vue";
import { Eye, EyeOff } from "lucide-vue-next";
import type { UiPasswordFieldProps, UiPasswordFieldEmits } from "./UiPasswordField.types";
import UiFormField from "../UiFormField/UiFormField.vue";

// Prevent fall-through attrs (vee-validate onChange/onBlur/name) from landing
// on the UiFormField wrapper. We forward them to the <input> directly so that
// reactive validation and browser autofill work correctly.
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(defineProps<UiPasswordFieldProps>(), {
  label: undefined,
  fieldId: "password",
  placeholder: "",
  error: undefined,
  required: false,
  disabled: false,
  autocomplete: "current-password",
});

const emit = defineEmits<UiPasswordFieldEmits>();

const isVisible = ref(false);

/**
 * Toggles the password visibility state.
 */
function toggle(): void {
  isVisible.value = !isVisible.value;
}
</script>

<template>
  <UiFormField :label="props.label ?? $t('ui.passwordField.label')" :field-id="props.fieldId" :error="props.error" :required="props.required">
    <div class="ui-password-field__wrapper">
      <input
        v-bind="attrs"
        :id="props.fieldId"
        class="ui-password-field__input"
        :class="{ 'ui-password-field__input--error': !!props.error }"
        :type="isVisible ? 'text' : 'password'"
        :value="props.modelValue"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :autocomplete="props.autocomplete"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <button
        type="button"
        class="ui-password-field__toggle"
        :aria-label="isVisible ? $t('ui.passwordField.hidePassword') : $t('ui.passwordField.showPassword')"
        :aria-pressed="isVisible"
        @click="toggle"
      >
        <EyeOff v-if="isVisible" :size="18" aria-hidden="true" />
        <Eye v-else :size="18" aria-hidden="true" />
      </button>
    </div>
  </UiFormField>
</template>

<style scoped>
.ui-password-field__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.ui-password-field__input {
  width: 100%;
  padding: 10px var(--space-2);
  padding-right: 44px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ui-password-field__input::placeholder {
  color: var(--color-text-subtle);
}
.ui-password-field__input:focus {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
}
.ui-password-field__input--error {
  border-color: var(--color-negative);
}
.ui-password-field__input--error:focus {
  box-shadow: 0 0 0 2px var(--color-negative-bg);
}
.ui-password-field__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ui-password-field__toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  padding: 0;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.15s ease;
}
.ui-password-field__toggle:hover {
  color: var(--color-text-secondary);
}
</style>
