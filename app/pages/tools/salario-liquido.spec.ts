import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import SalarioLiquidoPage from "./salario-liquido.vue";
import type { SalarioLiquidoResult } from "~/features/tools/model/salario-liquido";

const mockPush = vi.hoisted(() => vi.fn());
const mockSaveMutateAsync = vi.hoisted(() => vi.fn());
const mockCreateReceivableMutateAsync = vi.hoisted(() => vi.fn());
const mockCaptureException = vi.hoisted(() => vi.fn());
const mockValidate = vi.hoisted(() => vi.fn().mockReturnValue([]));
const mockCalculate = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = ref(false);
const mockHasPremiumAccess = ref(false);

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
vi.mock("echarts/components", () => ({ GridComponent: {}, TooltipComponent: {}, LegendComponent: {} }));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));
vi.mock("vue-echarts", () => ({ default: { props: ["option", "autoresize"], template: "<div class='v-chart'></div>" } }));

vi.mock("naive-ui", () => ({
  NAlert: { props: ["type"], template: "<div class='n-alert'><slot /></div>" },
  NButton: {
    props: ["type", "size", "loading", "disabled", "quaternary", "block", "attrType"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NCheckbox: {
    props: ["checked"],
    emits: ["update:checked"],
    template: "<label class='n-checkbox'><input type='checkbox' :checked='checked' @change='$emit(\"update:checked\", $event.target.checked)' /><slot /></label>",
  },
  NForm: { emits: ["submit"], template: "<form @submit.prevent='$emit(\"submit\", $event)'><slot /></form>" },
  NFormItem: { props: ["label"], template: "<div class='n-form-item'><slot /></div>" },
  NInputNumber: {
    props: ["value", "min", "max", "precision", "prefix", "placeholder"],
    emits: ["update:value"],
    template: "<input class='n-input-number' :value='value' @change='$emit(\"update:value\", $event.target.value ? parseFloat($event.target.value) : null)' />",
  },
  NSpace: { props: ["vertical", "size"], template: "<div><slot /></div>" },
  NThing: { props: ["title", "description"], template: "<div class='n-thing'><strong>{{ title }}</strong></div>" },
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

vi.mock("~/features/tools/model/salario-liquido", () => ({
  BR_TAX_TABLE_YEAR: 2025,
  createDefaultSalarioLiquidoFormState: (): object => ({
    grossSalary: null, dependents: 0, alimonyPct: 0, vtOptOut: false, vtPct: 6,
    vaVrDiscount: 0, healthPlanDiscount: 0, unionContribution: false, pgblPct: 0,
  }),
  validateSalarioLiquidoForm: mockValidate,
  calculateSalarioLiquido: mockCalculate,
}));

vi.mock("~/features/simulations/queries/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: (): { mutateAsync: typeof mockSaveMutateAsync; isPending: ReturnType<typeof ref<boolean>> } => ({
    mutateAsync: mockSaveMutateAsync, isPending: ref(false),
  }),
}));

vi.mock("~/features/receivables/queries/use-create-receivable-mutation", () => ({
  useCreateReceivableMutation: (): { mutateAsync: typeof mockCreateReceivableMutateAsync; isPending: ReturnType<typeof ref<boolean>> } => ({
    mutateAsync: mockCreateReceivableMutateAsync, isPending: ref(false),
  }),
}));

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: (): { data: typeof mockHasPremiumAccess; isLoading: ReturnType<typeof ref<boolean>> } => ({
    data: mockHasPremiumAccess, isLoading: ref(false),
  }),
}));

const mockResult: SalarioLiquidoResult = {
  grossSalary: 5000, inss: 424.82, irrf: 47.15, vtDiscount: 300, vaVrDiscount: 0,
  healthPlanDiscount: 0, unionDiscount: 0, alimonyDiscount: 0, totalDeductions: 771.97,
  netSalary: 4228.03, deductions: [{ label: "INSS", amount: 424.82 }, { label: "IRRF", amount: 47.15 }, { label: "Vale-Transporte", amount: 300 }],
  employerFgts: 400, employerInss: 1000, employerTotal: 6400,
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
  ToolSaveResult: { props: ["intent", "label", "amount", "description"], template: "<div class='tool-save-result-stub' />" },
};

