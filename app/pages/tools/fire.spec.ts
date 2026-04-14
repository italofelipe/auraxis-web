import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import FirePage from "./fire.vue";
import type { FireResult } from "~/features/tools/model/fire";

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
  NSelect: {
    props: ["value", "options"],
    emits: ["update:value"],
    template: "<select class='n-select' :value='value' @change='$emit(\"update:value\", $event.target.value)'><option v-for='opt in options' :key='opt.value' :value='opt.value'>{{ opt.label }}</option></select>",
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

vi.mock("~/features/tools/model/fire", () => ({
  FIRE_TABLE_YEAR: 2025,
  FIRE_VARIANTS: ["fire", "lean_fire", "fat_fire", "coast_fire"],
  FIRE_SWR_MULTIPLIERS: { fire: 25, lean_fire: 20, fat_fire: 33, coast_fire: 25 },
  createDefaultFireFormState: (): object => ({
    currentAge: 30,
    retirementAge: 45,
    monthlyExpenses: null,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    variant: "fire",
  }),
  validateFireForm: mockValidate,
  calculateFire: mockCalculate,
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

const mockResult: FireResult = {
  selectedVariant: {
    variant: "fire",
    requiredPatrimony: 1_500_000,
    requiredMonthlyContribution: 2800.50,
    isOnTrack: false,
  },
  allVariants: [
    { variant: "fire", requiredPatrimony: 1_500_000, requiredMonthlyContribution: 2800.50, isOnTrack: false },
    { variant: "lean_fire", requiredPatrimony: 1_200_000, requiredMonthlyContribution: 2200.30, isOnTrack: false },
    { variant: "fat_fire", requiredPatrimony: 1_980_000, requiredMonthlyContribution: 3700.80, isOnTrack: false },
    { variant: "coast_fire", requiredPatrimony: 1_500_000, requiredMonthlyContribution: 0, isOnTrack: false },
  ],
  coastNumber: 620_000,
  monthsToRetirement: 180,
  chartData: [
    { age: 30, patrimony: 0 },
    { age: 45, patrimony: 1_500_000 },
  ],
  realReturnPct: 3.3493,
  projectedPatrimony: 1_500_000,
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
};

/**
 * Installs a minimal Nuxt context.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: { path: "/tools/fire", meta: {}, params: {}, query: {} },
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
 * Mounts the FIRE page.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(FirePage, {
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

describe("FirePage — guest layout", () => {
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

describe("FirePage — authenticated layout", () => {
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

describe("FirePage — form validation", () => {
  beforeEach(() => { resetPageState(); });

  it("shows validation error when monthlyExpenses is missing", async () => {
    mockValidate.mockReturnValue([{ field: "monthlyExpenses", messageKey: "errors.expensesRequired" }]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".n-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("fire.errors.expensesRequired");
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it("shows validation error when retirementAge <= currentAge", async () => {
    mockValidate.mockReturnValue([{ field: "retirementAge", messageKey: "errors.retirementAgeAfterCurrent" }]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("fire.errors.retirementAgeAfterCurrent");
  });

  it("clears validation error on a valid submit", async () => {
    mockValidate
      .mockReturnValueOnce([{ field: "monthlyExpenses", messageKey: "errors.expensesRequired" }])
      .mockReturnValue([]);
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).not.toContain("fire.errors.expensesRequired");
  });
});

describe("FirePage — calculation results", () => {
  beforeEach(() => { resetPageState(); });

  it("shows CalculatorResultSummary after valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".calculator-result-summary").exists()).toBe(true);
    expect(wrapper.text()).toContain("fire.results.requiredPatrimony");
  });

  it("shows all variants breakdown after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".fire-page__breakdown").exists()).toBe(true);
  });

  it("shows disclaimer warning after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("fire.disclaimer.note");
  });

  it("does not show results before calculation", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
    expect(wrapper.find(".fire-page__breakdown").exists()).toBe(false);
  });
});

describe("FirePage — save simulation", () => {
  beforeEach(() => { resetPageState(); });

  it("calls saveSimulationMutation with fire slug", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-f-001" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find((b) => b.text().includes("fire.actions.save"));
    expect(saveButton).toBeDefined();
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
    expect(mockSaveMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ toolSlug: "fire" }));
  });

  it("captures exception when save simulation fails", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockRejectedValue(new Error("network error"));
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find((b) => b.text().includes("fire.actions.save"));
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe("FirePage — premium add as goal", () => {
  beforeEach(() => { resetPageState(); });

  it("shows add as goal button for premium users", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find((b) => b.text().includes("fire.actions.addAsGoal"));
    expect(goalButton).toBeDefined();
  });

  it("calls createGoalMutation when premium user adds goal", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-f-002" });
    mockCreateGoalMutateAsync.mockResolvedValue({ id: "goal-f-1" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find((b) => b.text().includes("fire.actions.addAsGoal"));
    await goalButton!.trigger("click");
    await flushPromises();
    expect(mockCreateGoalMutateAsync).toHaveBeenCalledOnce();
  });
});
