<script setup lang="ts">
import { computed } from "vue";
import { Search, X } from "lucide-vue-next";
import type { UiSearchFieldProps, UiSearchFieldEmits } from "./UiSearchField.types";

const props = withDefaults(defineProps<UiSearchFieldProps>(), {
  placeholder: "Buscar...",
  disabled: false,
});

const emit = defineEmits<UiSearchFieldEmits>();

const hasValue = computed(() => props.modelValue.length > 0);

/**
 * Clears the current search value and emits the clear event.
 */
function clear(): void {
  emit("update:modelValue", "");
  emit("clear");
}
</script>

<template>
  <div class="ui-search-field" :class="{ 'ui-search-field--disabled': props.disabled }">
    <Search :size="16" class="ui-search-field__icon" aria-hidden="true" />
    <input
      class="ui-search-field__input"
      type="search"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      aria-label="Buscar"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <button
      v-if="hasValue"
      type="button"
      class="ui-search-field__clear"
      aria-label="Limpar busca"
      @click="clear"
    >
      <X :size="14" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.ui-search-field {
  position: relative;
  display: flex;
  align-items: center;
}
.ui-search-field__icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}
.ui-search-field__input {
  width: 100%;
  padding: 10px var(--space-2) 10px 36px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ui-search-field__input::placeholder {
  color: var(--color-text-subtle);
}
.ui-search-field__input:focus {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
}
.ui-search-field__input::-webkit-search-cancel-button {
  display: none;
}
.ui-search-field__clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  padding: 2px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: color 0.15s ease;
}
.ui-search-field__clear:hover {
  color: var(--color-text-primary);
}
.ui-search-field--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
