import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type App } from "vue";

import FiiPage from "./fii.vue";
import type { FiiResult } from "~/features/tools/model/fii";
import type { BrapiFiiQuoteResult } from "~/features/tools/services/brapi-tools.client";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockSaveMutateAsync = vi.hoisted(() => vi.fn());
const mockCreateGoalMutateAsync = vi.hoisted(() => vi.fn());
const mockCaptureException = vi.hoisted(() => vi.fn());
const mockValidate = vi.hoisted(() => vi.fn().mockReturnValue([]));
const mockCalculate = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = ref(false);
const mockHasPremiumAccess = ref(false);
const mockFiiData = ref<BrapiFiiQuoteResult | null | undefined>(undefined);
const mockFiiIsPending = ref(false);
const mockFiiIsError = ref(false);

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string, params?: Record<string, unknown>) => string; n: (v: number, opts?: unknown) => string } => ({
    t: (key: string) => key,
    n: (v: number) => String(v),
  }),
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useSeoMeta: vi.fn(),
  useI18n: (): { t: (key: string, params?: Record<string, unknown>) => string; n: (v: number, opts?: unknown) => string } => ({
    t: (key: string) => key,
    n: (v: number) => String(v),
  }),
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

vi.mock("#app", () => ({
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

vi.mock("naive-ui", () => ({
  NAlert: {
    props: ["type"],
    template: "<div class='n-alert' :data-alert-type='type'><slot /></div>",
  },
  NButton: {
    props: ["type", "size", "loading", "disabled", "quaternary", "block", "attrType"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NForm: {
    emits: ["submit"],
    template: "<form @submit.prevent='$emit(\"submit\", $event)'><slot /></form>",
  },
  NFormItem: {
    props: ["label"],
    template: "<div class='n-form-item'><slot /></div>",
  },
  NInput: {
    props: ["value", "placeholder"],
    emits: ["update:value"],
    template: "<input class='n-input' :value='value' @input='$emit(\"update:value\", $event.target.value)' />",
  },
  NInputNumber: {
    props: ["value", "min", "max", "precision", "prefix", "placeholder"],
    emits: ["update:value"],
    template: "<input class='n-input-number' :value='value' @change='$emit(\"update:value\", $event.target.value ? parseFloat($event.target.value) : null)' />",
  },
  NSelect: {
    props: ["value", "options"],
    emits: ["update:value"],
    template: "<select class='n-select' :value='value' @change='$emit(\"update:value\", $event.target.value)'><option v-for='opt in options' :key='opt.value' :value='opt.value'>{{ opt.label }}</option></select>",
  },
  NSpace: {
    props: ["vertical", "size"],
    template: "<div><slot /></div>",
  },
  NTag: {
    props: ["round", "type"],
    template: "<span class='n-tag'><slot /></span>",
  },
  NSpin: {
    template: "<div class='n-spin'></div>",
  },
  useMessage: vi.fn(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() })),
}));

vi.mock("@tanstack/vue-query", async () => {
  const actual = await vi.importActual("@tanstack/vue-query");
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: mockHasPremiumAccess,
      isLoading: ref(false),
      isPending: ref(false),
      isError: ref(false),
    })),
    useMutation: vi.fn(() => ({
      mutateAsync: mockSaveMutateAsync,
      isPending: ref(false),
      isError: ref(false),
    })),
  };
});

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { isAuthenticated: boolean } => ({
    get isAuthenticated(): boolean {
      return mockIsAuthenticated.value;
    },
  }),
}));

vi.mock("~/composables/useApiError", () => ({
  useApiError: (): { getErrorMessage: (err: unknown) => string } => ({ getErrorMessage: vi.fn((err: unknown): string => String(err)) }),
}));
vi.mock("~/core/observability", () => ({
  captureException: mockCaptureException,
}));

vi.mock("~/features/tools/model/fii", async () => {
  const actual = await vi.importActual("~/features/tools/model/fii");
  return {
    ...(actual as object),
    validateFiiForm: mockValidate,
    calculateFii: mockCalculate,
  };
});

