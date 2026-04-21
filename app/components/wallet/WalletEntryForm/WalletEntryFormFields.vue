<script setup lang="ts">
import { inject } from "vue";
import {
  NDatePicker,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpin,
  NSwitch,
  NText,
  type SelectOption,
} from "naive-ui";

import { WALLET_ENTRY_FORM_KEY, type WalletEntryFormState } from "./useWalletEntryForm";

defineOptions({ name: "WalletEntryFormFields" });

defineProps<{
  assetClassOptions: SelectOption[];
  tickerOptions: SelectOption[];
  isSearchingTickers: boolean;
  isFetchingHistorical: boolean;
  isHistoricalPriceError: boolean;
  isBrapiKeyMissing: boolean;
  isTickerClass: boolean;
  showQuantity: boolean;
  showValue: boolean;
  unitPriceTooltipContent: string;
  estimatedTotal: string | null;
  currentQuoteLabel: string | null;
}>();

const emit = defineEmits<{
  dirty: [];
  "ticker-search": [value: string];
  "ticker-select": [value: string | null];
}>();

const form = inject<WalletEntryFormState>(WALLET_ENTRY_FORM_KEY)!;
</script>

<template>
  <div class="wallet-entry-form-fields">
    <NFormItem :label="$t('wallet.form.assetClass.label')" path="asset_class">
      <NSelect
        v-model:value="form.asset_class"
        :options="assetClassOptions"
        :placeholder="$t('wallet.form.assetClass.placeholder')"
        @update:value="emit('dirty')"
      />
    </NFormItem>

    <NFormItem v-if="isTickerClass" :label="$t('wallet.form.ticker.label')" path="ticker">
      <NSelect
        v-model:value="form.ticker"
        :options="tickerOptions"
        :loading="isSearchingTickers"
        filterable
        remote
        :filter-option="false"
        clearable
        :placeholder="$t('wallet.form.ticker.placeholder')"
        @search="(v: string) => emit('ticker-search', v)"
        @update:value="(v: string | null) => emit('ticker-select', v)"
      />
    </NFormItem>

    <NFormItem :label="$t('wallet.form.name.label')" path="name">
      <NInput
        v-model:value="form.name"
        :placeholder="$t('wallet.form.name.placeholder')"
        @update:value="emit('dirty')"
      />
    </NFormItem>

    <NFormItem :label="$t('wallet.form.registerDate.label')" path="register_date">
      <NDatePicker
        v-model:value="form.register_date"
        type="date"
        style="width: 100%"
        @update:value="emit('dirty')"
      />
    </NFormItem>

    <NFormItem v-if="showQuantity" :label="$t('wallet.form.quantity.label')" path="quantity">
      <NInputNumber
        v-model:value="form.quantity"
        :placeholder="$t('wallet.form.quantity.placeholder')"
        :min="0"
        style="width: 100%"
        @update:value="emit('dirty')"
      />
    </NFormItem>

    <NFormItem v-if="isTickerClass" path="unit_price">
      <template #label>
        <span class="wallet-entry-form__label-row">
          <span>{{ $t('wallet.form.unitPrice.label') }}</span>
          <UiInfoTooltip
            :content="unitPriceTooltipContent"
            :label="$t('wallet.form.unitPrice.label')"
            placement="top"
          />
        </span>
      </template>

      <div class="wallet-entry-form__price-field">
        <NInputNumber
          v-model:value="form.unit_price"
          :placeholder="$t('wallet.form.unitPrice.placeholder')"
          :min="0"
          :precision="2"
          style="width: 100%"
          :disabled="isFetchingHistorical"
          @update:value="emit('dirty')"
        />
        <NSpin v-if="isFetchingHistorical" :size="16" class="wallet-entry-form__price-spin" />
      </div>

      <template v-if="estimatedTotal">
        <NText depth="3" class="wallet-entry-form__hint">
          {{ $t('wallet.form.totalEstimated') }} {{ estimatedTotal }}
        </NText>
      </template>

      <template v-if="currentQuoteLabel">
        <NText depth="3" class="wallet-entry-form__hint">
          {{ currentQuoteLabel }}
        </NText>
      </template>

      <template v-if="(isBrapiKeyMissing || isHistoricalPriceError) && !isFetchingHistorical">
        <NText depth="3" class="wallet-entry-form__hint wallet-entry-form__hint--warning">
          {{ $t('wallet.form.unitPrice.brapiUnavailable') }}
        </NText>
      </template>
    </NFormItem>

    <NFormItem v-if="showValue" :label="$t('wallet.form.value.label')" path="value">
      <NInputNumber
        v-model:value="form.value"
        :placeholder="$t('wallet.form.value.placeholder')"
        :min="0"
        :precision="2"
        style="width: 100%"
        @update:value="emit('dirty')"
      />
    </NFormItem>

    <NFormItem :label="$t('wallet.form.shouldBeOnWallet.label')" path="should_be_on_wallet">
      <NSwitch
        v-model:value="form.should_be_on_wallet"
        @update:value="emit('dirty')"
      />
    </NFormItem>
  </div>
</template>

<style scoped>
.wallet-entry-form__label-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.wallet-entry-form__price-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.wallet-entry-form__price-spin {
  flex-shrink: 0;
}

.wallet-entry-form__hint {
  display: block;
  margin-top: 4px;
  font-size: var(--font-size-xs, 11px);
  line-height: 1.4;
}

.wallet-entry-form__hint--warning {
  color: var(--color-warning);
}
</style>
