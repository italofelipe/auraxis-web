<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NDatePicker,
  NSwitch,
  NButton,
  NSpace,
  NText,
  NSpin,
  type FormInst,
  type FormRules,
  type SelectOption,
} from "naive-ui";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";
import type { WalletEntryFormProps } from "./WalletEntryForm.types";
import { useBrapiTickerSearchQuery } from "~/features/wallet/queries/use-brapi-ticker-search-query";
import { useBrapiHistoricalPriceQuery } from "~/features/wallet/queries/use-brapi-historical-price-query";
import { useBrapiCurrentQuoteQuery } from "~/features/wallet/queries/use-brapi-current-quote-query";

const { t } = useI18n();

const props = defineProps<WalletEntryFormProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateWalletEntryPayload];
  edit: [id: string, payload: CreateWalletEntryPayload];
}>();

/** True when editing an existing entry (initialEntry prop is set). */
const isEditMode = computed((): boolean => !!props.initialEntry);

const formRef = ref<FormInst | null>(null);

const form = reactive({
  name: "",
  asset_class: null as string | null,
  ticker: "" as string,
  quantity: null as number | null,
  unit_price: null as number | null,
  value: null as number | null,
  register_date: null as number | null,
  should_be_on_wallet: true,
});

// ── BRAPI ticker autocomplete ─────────────────────────────────────────────────

/** Reactive search term driving the BRAPI ticker autocomplete. */
const tickerSearchQuery = ref("");

/** Debounce timer handle for the ticker search input. */
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced handler for NSelect's `@search` event.
 * Updates `tickerSearchQuery` 300 ms after the user stops typing.
 *
 * @param value - Current value typed into the select input.
 */
const handleTickerSearch = (value: string): void => {
  if (searchDebounceTimer !== null) { clearTimeout(searchDebounceTimer); }
  searchDebounceTimer = setTimeout(() => {
    tickerSearchQuery.value = value;
  }, 300);
};

/** Whether the current asset class expects a ticker symbol. */
const tickerBasedClasses = ["stock", "fii", "etf", "bdr", "crypto"];

const hasTicker = computed((): boolean =>
  tickerBasedClasses.includes(form.asset_class ?? "") && !!form.ticker,
);

const isTickerClass = computed((): boolean =>
  tickerBasedClasses.includes(form.asset_class ?? ""),
);

const showQuantity = computed((): boolean => hasTicker.value);
const showValue = computed((): boolean => !isTickerClass.value);

/**
 * The ticker value passed to BRAPI queries.
 * Returns an empty string when the current asset class does not use tickers,
 * preventing unnecessary API calls.
 */
const selectedTicker = computed((): string =>
  isTickerClass.value ? form.ticker : "",
);

/**
 * Register date as a YYYY-MM-DD string for the BRAPI historical price query.
 * Returns an empty string until the user picks a date.
 */
const registerDateStr = computed((): string => {
  if (!form.register_date) { return ""; }
  return new Date(form.register_date).toISOString().slice(0, 10);
});

// ── BRAPI queries ─────────────────────────────────────────────────────────────

const {
  data: tickerSearchResults,
  isFetching: isSearchingTickers,
} = useBrapiTickerSearchQuery(tickerSearchQuery);

const {
  data: historicalPrice,
  isFetching: isFetchingHistorical,
} = useBrapiHistoricalPriceQuery(selectedTicker, registerDateStr);

const { data: currentQuote } = useBrapiCurrentQuoteQuery(selectedTicker);

// ── Ticker select options ──────────────────────────────────────────────────────

/** Options for the ticker NSelect, derived from the live BRAPI search results. */
const tickerOptions = computed((): SelectOption[] =>
  (tickerSearchResults.value ?? []).map((r) => ({
    label: r.name ? `${r.stock} — ${r.name}` : r.stock,
    value: r.stock,
    /** Stored for name auto-fill on selection. */
    _brapiName: r.name ?? r.stock,
  })),
);

/**
 * Called when the user selects a ticker from the autocomplete dropdown.
 * Auto-fills the name field if it has not been manually set yet.
 *
 * @param value - The selected ticker symbol.
 */
const handleTickerSelect = (value: string | null): void => {
  if (!value) { return; }
  const option = tickerOptions.value.find((o) => o.value === value) as
    | (SelectOption & { _brapiName?: string })
    | undefined;
  if (option?._brapiName && !form.name) {
    form.name = String(option._brapiName);
  }
};

// ── Unit price auto-fill from BRAPI ──────────────────────────────────────────

/**
 * The last unit price received from BRAPI.
 * Used to detect whether the user has manually edited the field (i.e. the current
 * `form.unit_price` no longer matches the BRAPI value).
 */
const lastBrapiUnitPrice = ref<number | null>(null);

