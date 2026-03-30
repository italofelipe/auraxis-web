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

const props = defineProps<WalletEntryFormProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateWalletEntryPayload];
}>();

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
  const base = `Valor estimado com base no fechamento da bolsa em ${tradingDate ?? "..."}`;
  const extra = tradingDate
    ? ` (${currency}). A data pode diferir do registro se cair em fim de semana ou feriado.`
    : ` (${currency}).`;
  return `${base}${extra} Você pode editar este valor se necessário.`;
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
  return `Cotação atual (${q.currency}): ${price} (${pct})`;
});

// ── Form logic ────────────────────────────────────────────────────────────────

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
 * For ticker-based assets the total cost basis (`value`) is computed as
 * `quantity × unit_price` when the BRAPI estimate (or user override) is available.
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  const computedValue =
    showQuantity.value && form.quantity !== null && form.unit_price !== null
      ? form.quantity * form.unit_price
      : null;

  const payload: CreateWalletEntryPayload = {
    name: form.name,
    asset_class: (form.asset_class as CreateWalletEntryPayload["asset_class"]) ?? undefined,
    ticker: hasTicker.value ? form.ticker || null : null,
    quantity: showQuantity.value ? form.quantity : null,
    value: showValue.value ? form.value : computedValue,
    register_date: form.register_date ? tsToDateString(form.register_date) : "",
    should_be_on_wallet: form.should_be_on_wallet,
  };

  emit("submit", payload);
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
    title="Adicionar ativo"
    class="wallet-entry-form-modal"
    :style="{ maxWidth: '500px', width: '100%' }"
    @update:show="handleClose"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <!-- Asset class — must come first so ticker field appears in the right order -->
      <NFormItem label="Tipo de ativo" path="asset_class">
        <NSelect
          v-model:value="form.asset_class"
          :options="assetClassOptions"
          placeholder="Selecione o tipo"
        />
      </NFormItem>

      <!-- Ticker autocomplete — only shown for ticker-based asset classes -->
      <NFormItem
        v-if="isTickerClass"
        label="Ticker (opcional)"
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
          placeholder="Ex: PETR4, BTC"
          @search="handleTickerSearch"
          @update:value="handleTickerSelect"
        />
      </NFormItem>

      <!-- Asset name — auto-filled from BRAPI on ticker selection -->
      <NFormItem label="Nome do ativo" path="name">
        <NInput v-model:value="form.name" placeholder="Ex: Tesouro Direto IPCA+" />
      </NFormItem>

      <!-- Date of purchase — drives the BRAPI historical price lookup -->
      <NFormItem label="Data de registro" path="register_date">
        <NDatePicker
          v-model:value="form.register_date"
          type="date"
          style="width: 100%"
        />
      </NFormItem>

      <!-- Quantity — only for ticker-based classes -->
      <NFormItem v-if="showQuantity" label="Quantidade" path="quantity">
        <NInputNumber
          v-model:value="form.quantity"
          placeholder="Ex: 100"
          :min="0"
          style="width: 100%"
        />
      </NFormItem>

      <!-- Unit price — pre-filled from BRAPI historical price, always editable -->
      <NFormItem v-if="isTickerClass" path="unit_price">
        <template #label>
          <span class="wallet-entry-form__label-row">
            <span>Preço unitário na data (R$)</span>
            <UiInfoTooltip
              :content="unitPriceTooltipContent"
              label="Informação sobre o preço estimado"
              placement="top"
            />
          </span>
        </template>

        <div class="wallet-entry-form__price-field">
          <NInputNumber
            v-model:value="form.unit_price"
            placeholder="Aguardando ticker e data…"
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
            Total estimado: {{ estimatedTotal }}
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
      <NFormItem v-if="showValue" label="Valor atual (R$)" path="value">
        <NInputNumber
          v-model:value="form.value"
          placeholder="Ex: 5000.00"
          :min="0"
          :precision="2"
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