/**
 *
 * @param app
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/tools/salario-liquido", meta: {}, params: {}, query: {} },
    $router: { push: mockPush, replace: vi.fn() },
    $config: { public: {} }, payload: { serverRendered: false },
    ssrContext: { head: { push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })) } },
    static: { data: {} }, isHydrating: false, deferHydration: (): void => {},
    runWithContext: <T>(cb: () => T): T => cb(),
    hooks: { callHook: vi.fn(), hook: vi.fn() }, _asyncDataPromises: {}, _asyncData: {},
  });
}

/**
 * @returns Mounted component wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(SalarioLiquidoPage, { global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs } });
}

/**
 *
 */
function resetState(): void {
  setActivePinia(createPinia());
  mockPush.mockClear(); mockSaveMutateAsync.mockReset(); mockCreateReceivableMutateAsync.mockReset();
  mockCaptureException.mockClear(); mockValidate.mockReturnValue([]); mockCalculate.mockReset();
  mockIsAuthenticated.value = false; mockHasPremiumAccess.value = false;
}

describe("SalarioLiquidoPage — guest layout", () => {
  beforeEach(resetState);

  it("renders NuxtLayout", () => {
    expect(mountPage().find(".nuxt-layout").exists()).toBe(true);
  });

  it("shows guest CTA after valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const w = mountPage();
    await w.find("form").trigger("submit");
    await flushPromises();
    expect(w.find(".tool-guest-cta").exists()).toBe(true);
  });
});

describe("SalarioLiquidoPage — form validation", () => {
  beforeEach(resetState);

  it("shows validation error when grossSalary is missing", async () => {
    mockValidate.mockReturnValue([{ field: "grossSalary", messageKey: "errors.grossSalaryRequired" }]);
    const w = mountPage();
    await w.find("form").trigger("submit");
    await flushPromises();
    expect(w.find(".n-alert").exists()).toBe(true);
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it("clears validation error on valid submit", async () => {
    mockValidate.mockReturnValueOnce([{ field: "grossSalary", messageKey: "errors.grossSalaryRequired" }]).mockReturnValue([]);
    mockCalculate.mockReturnValue(mockResult);
    const w = mountPage();
    await w.find("form").trigger("submit"); await flushPromises();
    await w.find("form").trigger("submit"); await flushPromises();
    expect(w.text()).not.toContain("errors.grossSalaryRequired");
  });
});

describe("SalarioLiquidoPage — results", () => {
  beforeEach(resetState);

  it("shows result summary after valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const w = mountPage();
    await w.find("form").trigger("submit");
    await flushPromises();
    expect(w.find(".calculator-result-summary").exists()).toBe(true);
  });

  it("does not show results before calculation", () => {
    expect(mountPage().find(".calculator-result-summary").exists()).toBe(false);
  });
});

describe("SalarioLiquidoPage — save simulation", () => {
  beforeEach(resetState);

  it("calls saveSimulationMutation with correct slug", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-sl-1" });
    const w = mountPage();
    await w.find("form").trigger("submit"); await flushPromises();
    const btn = w.findAll(".n-button").find((b) => b.text().includes("salarioLiquido.actions.save"));
    expect(btn).toBeDefined();
    await btn!.trigger("click"); await flushPromises();
    expect(mockSaveMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ toolSlug: "salario_liquido" }));
  });

  it("captures exception on save failure", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockRejectedValue(new Error("fail"));
    const w = mountPage();
    await w.find("form").trigger("submit"); await flushPromises();
    const btn = w.findAll(".n-button").find((b) => b.text().includes("salarioLiquido.actions.save"));
    await btn!.trigger("click"); await flushPromises();
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});
