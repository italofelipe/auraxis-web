<script setup lang="ts">
import { computed, ref, watch, type InputHTMLAttributes } from "vue";
import { NInput } from "naive-ui";

import {
  formatCurrencyCentsInput,
  normalizeCurrencyNumber,
  parseCurrencyCentsInput,
} from "~/utils/currencyInput";

defineOptions({ name: "UiMoneyInput" });

const props = withDefaults(defineProps<{
  value: number | null;
  placeholder?: string;
  min?: number;
  disabled?: boolean;
  clearable?: boolean;
}>(), {
  placeholder: "R$ 0,00",
  min: 0,
  disabled: false,
  clearable: false,
});

const emit = defineEmits<{
  "update:value": [value: number | null];
}>();

const inputProps = computed<InputHTMLAttributes>(() => ({
  "aria-valuemin": String(props.min),
  inputmode: "numeric",
}));

const displayValue = ref(formatCurrencyCentsInput(props.value));

watch(
  () => props.value,
  (value) => {
    displayValue.value = formatCurrencyCentsInput(value);
  },
);

/**
 * Keeps all money forms on a finite number-or-null contract while updating
 * the visible text immediately, without waiting for blur.
 *
 * @param rawValue Raw input value typed by the user.
 */
const onUpdate = (rawValue: string): void => {
  const parsed = normalizeCurrencyNumber(parseCurrencyCentsInput(rawValue));
  displayValue.value = formatCurrencyCentsInput(parsed);
  emit("update:value", parsed);
};
</script>

<template>
  <NInput
    class="ui-money-input"
    :value="displayValue"
    :placeholder="props.placeholder"
    :clearable="props.clearable"
    :disabled="props.disabled"
    :input-props="inputProps"
    style="width: 100%"
    @update:value="onUpdate"
  />
</template>
