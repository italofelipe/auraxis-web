import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import ReservaEmergenciaPage from "./reserva-emergencia.vue";
import type { ReservaEmergenciaResult } from "~/features/tools/model/reserva-emergencia";

const mockPush = vi.hoisted(() => vi.fn());
const mockSaveMutateAsync = vi.hoisted(() => vi.fn());
const mockCreateGoalMutateAsync = vi.hoisted(() => vi.fn());
const mockCaptureException = vi.hoisted(() => vi.fn());
const mockValidate = vi.hoisted(() => vi.fn().mockReturnValue([]));
const mockCalculate = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = ref(false);
const mockHasPremiumAccess = ref(false);

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string; n: (v: number) => string } => ({ t: (key: string) => key, n: (v: number) => String(v) }),
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(), useHead: vi.fn(), useSeoMeta: vi.fn(),
  useI18n: (): { t: (key: string) => string; n: (v: number) => string } => ({ t: (key: string) => key, n: (v: number) => String(v) }),
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

vi.mock("#app", () => ({ useRouter: (): { push: typeof mockPush } => ({ push: mockPush }) }));
vi.mock("echarts/core", () => ({ use: vi.fn() }));
vi.mock("echarts/charts", () => ({ LineChart: {} }));
vi.mock("echarts/components", () => ({ GridComponent: {}, TooltipComponent: {}, LegendComponent: {} }));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));
vi.mock("vue-echarts", () => ({ default: { props: ["option", "autoresize"], template: "<div class='v-chart'></div>" } }));

vi.mock("naive-ui", () => ({
  NAlert: { props: ["type"], template: "<div class='n-alert'><slot /></div>" },
  NButton: { props: ["type", "size", "loading", "disabled", "quaternary", "block", "attrType"], template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>", emits: ["click"] },
  NForm: { emits: ["submit"], template: "<form @submit.prevent='$emit(\"submit\", $event)'><slot /></form>" },
  NFormItem: { props: ["label"], template: "<div class='n-form-item'><slot /></div>" },
  NInputNumber: { props: ["value", "min", "max", "precision", "prefix"], emits: ["update:value"], template: "<input class='n-input-number' />" },
  NSelect: { props: ["value", "options"], emits: ["update:value"], template: "<select class='n-select'></select>" },
  NSpace: { props: ["vertical", "size"], template: "<div><slot /></div>" },
  NThing: { props: ["title", "description"], template: "<div class='n-thing'>{{ title }}</div>" },
  useMessage: vi.fn(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() })),
}));

vi.mock("@tanstack/vue-query", async () => {
  const actual = await vi.importActual("@tanstack/vue-query");
  return { ...actual, useQuery: vi.fn(() => ({ data: mockHasPremiumAccess, isLoading: ref(false), isError: ref(false) })), useMutation: vi.fn(() => ({ mutateAsync: mockSaveMutateAsync, isPending: ref(false), isError: ref(false) })) };
});

vi.mock("~/stores/session", () => ({ useSessionStore: (): { isAuthenticated: boolean } => ({ get isAuthenticated(): boolean { return mockIsAuthenticated.value; } }) }));
vi.mock("~/features/tools/composables/useToolCta", () => ({ useToolCta: (): { showCta: ComputedRef<boolean> } => ({ showCta: computed(() => !mockIsAuthenticated.value) }) }));
vi.mock("~/composables/useApiError", () => ({ useApiError: (): { getErrorMessage: (err: unknown) => string } => ({ getErrorMessage: vi.fn((err: unknown): string => String(err)) }) }));
vi.mock("~/core/observability", () => ({ captureException: mockCaptureException }));

vi.mock("~/features/tools/model/reserva-emergencia", () => ({
  PROFILE_OPTIONS: [{ value: "clt", label: "CLT", months: 6 }],
  createDefaultReservaEmergenciaFormState: (): object => ({ monthlyExpenses: null, profile: "clt", currentReserve: 0, monthlyContribution: null, annualReturnPct: 12.25 }),
  validateReservaEmergenciaForm: mockValidate,
  calculateReservaEmergencia: mockCalculate,
}));

vi.mock("~/features/simulations/queries/use-save-simulation-mutation", () => ({ useSaveSimulationMutation: (): { mutateAsync: typeof mockSaveMutateAsync; isPending: ReturnType<typeof ref<boolean>> } => ({ mutateAsync: mockSaveMutateAsync, isPending: ref(false) }) }));
vi.mock("~/features/goals/queries/use-create-goal-mutation", () => ({ useCreateGoalMutation: (): { mutateAsync: typeof mockCreateGoalMutateAsync; isPending: ReturnType<typeof ref<boolean>> } => ({ mutateAsync: mockCreateGoalMutateAsync, isPending: ref(false) }) }));
vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({ useEntitlementQuery: (): { data: typeof mockHasPremiumAccess; isLoading: ReturnType<typeof ref<boolean>> } => ({ data: mockHasPremiumAccess, isLoading: ref(false) }) }));

