import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import FinanciamentoPage from "./financiamento-imobiliario.vue";
import type { FinanciamentoResult } from "~/features/tools/model/financiamento-imobiliario";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockSaveMutateAsync = vi.hoisted(() => vi.fn());
const mockGoalMutateAsync = vi.hoisted(() => vi.fn());
const mockCaptureException = vi.hoisted(() => vi.fn());
const mockValidate = vi.hoisted(() => vi.fn().mockReturnValue([]));
const mockCalculate = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = ref(false);
const mockHasPremiumAccess = ref(false);

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string, params?: Record<string, unknown>) => string; n: (v: number) => string } => ({
    t: (key: string) => key,
    n: (v: number) => String(v),
  }),
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useSeoMeta: vi.fn(),
  useI18n: (): { t: (key: string, params?: Record<string, unknown>) => string; n: (v: number) => string } => ({
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
    template: "<div class='n-alert'><slot /></div>",
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
  NInputNumber: {
    props: ["value", "min", "max", "precision", "prefix", "placeholder"],
    emits: ["update:value"],
    template: "<input class='n-input-number' :value='value' @change='$emit(\"update:value\", $event.target.value ? parseFloat($event.target.value) : null)' />",
  },
  NSpace: {
    props: ["vertical", "size"],
    template: "<div><slot /></div>",
  },
  NTag: {
    props: ["round", "type", "size"],
    template: "<span class='n-tag'><slot /></span>",
  },
  NThing: {
    props: ["title", "description"],
    template: "<div><strong>{{ title }}</strong><span>{{ description }}</span></div>",
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

vi.mock("~/features/tools/composables/useToolCta", () => ({
  useToolCta: (): { showCta: ComputedRef<boolean> } => ({
    showCta: computed(() => !mockIsAuthenticated.value),
  }),
}));

vi.mock("~/composables/useApiError", () => ({
  useApiError: (): { getErrorMessage: (err: unknown) => string } => ({ getErrorMessage: vi.fn((err: unknown): string => String(err)) }),
}));
vi.mock("~/core/observability", () => ({
  captureException: mockCaptureException,
}));

vi.mock("~/features/tools/model/financiamento-imobiliario", () => ({
  FINANCIAMENTO_TABLE_YEAR: 2025,
  createDefaultFinanciamentoFormState: (): {
    propertyValue: null;
    downPaymentPct: number;
    termMonths: number;
    annualRatePct: null;
    insuranceMonthly: number;
    adminFeeMonthly: number;
  } => ({
    propertyValue: null,
    downPaymentPct: 20,
    termMonths: 360,
    annualRatePct: null,
    insuranceMonthly: 0,
    adminFeeMonthly: 0,
  }),
  validateFinanciamentoForm: mockValidate,
  calculateFinanciamento: mockCalculate,
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
    mutateAsync: typeof mockGoalMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockGoalMutateAsync,
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

const mockScheduleRow = { month: 1, payment: 3800, amortization: 1111, interest: 2689, balance: 398889 };

const mockResult: FinanciamentoResult = {
  loanAmount: 400000,
  downPayment: 100000,
  sac: {
    firstPayment: 3800,
    lastPayment: 1122,
    totalPaid: 590000,
    totalInterest: 190000,
    schedule: [mockScheduleRow],
  },
  price: {
    firstPayment: 3700,
    lastPayment: 3700,
    totalPaid: 620000,
    totalInterest: 220000,
    schedule: [mockScheduleRow],
  },
  monthlyRate: 0.00949,
  cetEstimatedPct: 11.2,
};

const globalStubs = {
  NuxtLayout: {
    props: ["name"],
    template: "<div class='nuxt-layout'><slot /></div>",
  },
  UiPageHeader: {
    props: ["title", "subtitle"],
    template: "<div class='ui-page-header'><h1>{{ title }}</h1><p>{{ subtitle }}</p></div>",
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
    template: "<div class='tool-guest-cta'>toolGuestCta.registerCta</div>",
  },
};

/**
 * Installs a minimal Nuxt context so composables can resolve.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: { path: "/tools/financiamento-imobiliario", meta: {}, params: {}, query: {} },
    $router: { push: mockPush, replace: vi.fn() },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: {
      head: {
        push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })),
      },
    },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    runWithContext: <T>(callback: () => T): T => callback(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  };
  Reflect.set(app, "$nuxt", fakeNuxtApp);
}

/**
 * Mounts the page with minimal Nuxt test context.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(FinanciamentoPage, {
    global: {
      plugins: [{ install: nuxtContextPlugin }],
      stubs: globalStubs,
    },
  });
}

/**
 * Resets all hoisted mocks between tests.
 */
function resetPageState(): void {
  setActivePinia(createPinia());
  mockPush.mockClear();
  mockSaveMutateAsync.mockReset();
  mockGoalMutateAsync.mockReset();
  mockCaptureException.mockClear();
  mockValidate.mockReturnValue([]);
  mockCalculate.mockReset();
  mockIsAuthenticated.value = false;
  mockHasPremiumAccess.value = false;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FinanciamentoImobiliarioPage — layout", () => {
  beforeEach(() => { resetPageState(); });

  it("renders public hero and brand header when unauthenticated", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
    expect(wrapper.text()).toContain("financiamentoImobiliario.hero.title");
  });

  it("shows ToolGuestCta after calculation (guest)", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".tool-guest-cta").exists()).toBe(true);
  });

  it("shows NuxtLayout and no standalone header when authenticated", () => {
    mockIsAuthenticated.value = true;
    const wrapper = mountPage();
    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta").exists()).toBe(false);
  });
});

describe("FinanciamentoImobiliarioPage — form validation", () => {
  beforeEach(() => { resetPageState(); });

  it("shows a validation error when propertyValue is missing", async () => {
    mockValidate.mockReturnValue([
      { field: "propertyValue", messageKey: "errors.propertyValueRequired" },
    ]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".n-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("financiamentoImobiliario.errors.propertyValueRequired");
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it("shows a validation error when annualRatePct is missing", async () => {
    mockValidate.mockReturnValue([
      { field: "annualRatePct", messageKey: "errors.annualRateRequired" },
    ]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("financiamentoImobiliario.errors.annualRateRequired");
  });

  it("clears the validation error on a valid submit", async () => {
    mockValidate
      .mockReturnValueOnce([{ field: "propertyValue", messageKey: "errors.propertyValueRequired" }])
      .mockReturnValue([]);
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("financiamentoImobiliario.errors.propertyValueRequired");
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).not.toContain("financiamentoImobiliario.errors.propertyValueRequired");
  });
});

describe("FinanciamentoImobiliarioPage — calculation result", () => {
  beforeEach(() => { resetPageState(); });

  it("shows CalculatorResultSummary with loanAmount after valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const summary = wrapper.find(".calculator-result-summary");
    expect(summary.exists()).toBe(true);
    expect(summary.text()).toContain("financiamentoImobiliario.results.loanAmount");
  });

  it("shows comparison table after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".fin-imob-page__comparison-table").exists()).toBe(true);
  });

  it("shows CET estimate and disclaimer after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("financiamentoImobiliario.results.cetEstimated");
    expect(wrapper.text()).toContain("financiamentoImobiliario.disclaimer.cet");
  });

  it("does not show results before calculation", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
    expect(wrapper.find(".fin-imob-page__comparison-table").exists()).toBe(false);
  });
});

describe("FinanciamentoImobiliarioPage — save simulation", () => {
  beforeEach(() => { resetPageState(); });

  it("calls saveSimulationMutation with financiamento_imobiliario slug", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-fin-001" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("financiamentoImobiliario.actions.save"),
    );
    expect(saveButton).toBeDefined();
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
    expect(mockSaveMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ toolSlug: "financiamento_imobiliario" }),
    );
  });

  it("captures exception when save simulation fails", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockRejectedValue(new Error("network error"));
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("financiamentoImobiliario.actions.save"),
    );
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe("FinanciamentoImobiliarioPage — premium goal", () => {
  beforeEach(() => { resetPageState(); });

  it("shows add-as-goal button only for premium users", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("financiamentoImobiliario.actions.addAsGoal"),
    );
    expect(goalButton).toBeDefined();
  });

  it("calls createGoalMutation with loanAmount as target_amount", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-fin-002" });
    mockGoalMutateAsync.mockResolvedValue({ id: "goal-001" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("financiamentoImobiliario.actions.addAsGoal"),
    );
    await goalButton!.trigger("click");
    await flushPromises();
    expect(mockGoalMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ target_amount: mockResult.loanAmount }),
    );
  });
});
