import { nextTick, ref, defineComponent, h, type Ref, type VNode } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import { useWalletEntryForm } from "./useWalletEntryForm";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

interface HistoricalPrice {
  readonly price: number;
  readonly date: string;
  readonly currency: string;
}

interface CurrentQuote {
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly currency: string;
}

const historicalPriceRef = ref<HistoricalPrice | null>(null);
const currentQuoteRef = ref<CurrentQuote | null>(null);
const tickerSearchResultsRef = ref<Array<{ stock: string; name?: string }>>([]);

vi.mock("~/features/wallet/queries/use-brapi-current-quote-query", () => ({
  useBrapiCurrentQuoteQuery: (): { data: Ref<CurrentQuote | null> } => ({
    data: currentQuoteRef,
  }),
}));

vi.mock("~/features/wallet/queries/use-brapi-historical-price-query", () => ({
  useBrapiHistoricalPriceQuery: (): {
    data: Ref<HistoricalPrice | null>;
    isFetching: Ref<boolean>;
    isError: Ref<boolean>;
  } => ({
    data: historicalPriceRef,
    isFetching: ref(false),
    isError: ref(false),
  }),
}));

vi.mock("~/features/wallet/queries/use-brapi-ticker-search-query", () => ({
  useBrapiTickerSearchQuery: (): {
    data: Ref<Array<{ stock: string; name?: string }>>;
    isFetching: Ref<boolean>;
  } => ({
    data: tickerSearchResultsRef,
    isFetching: ref(false),
  }),
}));

const guardMock = vi.fn<(fn: () => void) => void>((fn) => { fn(); });

vi.mock("~/composables/useDirtyGuard", () => ({
  useDirtyGuard: (): {
    markDirty: () => void;
    reset: () => void;
    guard: (fn: () => void) => void;
  } => ({
    markDirty: vi.fn(),
    reset: vi.fn(),
    guard: guardMock,
  }),
}));

type Emitted = ["submit", CreateWalletEntryPayload] | ["edit", string, CreateWalletEntryPayload] | ["update:visible", boolean];

/**
 * Mounts a test host that instantiates the composable and exposes its API.
 * The host forwards every emit the composable issues into `recorded` so the
 * test can assert the exact payload shape passed to the parent.
 *
 * @param initialEntryRef Optional ref seeding edit-mode state.
 * @param brapiApiKey Optional override for the BRAPI api key (default: "test-key").
 * @returns Composable handle and the list of recorded emits.
 */
function mountHost(
  initialEntryRef: Ref<WalletEntryDto | null> = ref<WalletEntryDto | null>(null),
  brapiApiKey = "test-key",
): {
  api: ReturnType<typeof useWalletEntryForm>;
  recorded: Emitted[];
} {
  const recorded: Emitted[] = [];
  const emit = ((...args: unknown[]): void => {
    recorded.push(args as unknown as Emitted);
  }) as unknown as Parameters<typeof useWalletEntryForm>[0]["emit"];

  let captured: ReturnType<typeof useWalletEntryForm> | null = null;

  const Host = defineComponent({
    setup(): () => VNode {
      captured = useWalletEntryForm({
        initialEntry: initialEntryRef,
        brapiApiKey,
        t: (k: string, vars?: Record<string, unknown>): string =>
          vars ? `${k}:${JSON.stringify(vars)}` : k,
        emit,
      });
      return (): VNode => h("div");
    },
  });

  mount(Host);
  if (!captured) { throw new Error("composable did not initialise"); }
  return { api: captured, recorded };
}

/**
 * Stubs the internal form validator on the composable so submit resolves
 * without exercising naive-ui's rule engine.
 *
 * @param api Handle returned by {@link mountHost}.
 */
function stubValidator(api: ReturnType<typeof useWalletEntryForm>): void {
  api.formRef.value = {
    validate: vi.fn().mockResolvedValue(undefined),
  } as unknown as typeof api.formRef.value;
}

