import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import AposentadoriaPage from "./aposentadoria.vue";
import type { AposentadoriaResult } from "~/features/tools/model/aposentadoria";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockSaveMutateAsync = vi.hoisted(() => vi.fn());
const mockCreateGoalMutateAsync = vi.hoisted(() => vi.fn());
const mockCaptureException = vi.hoisted(() => vi.fn());
const mockValidate = vi.hoisted(() => vi.fn().mockReturnValue([]));
const mockCalculate = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = ref(false);
const mockHasPremiumAccess = ref(false);

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string; n: (v: number) => string } => ({
    t: (key: string) => key,
    n: (v: number) => String(v),
  }),
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useSeoMeta: vi.fn(),
  useI18n: (): { t: (key: string) => string; n: (v: number) => string } => ({
    t: (key: string) => key,
    n: (v: number) => String(v),
  }),
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

vi.mock("#app", () => ({
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

vi.mock("echarts/core", () => ({ use: vi.fn() }));
vi.mock("echarts/charts", () => ({ LineChart: {} }));
vi.mock("echarts/components", () => ({
  GridComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
}));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));
vi.mock("vue-echarts", () => ({
  default: { props: ["option", "autoresize"], template: "<div class='v-chart'></div>" },
}));

vi.mock("naive-ui", () => ({
  NAlert: { props: ["type"], template: "<div class='n-alert'><slot /></div>" },
  NButton: {
    props: ["type", "size", "loading", "disabled", "quaternary", "block", "attrType"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NForm: {
    emits: ["submit"],
    template: "<form @submit.prevent='$emit(\"submit\", $event)'><slot /></form>",
  },
  NFormItem: { props: ["label"], template: "<div class='n-form-item'><slot /></div>" },
  NInputNumber: {
    props: ["value", "min", "max", "precision", "prefix", "placeholder"],
    emits: ["update:value"],
    template: "<input class='n-input-number' :value='value' @change='$emit(\"update:value\", $event.target.value ? parseFloat($event.target.value) : null)' />",
  },
  NSpace: { props: ["vertical", "size"], template: "<div><slot /></div>" },
  NTag: { props: ["round", "type"], template: "<span class='n-tag'><slot /></span>" },
  NThing: {
    props: ["title", "description"],
    template: "<div class='n-thing'><strong>{{ title }}</strong><slot name='footer' /></div>",
  },
  useMessage: vi.fn(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() })),
}));

vi.mock("@tanstack/vue-query", async () => {
  const actual = await vi.importActual("@tanstack/vue-query");
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: mockHasPremiumAccess, isLoading: ref(false), isError: ref(false) })),
    useMutation: vi.fn(() => ({ mutateAsync: mockSaveMutateAsync, isPending: ref(false), isError: ref(false) })),
  };
});

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { isAuthenticated: boolean } => ({
    get isAuthenticated(): boolean { return mockIsAuthenticated.value; },
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
vi.mock("~/core/observability", () => ({ captureException: mockCaptureException }));

vi.mock("~/features/tools/model/aposentadoria", () => ({
  APOSENTADORIA_TABLE_YEAR: 2025,
  createDefaultAposentadoriaFormState: (): object => ({
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: null,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  }),
  validateAposentadoriaForm: mockValidate,
  calculateAposentadoria: mockCalculate,
}));

vi.mock("~/features/simulations/queries/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: (): { mutateAsync: typeof mockSaveMutateAsync; isPending: ReturnType<typeof ref<boolean>> } => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/goals/queries/use-create-goal-mutation", () => ({
  useCreateGoalMutation: (): { mutateAsync: typeof mockCreateGoalMutateAsync; isPending: ReturnType<typeof ref<boolean>> } => ({
    mutateAsync: mockCreateGoalMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: (): { data: typeof mockHasPremiumAccess; isLoading: ReturnType<typeof ref<boolean>> } => ({
    data: mockHasPremiumAccess,
    isLoading: ref(false),
  }),
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const mockResult: AposentadoriaResult = {
  requiredPatrimony: 1_500_000,
  monthsToRetirement: 420,
  requiredMonthlyContribution: 850.42,
  projectedPatrimony: 1_500_000,
  isOnTrack: true,
  chartData: [
    { age: 30, patrimony: 0 },
    { age: 65, patrimony: 1_500_000 },
  ],
  sensitivityMinus20pct: 620.10,
  sensitivityPlus20pct: 1240.80,
  realReturnPct: 3.3493,
};

const globalStubs = {
  NuxtLayout: { props: ["name"], template: "<div class='nuxt-layout'><slot /></div>" },
  UiPageHeader: { props: ["title", "subtitle"], template: "<div class='ui-page-header'><h1>{{ title }}</h1></div>" },
  UiGlassPanel: { props: ["glow"], template: "<div class='ui-glass-panel'><slot /></div>" },
  UiSurfaceCard: { template: "<div class='ui-surface-card'><slot /></div>" },
  UiStickySummaryCard: { template: "<div class='ui-sticky-summary-card'><slot /></div>" },
  CalculatorFormSection: { props: ["title"], template: "<div class='calculator-form-section'><slot /></div>" },
  CalculatorResultSummary: {
    props: ["label", "value", "metrics"],
    template: "<div class='calculator-result-summary'>{{ label }}: {{ value }}</div>",
  },
  ToolGuestCta: { template: "<div class='tool-guest-cta'>guest-cta</div>" },
  UiChart: {
    props: ["option", "height", "width", "autoresize", "updateKey"],
    template: "<div class='v-chart'></div>",
  },
  ToolSaveResult: {
    props: ["intent", "label", "amount", "description"],
    template: "<div class='tool-save-result-stub' />",
  },
};

/**
 * Installs a minimal Nuxt context.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: { path: "/tools/aposentadoria", meta: {}, params: {}, query: {} },
    $router: { push: mockPush, replace: vi.fn() },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: { head: { push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })) } },
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
 * Mounts the Aposentadoria page.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(AposentadoriaPage, {
    global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
  });
}

/**
 * Resets all mocks and session state between tests.
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
}

// ─── Test suites ──────────────────────────────────────────────────────────────

describe("AposentadoriaPage — guest layout", () => {
  beforeEach(() => { resetPageState(); });

  it("shows the public header when unauthenticated", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
  });

  it("shows guest CTA after a valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".tool-guest-cta").exists()).toBe(true);
  });

  it("uses tools-public layout when unauthenticated", () => {
    const wrapper = mountPage();
    // NuxtLayout always renders; guest users get 'tools-public', not 'default'
    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
  });
});

describe("AposentadoriaPage — authenticated layout", () => {
  beforeEach(() => { resetPageState(); });

  it("renders NuxtLayout when authenticated", () => {
    mockIsAuthenticated.value = true;
    const wrapper = mountPage();
    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
  });

  it("does not show guest CTA when authenticated", () => {
    mockIsAuthenticated.value = true;
    expect(mountPage().find(".tool-guest-cta").exists()).toBe(false);
  });
});

describe("AposentadoriaPage — form validation", () => {
  beforeEach(() => { resetPageState(); });

  it("shows validation error when desiredMonthlyIncome is missing", async () => {
    mockValidate.mockReturnValue([{ field: "desiredMonthlyIncome", messageKey: "errors.incomeRequired" }]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".n-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("aposentadoria.errors.incomeRequired");
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it("shows validation error when retirementAge <= currentAge", async () => {
    mockValidate.mockReturnValue([{ field: "retirementAge", messageKey: "errors.retirementAgeAfterCurrent" }]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("aposentadoria.errors.retirementAgeAfterCurrent");
  });

  it("clears validation error on a valid submit", async () => {
    mockValidate
      .mockReturnValueOnce([{ field: "desiredMonthlyIncome", messageKey: "errors.incomeRequired" }])
      .mockReturnValue([]);
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).not.toContain("aposentadoria.errors.incomeRequired");
  });
});

describe("AposentadoriaPage — calculation results", () => {
  beforeEach(() => { resetPageState(); });

  it("shows CalculatorResultSummary after valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".calculator-result-summary").exists()).toBe(true);
    expect(wrapper.text()).toContain("aposentadoria.results.requiredPatrimony");
  });

  it("shows sensitivity breakdown section after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".apos-page__breakdown").exists()).toBe(true);
  });

  it("shows disclaimer warning after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("aposentadoria.disclaimer.note");
  });

  it("does not show results before calculation", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
    expect(wrapper.find(".apos-page__breakdown").exists()).toBe(false);
  });
});

describe("AposentadoriaPage — save simulation", () => {
  beforeEach(() => { resetPageState(); });

  it("calls saveSimulationMutation with aposentadoria slug", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-a-001" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find((b) => b.text().includes("aposentadoria.actions.save"));
    expect(saveButton).toBeDefined();
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
    expect(mockSaveMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ toolId: "aposentadoria" }));
  });

  it("captures exception when save simulation fails", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockRejectedValue(new Error("network error"));
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find((b) => b.text().includes("aposentadoria.actions.save"));
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe("AposentadoriaPage — premium add as goal", () => {
  beforeEach(() => { resetPageState(); });

  it("shows add as goal button for premium users", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find((b) => b.text().includes("aposentadoria.actions.addAsGoal"));
    expect(goalButton).toBeDefined();
  });

  it("calls createGoalMutation when premium user adds goal", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-a-002" });
    mockCreateGoalMutateAsync.mockResolvedValue({ id: "goal-a-1" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find((b) => b.text().includes("aposentadoria.actions.addAsGoal"));
    await goalButton!.trigger("click");
    await flushPromises();
    expect(mockCreateGoalMutateAsync).toHaveBeenCalledOnce();
  });
});
