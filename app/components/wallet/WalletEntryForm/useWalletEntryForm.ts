import {
  computed,
  provide,
  reactive,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from "vue";
import type { FormInst, FormRules, SelectOption } from "naive-ui";

import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";
import { useBrapiCurrentQuoteQuery } from "~/features/wallet/queries/use-brapi-current-quote-query";
import { useBrapiHistoricalPriceQuery } from "~/features/wallet/queries/use-brapi-historical-price-query";
import { useBrapiTickerSearchQuery } from "~/features/wallet/queries/use-brapi-ticker-search-query";
import { useDirtyGuard } from "~/composables/useDirtyGuard";

export interface WalletEntryFormState {
  name: string;
  asset_class: string | null;
  ticker: string;
  quantity: number | null;
  unit_price: number | null;
  value: number | null;
  register_date: number | null;
  should_be_on_wallet: boolean;
}

export const WALLET_ENTRY_FORM_KEY: InjectionKey<WalletEntryFormState> =
  Symbol("WalletEntryForm");

const TICKER_BASED_CLASSES = ["stock", "fii", "etf", "bdr", "crypto"] as const;

const ASSET_TYPE_TO_CLASS: Record<string, string> = {
  stock: "stock",
  fii: "fii",
  crypto: "crypto",
  fixed_income: "cdb",
  other: "custom",
};

/**
 * Converts a millisecond timestamp to a YYYY-MM-DD ISO date string.
 *
 * @param ts Unix timestamp in milliseconds.
 * @returns ISO 8601 date string.
 */
function tsToDateString(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Produces a fresh default state for the wallet entry form.
 *
 * @returns Plain object suitable for seeding a reactive form.
 */
function createDefaultFormState(): WalletEntryFormState {
  return {
    name: "",
    asset_class: null,
    ticker: "",
    quantity: null,
    unit_price: null,
    value: null,
    register_date: null,
    should_be_on_wallet: true,
  };
}

export interface UseWalletEntryFormOptions {
  initialEntry: Ref<WalletEntryDto | null | undefined> | ComputedRef<WalletEntryDto | null | undefined>;
  brapiApiKey: string;
  t: (key: string, vars?: Record<string, unknown>) => string;
  emit: {
    (e: "submit", payload: CreateWalletEntryPayload): void;
    (e: "edit", id: string, payload: CreateWalletEntryPayload): void;
    (e: "update:visible", value: boolean): void;
  };
}

/* eslint-disable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- return type inferred from composable shape */
/**
 * Encapsulates form state, BRAPI integration, watchers, validation and submit
 * lifecycle for the WalletEntryForm modal.
 *
 * @param opts Host-supplied reactive `initialEntry`, BRAPI key, translator and emit.
 * @returns Reactive bindings, computed flags, rules, submit/reset handlers and BRAPI fetch state.
 */
export function useWalletEntryForm(opts: UseWalletEntryFormOptions) {
  const { initialEntry, brapiApiKey, t, emit } = opts;
  const { markDirty, reset: resetDirty, guard } = useDirtyGuard();

  const formRef = ref<FormInst | null>(null);
  const form = reactive<WalletEntryFormState>(createDefaultFormState());
  provide(WALLET_ENTRY_FORM_KEY, form);

  const isEditMode = computed((): boolean => !!initialEntry.value);

  const tickerSearchQuery = ref("");
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Debounced handler for NSelect's search event (300ms).
   *
   * @param value Current search value typed by the user.
   */
  function handleTickerSearch(value: string): void {
    if (searchDebounceTimer !== null) { clearTimeout(searchDebounceTimer); }
    searchDebounceTimer = setTimeout(() => {
      tickerSearchQuery.value = value;
    }, 300);
  }

  const hasTicker = computed((): boolean =>
    TICKER_BASED_CLASSES.includes((form.asset_class ?? "") as typeof TICKER_BASED_CLASSES[number])
      && !!form.ticker,
  );
  const isTickerClass = computed((): boolean =>
    TICKER_BASED_CLASSES.includes((form.asset_class ?? "") as typeof TICKER_BASED_CLASSES[number]),
  );
  const showQuantity = computed((): boolean => hasTicker.value);
  const showValue = computed((): boolean => !isTickerClass.value);

  const selectedTicker = computed((): string => isTickerClass.value ? form.ticker : "");
  const registerDateStr = computed((): string =>
    form.register_date ? new Date(form.register_date).toISOString().slice(0, 10) : "",
  );

  const {
    data: tickerSearchResults,
    isFetching: isSearchingTickers,
  } = useBrapiTickerSearchQuery(tickerSearchQuery);
  const {
    data: historicalPrice,
    isFetching: isFetchingHistorical,
    isError: isHistoricalPriceError,
  } = useBrapiHistoricalPriceQuery(selectedTicker, registerDateStr);
  const { data: currentQuote } = useBrapiCurrentQuoteQuery(selectedTicker);

  const isBrapiKeyMissing = computed((): boolean => String(brapiApiKey ?? "").length === 0);

  const tickerOptions = computed((): SelectOption[] =>
    (tickerSearchResults.value ?? []).map((r) => ({
      label: r.name ? `${r.stock} — ${r.name}` : r.stock,
      value: r.stock,
      _brapiName: r.name ?? r.stock,
    })),
  );

  /**
   * Auto-fills the asset name when the user picks a ticker (only if name is empty).
   *
   * @param value Selected ticker value from the dropdown.
   */
  function handleTickerSelect(value: string | null): void {
    if (!value) { return; }
    const option = tickerOptions.value.find((o) => o.value === value) as
      | (SelectOption & { _brapiName?: string })
      | undefined;
    if (option?._brapiName && !form.name) {
      form.name = String(option._brapiName);
    }
  }

  const lastBrapiUnitPrice = ref<number | null>(null);

  watch([selectedTicker, registerDateStr], () => {
    lastBrapiUnitPrice.value = null;
    form.unit_price = null;
  });

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

  const unitPriceTooltipContent = computed((): string => {
    const tradingDate = historicalPrice.value?.date;
    const currency = historicalPrice.value?.currency ?? "BRL";
    if (tradingDate) {
      return t("wallet.form.unitPrice.tooltip", { date: tradingDate, currency });
    }
    return t("wallet.form.unitPrice.tooltipNoDate", { currency });
  });

  const estimatedTotal = computed((): string | null => {
    if (form.quantity === null || form.unit_price === null) { return null; }
    const total = form.quantity * form.unit_price;
    const currency = historicalPrice.value?.currency ?? "BRL";
    return `${currency} ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  const currentQuoteLabel = computed((): string | null => {
    const q = currentQuote.value;
    if (!q) { return null; }
    const sign = q.changePercent >= 0 ? "+" : "";
    const price = q.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = `${sign}${q.changePercent.toFixed(2)}%`;
    return t("wallet.form.currentQuote", { currency: q.currency, price, change: pct });
  });

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
   * Assembles the typed payload expected by the wallet-create mutation.
   *
   * @returns CreateWalletEntryPayload for submission.
   */
  function buildPayload(): CreateWalletEntryPayload {
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
  }

  /** Restores every field and BRAPI-derived value to its default. */
  function resetForm(): void {
    Object.assign(form, createDefaultFormState());
    tickerSearchQuery.value = "";
    lastBrapiUnitPrice.value = null;
    resetDirty();
  }

  /** Validates the form and emits submit or edit depending on edit-mode. */
  async function submit(): Promise<void> {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    const payload = buildPayload();
    if (isEditMode.value && initialEntry.value) {
      emit("edit", initialEntry.value.id, payload);
    } else {
      emit("submit", payload);
    }
    emit("update:visible", false);
    resetForm();
  }

  /** Closes the modal through the dirty-guard confirmation dialog. */
  function closeWithGuard(): void {
    guard(() => {
      emit("update:visible", false);
      resetForm();
    });
  }

  watch(
    () => initialEntry.value,
    (entry) => {
      if (!entry) { return; }
      form.name = entry.name;
      form.asset_class = ASSET_TYPE_TO_CLASS[entry.asset_type] ?? null;
      form.ticker = entry.ticker ?? "";
      form.quantity = entry.quantity;
      form.unit_price = entry.cost_basis !== null && entry.quantity !== null && entry.quantity > 0
        ? entry.cost_basis / entry.quantity
        : null;
      form.value = entry.cost_basis;
      form.register_date = entry.register_date ? new Date(entry.register_date).getTime() : null;
      form.should_be_on_wallet = true;
      lastBrapiUnitPrice.value = null;
    },
    { immediate: false },
  );

  return {
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
    hasTicker,
    showQuantity,
    showValue,
    unitPriceTooltipContent,
    estimatedTotal,
    currentQuoteLabel,
    markDirty,
    handleTickerSearch,
    handleTickerSelect,
    submit,
    resetForm,
    closeWithGuard,
  };
}
/* eslint-enable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