describe("useWalletEntryForm — buildPayload contract with backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    historicalPriceRef.value = null;
    currentQuoteRef.value = null;
    tickerSearchResultsRef.value = [];
  });

  it("omits `value` from the payload when ticker-based asset is selected", async () => {
    const { api, recorded } = mountHost();
    stubValidator(api);

    api.form.asset_class = "stock";
    api.form.ticker = "ITSA4";
    api.form.name = "ITAUSA S.A.";
    api.form.quantity = 2500;
    api.form.unit_price = 14.14;
    api.form.value = 35350;
    api.form.register_date = new Date("2021-07-10T12:00:00Z").getTime();
    await nextTick();

    await api.submit();

    expect(recorded).toHaveLength(2);
    const [event, payload] = recorded[0] as ["submit", CreateWalletEntryPayload];
    expect(event).toBe("submit");
    expect(payload.ticker).toBe("ITSA4");
    expect(payload.quantity).toBe(2500);
    expect("value" in payload).toBe(false);
  });

  it("includes `value` in the payload for non-ticker asset classes", async () => {
    const { api, recorded } = mountHost();
    stubValidator(api);

    api.form.asset_class = "cdb";
    api.form.name = "CDB Banco X";
    api.form.value = 10000;
    api.form.register_date = new Date("2024-01-15T12:00:00Z").getTime();
    await nextTick();

    await api.submit();

    const [event, payload] = recorded[0] as ["submit", CreateWalletEntryPayload];
    expect(event).toBe("submit");
    expect(payload.ticker).toBeNull();
    expect(payload.value).toBe(10000);
  });

  it("does not emit when form validation rejects", async () => {
    const { api, recorded } = mountHost();
    api.formRef.value = {
      validate: vi.fn().mockRejectedValue(new Error("invalid")),
    } as unknown as typeof api.formRef.value;

    await api.submit();

    expect(recorded).toHaveLength(0);
  });
});

describe("useWalletEntryForm — derived state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    historicalPriceRef.value = null;
    currentQuoteRef.value = null;
    tickerSearchResultsRef.value = [];
  });

  it("derives hasTicker/showQuantity/showValue from asset_class and ticker", async () => {
    const { api } = mountHost();

    api.form.asset_class = "stock";
    api.form.ticker = "";
    await nextTick();
    expect(api.isTickerClass.value).toBe(true);
    expect(api.hasTicker.value).toBe(false);
    expect(api.showQuantity.value).toBe(false);
    expect(api.showValue.value).toBe(false);

    api.form.ticker = "PETR4";
    await nextTick();
    expect(api.hasTicker.value).toBe(true);
    expect(api.showQuantity.value).toBe(true);

    api.form.asset_class = "cdb";
    await nextTick();
    expect(api.isTickerClass.value).toBe(false);
    expect(api.showValue.value).toBe(true);
  });

  it("flags isBrapiKeyMissing when the key is empty", () => {
    const { api: withKey } = mountHost(ref(null), "key");
    expect(withKey.isBrapiKeyMissing.value).toBe(false);

    const { api: noKey } = mountHost(ref(null), "");
    expect(noKey.isBrapiKeyMissing.value).toBe(true);
  });

  it("maps ticker search results into select options", async () => {
    tickerSearchResultsRef.value = [
      { stock: "PETR4", name: "Petrobras PN" },
      { stock: "ITSA4" },
    ];
    const { api } = mountHost();
    await nextTick();

    expect(api.tickerOptions.value).toEqual([
      expect.objectContaining({ label: "PETR4 — Petrobras PN", value: "PETR4" }),
      expect.objectContaining({ label: "ITSA4", value: "ITSA4" }),
    ]);
  });

  it("exposes estimatedTotal only when quantity and unit price are set", async () => {
    const { api } = mountHost();
    expect(api.estimatedTotal.value).toBeNull();

    api.form.quantity = 10;
    api.form.unit_price = 42;
    historicalPriceRef.value = { price: 42, date: "2024-01-10", currency: "USD" };
    await nextTick();

    expect(api.estimatedTotal.value).toMatch(/^USD/);
  });

  it("exposes currentQuoteLabel formatted with currency and change", async () => {
    const { api } = mountHost();
    expect(api.currentQuoteLabel.value).toBeNull();

    currentQuoteRef.value = { price: 38.5, change: 0.5, changePercent: 1.32, currency: "BRL" };
    await nextTick();
    expect(api.currentQuoteLabel.value).toContain("wallet.form.currentQuote");

    currentQuoteRef.value = { price: 10, change: -0.1, changePercent: -1, currency: "BRL" };
    await nextTick();
    expect(api.currentQuoteLabel.value).toContain("-1.00%");
  });

  it("returns the tooltip variant with trading date when historicalPrice is present", async () => {
    const { api } = mountHost();
    expect(api.unitPriceTooltipContent.value).toContain("wallet.form.unitPrice.tooltipNoDate");

    historicalPriceRef.value = { price: 10, date: "2024-05-01", currency: "BRL" };
    await nextTick();
    expect(api.unitPriceTooltipContent.value).toContain("wallet.form.unitPrice.tooltip");
  });
});

