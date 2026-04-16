<script setup lang="ts">
import { toRef } from "vue";
import { NButton, NForm, NModal, NSpace } from "naive-ui";

import WalletEntryFormFields from "./WalletEntryFormFields.vue";
import type { WalletEntryFormProps } from "./WalletEntryForm.types";
import { useWalletEntryForm } from "./useWalletEntryForm";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";

const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();

const props = defineProps<WalletEntryFormProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateWalletEntryPayload];
  edit: [id: string, payload: CreateWalletEntryPayload];
}>();

const initialEntryRef = toRef(props, "initialEntry");

const {
  formRef,
  form,
  isEditMode,
  rules,
  assetClassOptions,
  tickerOptions,
  isSearchingTickers,
  isFetchingHistorical,
  isHistoricalPriceError,
  isBrapiKeyMissing,
  isTickerClass,
  showQuantity,
  showValue,
  unitPriceTooltipContent,
  estimatedTotal,
  currentQuoteLabel,
  markDirty,
  handleTickerSearch,
  handleTickerSelect,
  submit,
  closeWithGuard,
} = useWalletEntryForm({
  initialEntry: initialEntryRef,
  brapiApiKey: String(runtimeConfig.public.brapiApiKey ?? ""),
  t,
  emit,
});
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="isEditMode ? $t('wallet.form.titleEdit') : $t('wallet.form.title')"
    class="wallet-entry-form-modal"
    :style="{ maxWidth: '500px', width: '100%' }"
    @update:show="closeWithGuard"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <WalletEntryFormFields
        :asset-class-options="assetClassOptions"
        :ticker-options="tickerOptions"
        :is-searching-tickers="isSearchingTickers"
        :is-fetching-historical="isFetchingHistorical"
        :is-historical-price-error="isHistoricalPriceError"
        :is-brapi-key-missing="isBrapiKeyMissing"
        :is-ticker-class="isTickerClass"
        :show-quantity="showQuantity"
        :show-value="showValue"
        :unit-price-tooltip-content="unitPriceTooltipContent"
        :estimated-total="estimatedTotal"
        :current-quote-label="currentQuoteLabel"
        @dirty="markDirty"
        @ticker-search="handleTickerSearch"
        @ticker-select="handleTickerSelect"
      />
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="closeWithGuard">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="submit">
          {{ isEditMode ? $t('wallet.form.saveEdit') : $t('common.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.wallet-entry-form-modal {
  color: var(--color-text-primary);
}
</style>