vi.mock("~/features/tools/queries/use-brapi-fii-quote-query", () => ({
  useBrapiFiiQuoteQuery: (): {
    data: typeof mockFiiData;
    isPending: typeof mockFiiIsPending;
    isError: typeof mockFiiIsError;
  } => ({
    data: mockFiiData,
    isPending: mockFiiIsPending,
    isError: mockFiiIsError,
  }),
}));

vi.mock("~/features/simulations/queries/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: (): {
    mutateAsync: typeof mockSaveMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/goals/queries/use-create-goal-mutation", () => ({
  useCreateGoalMutation: (): {
    mutateAsync: typeof mockCreateGoalMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockCreateGoalMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: (): {
    data: typeof mockHasPremiumAccess;
    isLoading: ReturnType<typeof ref<boolean>>;
  } => ({
    data: mockHasPremiumAccess,
    isLoading: ref(false),
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockResult: FiiResult = {
  currentPrice: 10.50,
  lastDividend: 0.09,
  avgDividend12m: 0.09,
  dividendYield: 10.29,
  yieldOnCost: 11.25,
  monthlyIncome: 90,
  annualIncome: 1080,
  vsCdiPremium: -0.36,
  isAboveCdi: false,
  dividendCount: 12,
};

const globalStubs = {
  NuxtLayout: {
    props: ["name"],
    template: "<div class='nuxt-layout'><slot /></div>",
  },
  UiPageHeader: {
    props: ["title", "subtitle"],
    template: "<div class='ui-page-header'><h1>{{ title }}</h1></div>",
  },
  UiGlassPanel: {
    props: ["glow"],
    template: "<div class='ui-glass-panel'><slot /></div>",
  },
  UiSurfaceCard: { template: "<div class='ui-surface-card'><slot /></div>" },
  UiStickySummaryCard: { template: "<div class='ui-sticky-summary-card'><slot /></div>" },
  CalculatorFormSection: {
    props: ["title"],
    template: "<div class='calculator-form-section'><slot /></div>",
  },
  CalculatorResultSummary: {
    props: ["label", "value", "metrics"],
    template: "<div class='calculator-result-summary'>{{ label }}: {{ value }}</div>",
  },
  ToolGuestCta: {
    template: "<div class='tool-guest-cta'>toolGuestCta</div>",
  },
  ToolSaveResult: {
    props: ["intent", "label", "amount", "description"],
    template: "<div class='tool-save-result-stub' />",
  },
};

/**
 * Builds a minimal fake Nuxt app for test context.
 *
 * @returns Fake Nuxt app object.
 */
function buildFakeNuxtApp(): Record<string, unknown> {
  return {
    _route: { path: "/tools/fii", meta: {}, params: {}, query: {} },
    $router: { push: mockPush, replace: vi.fn() },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: {
      head: { push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })) },
    },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    runWithContext: <T>(callback: () => T): T => callback(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  };
}

/**
 * Installs a minimal Nuxt context for composable resolution.
 *
 * @param app - Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", buildFakeNuxtApp());
}

/**
 * Mounts the FII page with minimal Nuxt test context.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(FiiPage, {
    global: {
      plugins: [{ install: nuxtContextPlugin }],
      stubs: globalStubs,
    },
  });
}

/**
 * Resets all mocks and local state between tests.
 */
function resetPageState(): void {
  setActivePinia(createPinia());
  mockPush.mockClear();
  mockSaveMutateAsync.mockReset();
  mockCreateGoalMutateAsync.mockReset();
  mockCaptureException.mockClear();
  mockValidate.mockReturnValue([]);
  mockCalculate.mockReset();
  mockIsAuthenticated.value = false;
  mockHasPremiumAccess.value = false;
  mockFiiData.value = undefined;
  mockFiiIsPending.value = false;
  mockFiiIsError.value = false;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FiiPage — layout", () => {
  beforeEach(() => {
    resetPageState();
  });

  it("renders the public hero and brand header when unauthenticated", () => {
    const wrapper = mountPage();

    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
    expect(wrapper.text()).toContain("fii.hero.title");
  });

  it("shows NuxtLayout and no standalone header when authenticated", () => {
    mockIsAuthenticated.value = true;
    const wrapper = mountPage();

    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta").exists()).toBe(false);
  });

  it("shows the guest CTA after calculation", async () => {
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".tool-guest-cta").exists()).toBe(true);
  });
});