describe("useWalletEntryForm — interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    historicalPriceRef.value = null;
    currentQuoteRef.value = null;
    tickerSearchResultsRef.value = [];
  });

  it("debounces handleTickerSearch before updating the search query", async () => {
    vi.useFakeTimers();
    tickerSearchResultsRef.value = [];
    const { api } = mountHost();

    api.handleTickerSearch("PE");
    api.handleTickerSearch("PET");
    vi.advanceTimersByTime(150);
    expect(tickerSearchResultsRef.value).toEqual([]);

    vi.advanceTimersByTime(300);
    await nextTick();
    vi.useRealTimers();
  });

  it("autofills the name when a ticker is picked and name is empty", async () => {
    tickerSearchResultsRef.value = [{ stock: "PETR4", name: "Petrobras PN" }];
    const { api } = mountHost();
    await nextTick();

    api.handleTickerSelect("PETR4");
    expect(api.form.name).toBe("Petrobras PN");

    api.form.name = "Custom name";
    api.handleTickerSelect("PETR4");
    expect(api.form.name).toBe("Custom name");

    api.form.name = "";
    api.handleTickerSelect(null);
    expect(api.form.name).toBe("");
  });

  it("resetForm restores defaults", async () => {
    const { api } = mountHost();
    api.form.name = "X";
    api.form.asset_class = "stock";
    api.form.value = 100;
    await nextTick();

    api.resetForm();
    expect(api.form.name).toBe("");
    expect(api.form.asset_class).toBeNull();
    expect(api.form.value).toBeNull();
  });

  it("closeWithGuard emits update:visible and resets via the dirty guard", () => {
    const { api, recorded } = mountHost();
    api.form.name = "Partial";
    api.closeWithGuard();

    expect(guardMock).toHaveBeenCalledOnce();
    expect(recorded).toContainEqual(["update:visible", false]);
    expect(api.form.name).toBe("");
  });

  it("hydrates edit-mode state from initialEntry and emits edit on submit", async () => {
    const entryRef = ref<WalletEntryDto | null>(null);
    const { api, recorded } = mountHost(entryRef);
    stubValidator(api);

    entryRef.value = {
      id: "entry-1",
      user_id: "u",
      name: "CDB",
      asset_type: "fixed_income",
      ticker: null,
      quantity: null,
      cost_basis: 5000,
      register_date: "2023-01-01",
      should_be_on_wallet: true,
      last_known_price: null,
      last_price_updated_at: null,
      current_value: 5000,
      unrealized_gain: 0,
      unrealized_gain_percentage: 0,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    } as unknown as WalletEntryDto;
    await nextTick();

    expect(api.isEditMode.value).toBe(true);
    expect(api.form.asset_class).toBe("cdb");
    expect(api.form.value).toBe(5000);

    await api.submit();
    expect(recorded[0]).toEqual(["edit", "entry-1", expect.objectContaining({ value: 5000 })]);
  });
});