const mockResult: ReservaEmergenciaResult = {
  targetAmount: 18000, profileMonths: 6, gap: 18000, monthsToTarget: 16,
  timeline: [{ month: 0, balance: 0 }, { month: 16, balance: 18000 }],
  investments: [{ name: "Selic", annualRatePct: 14.25, monthsToTarget: 15, finalAmount: 18100 }],
};

const globalStubs = {
  NuxtLayout: { props: ["name"], template: "<div class='nuxt-layout'><slot /></div>" },
  UiPageHeader: { props: ["title", "subtitle"], template: "<div class='ui-page-header'><h1>{{ title }}</h1></div>" },
  UiGlassPanel: { props: ["glow"], template: "<div class='ui-glass-panel'><slot /></div>" },
  UiSurfaceCard: { template: "<div class='ui-surface-card'><slot /></div>" },
  UiStickySummaryCard: { template: "<div class='ui-sticky-summary-card'><slot /></div>" },
  CalculatorFormSection: { props: ["title"], template: "<div class='calculator-form-section'><slot /></div>" },
  CalculatorResultSummary: { props: ["label", "value", "metrics"], template: "<div class='calculator-result-summary'>{{ label }}: {{ value }}</div>" },
  ToolGuestCta: { template: "<div class='tool-guest-cta'>guest-cta</div>" },
  UiChart: { props: ["option", "height"], template: "<div class='v-chart'></div>" },
  ToolSaveResult: { props: ["intent", "label", "amount", "description"], template: "<div class='tool-save-result-stub' />" },
};

/**
 *
 * @param app
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/tools/reserva-emergencia", meta: {}, params: {}, query: {} },
    $router: { push: mockPush, replace: vi.fn() }, $config: { public: {} }, payload: { serverRendered: false },
    ssrContext: { head: { push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })) } },
    static: { data: {} }, isHydrating: false, deferHydration: (): void => {},
    runWithContext: <T>(cb: () => T): T => cb(), hooks: { callHook: vi.fn(), hook: vi.fn() }, _asyncDataPromises: {}, _asyncData: {},
  });
}

/**
 * @returns Mounted component wrapper.
 */
function mountPage(): ReturnType<typeof mount> { return mount(ReservaEmergenciaPage, { global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs } }); }

/**
 *
 */
function resetState(): void {
  setActivePinia(createPinia()); mockPush.mockClear(); mockSaveMutateAsync.mockReset();
  mockCreateGoalMutateAsync.mockReset(); mockCaptureException.mockClear();
  mockValidate.mockReturnValue([]); mockCalculate.mockReset();
  mockIsAuthenticated.value = false; mockHasPremiumAccess.value = false;
}

describe("ReservaEmergenciaPage — guest layout", () => {
  beforeEach(resetState);
  it("renders NuxtLayout", () => { expect(mountPage().find(".nuxt-layout").exists()).toBe(true); });
  it("shows guest CTA after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult); const w = mountPage();
    await w.find("form").trigger("submit"); await flushPromises();
    expect(w.find(".tool-guest-cta").exists()).toBe(true);
  });
});

describe("ReservaEmergenciaPage — form validation", () => {
  beforeEach(resetState);
  it("shows validation error", async () => {
    mockValidate.mockReturnValue([{ field: "monthlyExpenses", messageKey: "errors.expensesRequired" }]);
    const w = mountPage(); await w.find("form").trigger("submit"); await flushPromises();
    expect(w.find(".n-alert").exists()).toBe(true);
    expect(mockCalculate).not.toHaveBeenCalled();
  });
});

describe("ReservaEmergenciaPage — results", () => {
  beforeEach(resetState);
  it("shows result summary", async () => {
    mockCalculate.mockReturnValue(mockResult); const w = mountPage();
    await w.find("form").trigger("submit"); await flushPromises();
    expect(w.find(".calculator-result-summary").exists()).toBe(true);
  });
  it("does not show results before calculation", () => {
    expect(mountPage().find(".calculator-result-summary").exists()).toBe(false);
  });
});

describe("ReservaEmergenciaPage — save simulation", () => {
  beforeEach(resetState);
  it("calls saveSimulationMutation", async () => {
    mockIsAuthenticated.value = true; mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-re-1" });
    const w = mountPage(); await w.find("form").trigger("submit"); await flushPromises();
    const btn = w.findAll(".n-button").find((b) => b.text().includes("reservaEmergencia.actions.save"));
    await btn!.trigger("click"); await flushPromises();
    expect(mockSaveMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ toolSlug: "reserva_emergencia" }));
  });
});

describe("ReservaEmergenciaPage — add as goal", () => {
  beforeEach(resetState);
  it("shows goal button for premium users", async () => {
    mockIsAuthenticated.value = true; mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult); const w = mountPage();
    await w.find("form").trigger("submit"); await flushPromises();
    const btn = w.findAll(".n-button").find((b) => b.text().includes("reservaEmergencia.actions.addAsGoal"));
    expect(btn).toBeDefined();
  });
});