describe("FiiPage — BRAPI states", () => {
  beforeEach(() => {
    resetPageState();
  });

  it("shows loading spinner when BRAPI query is pending", async () => {
    mockFiiIsPending.value = true;
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find("[data-testid='loading-spinner']").exists()).toBe(true);
  });

  it("does not show loading spinner when query is not pending", () => {
    mockFiiIsPending.value = false;
    const wrapper = mountPage();

    expect(wrapper.find("[data-testid='loading-spinner']").exists()).toBe(false);
  });

  it("shows BRAPI unavailable alert when query has error", async () => {
    mockFiiIsError.value = true;
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find("[data-testid='brapi-error-alert']").exists()).toBe(true);
  });

  it("does not show BRAPI error alert when query is OK", () => {
    mockFiiIsError.value = false;
    const wrapper = mountPage();

    expect(wrapper.find("[data-testid='brapi-error-alert']").exists()).toBe(false);
  });
});

describe("FiiPage — calculation result", () => {
  beforeEach(() => {
    resetPageState();
  });

  it("shows CalculatorResultSummary after valid calculation", async () => {
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".calculator-result-summary").exists()).toBe(true);
  });

  it("shows CVM disclaimer after calculation", async () => {
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-testid='cvm-disclaimer']").exists()).toBe(true);
  });

  it("does not show results before calculation", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
  });

  it("shows CVM disclaimer with error type (regulatory)", async () => {
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const cvm = wrapper.find("[data-testid='cvm-disclaimer']");
    expect(cvm.exists()).toBe(true);
    expect(cvm.attributes("data-alert-type")).toBe("error");
  });

  it("shows validation error when form is invalid", async () => {
    mockValidate.mockReturnValue([
      { field: "ticker", messageKey: "errors.tickerRequired" },
    ]);
    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".n-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("fii.errors.tickerRequired");
  });
});

describe("FiiPage — save simulation", () => {
  beforeEach(() => {
    resetPageState();
  });

  it("calls saveSimulationMutation with fii_calculator slug", async () => {
    mockIsAuthenticated.value = true;
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-fii-001" });

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const saveButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("fii.actions.save"),
    );
    expect(saveButton).toBeDefined();
    await saveButton!.trigger("click");
    await flushPromises();

    expect(mockSaveMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ toolSlug: "fii_calculator" }),
    );
  });

  it("captures exception when save simulation fails", async () => {
    mockIsAuthenticated.value = true;
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockRejectedValue(new Error("save failed"));

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const saveButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("fii.actions.save"),
    );
    await saveButton!.trigger("click");
    await flushPromises();

    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe("FiiPage — add as goal (premium)", () => {
  beforeEach(() => {
    resetPageState();
  });

  it("shows add-as-goal button for premium users after calculation", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-testid='add-as-goal-btn']").exists()).toBe(true);
  });

  it("calls createGoalMutation with annualIncome as target_amount", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);
    mockCreateGoalMutateAsync.mockResolvedValue({ id: "goal-fii-001" });

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    await wrapper.find("[data-testid='add-as-goal-btn']").trigger("click");
    await flushPromises();

    expect(mockCreateGoalMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ target_amount: mockResult.annualIncome }),
    );
  });

  it("does not show add-as-goal button for free users", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = false;
    mockFiiData.value = { symbol: "MXRF11" } as BrapiFiiQuoteResult;
    mockCalculate.mockReturnValue(mockResult);

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-testid='add-as-goal-btn']").exists()).toBe(false);
  });
});