/** Reset price data when ticker or date changes so the field shows fresh estimates. */
watch([selectedTicker, registerDateStr], () => {
  lastBrapiUnitPrice.value = null;
  form.unit_price = null;
});

/**
 * When BRAPI returns a historical price, auto-fill the unit_price field
 * only if:
 *  - The field is still empty (never been set), or
 *  - The field value still matches the last BRAPI value (not manually edited).
 */
watch(
  () => historicalPrice.value,
  (price) => {
    if (!price) { return; }
    if (form.unit_price === null || form.unit_price === lastBrapiUnitPrice.value) {
      form.unit_price = price.price;
      lastBrapiUnitPrice.value = price.price;
    }
  },
);

// ── Derived display values ────────────────────────────────────────────────────

/**
 * Tooltip explaining that the unit price is a BRAPI closing-price estimate.
 * Includes the actual trading date returned by BRAPI when available
 * (may differ from the requested date on non-trading days).
 */
const unitPriceTooltipContent = computed((): string => {
  const tradingDate = historicalPrice.value?.date;
  const currency = historicalPrice.value?.currency ?? "BRL";
  if (tradingDate) {
    return t("wallet.form.unitPrice.tooltip", { date: tradingDate, currency });
  }
  return t("wallet.form.unitPrice.tooltipNoDate", { currency });
});

/**
 * Estimated total cost basis: quantity × unit_price.
 * Shown as an informational label while the user fills the form.
 */
