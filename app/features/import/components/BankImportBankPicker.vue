<script setup lang="ts">
import { computed } from "vue";
import { NButton, NRadio, NRadioGroup, NSpace, NText } from "naive-ui";

import {
  BANK_IMPORT_BANK_IDS,
  type BankImportBankId,
} from "~/features/import/model/bank-import";

const props = defineProps<{
  /** Banco já escolhido, quando houver. */
  modelValue: BankImportBankId | null;
  /** Nome do arquivo, para o usuário confirmar que é o certo. */
  fileName: string;
  /** Libera o avanço só quando há banco escolhido. */
  canConfirm: boolean;
  /** Bloqueia a interação enquanto o upload roda. */
  busy?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [bankId: BankImportBankId];
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();

const banks = computed(
  (): readonly { value: BankImportBankId; label: string }[] =>
    BANK_IMPORT_BANK_IDS.map((bank) => ({
      value: bank,
      label: t(`import.bank.banks.${bank}`),
    })),
);

/**
 * Encaminha a escolha do rádio já tipada.
 *
 * @param value Valor cru emitido pelo NRadioGroup.
 */
const onUpdate = (value: string | number | boolean | null): void => {
  const chosen = BANK_IMPORT_BANK_IDS.find((bank) => bank === value);

  if (chosen) {
    emit("update:modelValue", chosen);
  }
};
</script>

<template>
  <!--
    O banco é perguntado ANTES do upload de propósito: subir cego e reagir ao
    `requires_confirmation` do backend gastaria duas das três importações
    gratuitas do mês pelo mesmo arquivo.
  -->
  <div class="bank-picker" data-testid="bank-import-bank-picker">
    <NText depth="3">{{ t("import.bank.pick.description") }}</NText>
    <NText strong class="bank-picker__file">{{ props.fileName }}</NText>

    <NRadioGroup
      :value="props.modelValue"
      :disabled="props.busy"
      :name="'bank-import-bank'"
      @update:value="onUpdate"
    >
      <NSpace vertical>
        <NRadio
          v-for="bank in banks"
          :key="bank.value"
          :value="bank.value"
          :data-testid="`bank-import-bank-${bank.value}`"
        >
          {{ bank.label }}
        </NRadio>
      </NSpace>
    </NRadioGroup>

    <NText depth="3" class="bank-picker__warning">
      {{ t("import.bank.pick.warning") }}
    </NText>

    <div class="bank-picker__actions">
      <NButton quaternary :disabled="props.busy" @click="emit('cancel')">
        {{ t("import.bank.pick.cancel") }}
      </NButton>
      <NButton
        type="primary"
        :disabled="!props.canConfirm || props.busy"
        :loading="props.busy"
        data-testid="bank-import-bank-confirm"
        @click="emit('confirm')"
      >
        {{ t("import.bank.pick.confirm") }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.bank-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.bank-picker__file {
  word-break: break-all;
}

.bank-picker__warning {
  font-size: var(--font-size-sm);
}

.bank-picker__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
