<script setup lang="ts">
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NSwitch,
  NButton,
  NSpace,
  type FormInst,
  type FormRules,
} from "naive-ui";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";
import type { WalletEntryFormProps } from "./WalletEntryForm.types";

const props = defineProps<WalletEntryFormProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateWalletEntryPayload];
}>();

const formRef = ref<FormInst | null>(null);

const form = reactive({
  name: "",
  asset_class: null as string | null,
  ticker: "",
  quantity: null as number | null,
  value: null as number | null,
  register_date: null as number | null,
  should_be_on_wallet: true,
});

/** Whether the current asset class expects a ticker symbol. */
const tickerBasedClasses = ["stock", "fii", "etf", "bdr", "crypto"];

const hasTicker = computed((): boolean => {
  return tickerBasedClasses.includes(form.asset_class ?? "") && !!form.ticker;
});

const showQuantity = computed((): boolean => hasTicker.value);

const showValue = computed((): boolean => !hasTicker.value);

/** Asset class options with PT-BR labels. */
const assetClassOptions = [
  { label: "Ação", value: "stock" },
  { label: "FII", value: "fii" },
  { label: "ETF", value: "etf" },
  { label: "BDR", value: "bdr" },
  { label: "Criptomoeda", value: "crypto" },
  { label: "CDB / Renda Fixa", value: "cdb" },
  { label: "Personalizado", value: "custom" },
];

const rules = computed((): FormRules => ({
  name: [{ required: true, message: "Informe o nome do ativo", trigger: "blur" }],
  asset_class: [{ required: true, message: "Selecione o tipo de ativo", trigger: "change" }],
  ticker: tickerBasedClasses.includes(form.asset_class ?? "")
    ? []
    : [],
  quantity: showQuantity.value
    ? [{ required: true, type: "number", message: "Informe a quantidade", trigger: ["blur", "change"] }]
    : [],
  value: showValue.value
    ? [{ required: true, type: "number", message: "Informe o valor atual", trigger: ["blur", "change"] }]
    : [],
  register_date: [{ required: true, type: "number", message: "Selecione a data", trigger: "change" }],
}));

/**
 * Converts a Unix timestamp (ms) produced by NDatePicker to an ISO date string.
 *
 * @param ts - Unix timestamp in milliseconds.
 * @returns ISO 8601 date string (YYYY-MM-DD).
 */
const tsToDateString = (ts: number): string => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Validates the form and emits the submit event with the typed payload.
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  const payload: CreateWalletEntryPayload = {
    name: form.name,
    asset_class: (form.asset_class as CreateWalletEntryPayload["asset_class"]) ?? undefined,
    ticker: hasTicker.value ? form.ticker || null : null,
    quantity: showQuantity.value ? form.quantity : null,
    value: showValue.value ? form.value : null,
    register_date: form.register_date ? tsToDateString(form.register_date) : "",
    should_be_on_wallet: form.should_be_on_wallet,
  };

  emit("submit", payload);
  emit("update:visible", false);
  resetForm();
};

/** Resets the form state to initial values. */
const resetForm = (): void => {
  form.name = "";
  form.asset_class = null;
  form.ticker = "";
  form.quantity = null;
  form.value = null;
  form.register_date = null;
  form.should_be_on_wallet = true;
};

/**
 * Closes the modal and resets the form state.
 */
const handleClose = (): void => {
  emit("update:visible", false);
  resetForm();
};
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    title="Adicionar ativo"
    class="wallet-entry-form-modal"
    :style="{ maxWidth: '480px', width: '100%' }"
    @update:show="handleClose"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="Nome do ativo" path="name">
        <NInput v-model:value="form.name" placeholder="Ex: Tesouro Direto IPCA+" />
      </NFormItem>

      <NFormItem label="Tipo de ativo" path="asset_class">
        <NSelect
          v-model:value="form.asset_class"
          :options="assetClassOptions"
          placeholder="Selecione o tipo"
        />
      </NFormItem>

      <NFormItem
        v-if="tickerBasedClasses.includes(form.asset_class ?? '')"
        label="Ticker (opcional)"
        path="ticker"
      >
        <NInput v-model:value="form.ticker" placeholder="Ex: PETR4, BTC" />
      </NFormItem>

      <NFormItem v-if="showQuantity" label="Quantidade" path="quantity">
        <NInputNumber
          v-model:value="form.quantity"
          placeholder="Ex: 100"
          :min="0"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem v-if="showValue" label="Valor atual (R$)" path="value">
        <NInputNumber
          v-model:value="form.value"
          placeholder="Ex: 5000.00"
          :min="0"
          :precision="2"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem label="Data de registro" path="register_date">
        <NDatePicker
          v-model:value="form.register_date"
          type="date"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem label="Incluir no patrimônio" path="should_be_on_wallet">
        <NSwitch v-model:value="form.should_be_on_wallet" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">Cancelar</NButton>
        <NButton type="primary" @click="handleSubmit">Salvar</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.wallet-entry-form-modal {
  color: var(--color-text-primary);
}
</style>