const estimatedTotal = computed((): string | null => {
  if (form.quantity === null || form.unit_price === null) { return null; }
  const total = form.quantity * form.unit_price;
  const currency = historicalPrice.value?.currency ?? "BRL";
  return `${currency} ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

/**
 * Formatted current market quote for display below the unit price field.
 * Includes the price, change, and change percent with a +/- prefix.
 */
const currentQuoteLabel = computed((): string | null => {
  const q = currentQuote.value;
  if (!q) { return null; }
  const sign = q.changePercent >= 0 ? "+" : "";
  const price = q.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = `${sign}${q.changePercent.toFixed(2)}%`;
  return t("wallet.form.currentQuote", { currency: q.currency, price, change: pct });
});

// ── Form logic ────────────────────────────────────────────────────────────────

/** Asset class options with translated labels. */
const assetClassOptions = computed(() => [
  { label: t("wallet.assetClass.stock"), value: "stock" },
  { label: t("wallet.assetClass.fii"), value: "fii" },
  { label: t("wallet.assetClass.etf"), value: "etf" },
  { label: t("wallet.assetClass.bdr"), value: "bdr" },
  { label: t("wallet.assetClass.crypto"), value: "crypto" },
  { label: t("wallet.assetClass.cdb"), value: "cdb" },
  { label: t("wallet.assetClass.custom"), value: "custom" },
]);

const rules = computed((): FormRules => ({
  name: [{ required: true, message: t("wallet.form.required.name"), trigger: "blur" }],
  asset_class: [{ required: true, message: t("wallet.form.required.assetClass"), trigger: "change" }],
  quantity: showQuantity.value
    ? [{ required: true, type: "number", message: t("wallet.form.required.quantity"), trigger: ["blur", "change"] }]
    : [],
  value: showValue.value
    ? [{ required: true, type: "number", message: t("wallet.form.required.value"), trigger: ["blur", "change"] }]
    : [],
  register_date: [{ required: true, type: "number", message: t("wallet.form.required.registerDate"), trigger: "change" }],
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
 * Builds the create-entry payload from the current form state.
 *
 * For ticker-based assets the total cost basis (`value`) is computed as
 * `quantity × unit_price` when the BRAPI estimate (or user override) is available.
 *
 * @returns Typed CreateWalletEntryPayload ready to be submitted.
 */
const buildPayload = (): CreateWalletEntryPayload => {
  const computedValue =
    showQuantity.value && form.quantity !== null && form.unit_price !== null
      ? form.quantity * form.unit_price
      : null;

  return {
    name: form.name,
    asset_class: (form.asset_class as CreateWalletEntryPayload["asset_class"]) ?? undefined,
    ticker: hasTicker.value ? form.ticker || null : null,
    quantity: showQuantity.value ? form.quantity : null,
    value: showValue.value ? form.value : computedValue,
    register_date: form.register_date ? tsToDateString(form.register_date) : "",
    should_be_on_wallet: form.should_be_on_wallet,
  };
};

/**
 * Validates the form then emits the appropriate submit or edit event.
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  const payload = buildPayload();

  if (isEditMode.value && props.initialEntry) {
    emit("edit", props.initialEntry.id, payload);
  } else {
    emit("submit", payload);
  }
  emit("update:visible", false);
  resetForm();
};

/** Resets the form state and all BRAPI-derived values to their initial defaults. */
const resetForm = (): void => {
  form.name = "";
  form.asset_class = null;
  form.ticker = "";
  form.quantity = null;
  form.unit_price = null;
  form.value = null;
  form.register_date = null;
  form.should_be_on_wallet = true;
  tickerSearchQuery.value = "";
  lastBrapiUnitPrice.value = null;
};

/**
 * Pre-fills the form with data from `initialEntry` when the prop changes.
 *
 * This enables the edit-mode UX: the consumer sets `initialEntry` before
 * opening the modal and the form is ready with the existing values.
 */
watch(
  () => props.initialEntry,
  (entry) => {
    if (!entry) { return; }
    form.name = entry.name;
    // Map WalletEntryDto asset_type back to asset_class for the select
    const assetTypeToClass: Record<string, string> = {
      stock: "stock",
      fii: "fii",
      crypto: "crypto",
      fixed_income: "cdb",
      other: "custom",
    };
    form.asset_class = assetTypeToClass[entry.asset_type] ?? null;
    form.ticker = entry.ticker ?? "";
    form.quantity = entry.quantity;
    form.unit_price = entry.cost_basis !== null && entry.quantity !== null && entry.quantity > 0
      ? entry.cost_basis / entry.quantity
      : null;
    form.value = entry.cost_basis;
    form.register_date = entry.register_date
      ? new Date(entry.register_date).getTime()
      : null;
    form.should_be_on_wallet = true;
    lastBrapiUnitPrice.value = null;
  },
  { immediate: false },
);

/** Closes the modal and resets form state. */
const handleClose = (): void => {
  emit("update:visible", false);
  resetForm();
};
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="isEditMode ? $t('wallet.form.titleEdit') : $t('wallet.form.title')"
    class="wallet-entry-form-modal"
    :style="{ maxWidth: '500px', width: '100%' }"
    @update:show="handleClose"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <!-- Asset class — must come first so ticker field appears in the right order -->
      <NFormItem :label="$t('wallet.form.assetClass.label')" path="asset_class">
        <NSelect
          v-model:value="form.asset_class"
          :options="assetClassOptions"
          :placeholder="$t('wallet.form.assetClass.placeholder')"
        />
      </NFormItem>

      <!-- Ticker autocomplete — only shown for ticker-based asset classes -->
      <NFormItem
        v-if="isTickerClass"
        :label="$t('wallet.form.ticker.label')"
        path="ticker"
      >
        <NSelect
          v-model:value="form.ticker"
          :options="tickerOptions"
          :loading="isSearchingTickers"
          filterable
          remote
          :filter-option="false"
          clearable
          :placeholder="$t('wallet.form.ticker.placeholder')"
          @search="handleTickerSearch"
          @update:value="handleTickerSelect"
        />
      </NFormItem>

      <!-- Asset name — auto-filled from BRAPI on ticker selection -->
      <NFormItem :label="$t('wallet.form.name.label')" path="name">
        <NInput v-model:value="form.name" :placeholder="$t('wallet.form.name.placeholder')" />
      </NFormItem>

      <!-- Date of purchase — drives the BRAPI historical price lookup -->
      <NFormItem :label="$t('wallet.form.registerDate.label')" path="register_date">
        <NDatePicker
          v-model:value="form.register_date"
          type="date"
          style="width: 100%"
        />
      </NFormItem>

      <!-- Quantity — only for ticker-based classes -->
      <NFormItem v-if="showQuantity" :label="$t('wallet.form.quantity.label')" path="quantity">
        <NInputNumber
          v-model:value="form.quantity"
          :placeholder="$t('wallet.form.quantity.placeholder')"
          :min="0"
          style="width: 100%"
        />
      </NFormItem>

      <!-- Unit price — pre-filled from BRAPI historical price, always editable -->
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
          />
          <NSpin v-if="isFetchingHistorical" :size="16" class="wallet-entry-form__price-spin" />
        </div>

        <!-- Estimated total cost basis -->
        <template v-if="estimatedTotal">
          <NText depth="3" class="wallet-entry-form__hint">
            {{ $t('wallet.form.totalEstimated') }} {{ estimatedTotal }}
          </NText>
        </template>

        <!-- Current market quote for reference -->
        <template v-if="currentQuoteLabel">
          <NText depth="3" class="wallet-entry-form__hint">
            {{ currentQuoteLabel }}
          </NText>
        </template>
      </NFormItem>

      <!-- Total value — only for non-ticker asset classes -->
      <NFormItem v-if="showValue" :label="$t('wallet.form.value.label')" path="value">
        <NInputNumber
          v-model:value="form.value"
          :placeholder="$t('wallet.form.value.placeholder')"
          :min="0"
          :precision="2"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem :label="$t('wallet.form.shouldBeOnWallet.label')" path="should_be_on_wallet">
        <NSwitch v-model:value="form.should_be_on_wallet" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">
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
</style>
