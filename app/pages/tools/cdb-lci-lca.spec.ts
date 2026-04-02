import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import CdbLciLcaPage from "./cdb-lci-lca.vue";
import type { CdbLciLcaResult } from "~/features/tools/model/cdb-lci-lca";

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

vi.mock("naive-ui", () => ({
  NAlert: { props: ["type"], template: "<div class='n-alert'><slot /></div>" },
  NButton: {
    props: ["type", "size", "loading", "disabled", "quaternary", "block", "attrType"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NCheckbox: {
    props: ["checked", "disabled"],
    emits: ["update:checked"],
    template: "<label class='n-checkbox'><input type='checkbox' :checked='checked' @change='$emit(\"update:checked\", $event.target.checked)' /><slot /></label>",
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
    template: "<div class='n-thing'><strong>{{ title }}</strong><span>{{ description }}</span><slot name='footer' /></div>",
  },
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

vi.mock("~/composables/useToolCta", () => ({
  useToolCta: (): { showCta: ComputedRef<boolean> } => ({
    showCta: computed(() => !mockIsAuthenticated.value),
  }),
}));

vi.mock("~/core/observability", () => ({ captureException: mockCaptureException }));

vi.mock("~/features/tools/model/cdb-lci-lca", () => ({
  CDB_TABLE_YEAR: 2025,
  createDefaultCdbLciLcaFormState: (): object => ({
    amount: null,
    termDays: 365,
    cdbRatePct: 100,
    lciRatePct: 95,
    lcaRatePct: 93,
    cdiRatePct: 10.65,
    selicRatePct: 10.75,
    ipcaRatePct: 4.5,
    includeIof: false,
  }),
  validateCdbLciLcaForm: mockValidate,
  calculateCdbLciLca: mockCalculate,
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

const mockResult: CdbLciLcaResult = {
  cdb: { grossReturn: 1065, irRate: 0.175, irAmount: 186.38, netReturn: 878.63, netAmount: 10878.63, realReturn: 0.05 },
  lci: { grossReturn: 1011.75, netReturn: 1011.75, netAmount: 11011.75, realReturn: 0.055 },
  lca: { grossReturn: 990.45, netReturn: 990.45, netAmount: 10990.45, realReturn: 0.053 },
  poupanca: { grossReturn: 750, netReturn: 750, netAmount: 10750, realReturn: 0.03 },
  ranking: [
    { name: "LCI", netAmount: 11011.75 },
    { name: "LCA", netAmount: 10990.45 },
    { name: "CDB", netAmount: 10878.63 },
    { name: "Poupança", netAmount: 10750 },
  ],
  bestOption: "LCI",
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
};

/**
 * Installs a minimal Nuxt context so useSeoMeta resolves.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: { path: "/tools/cdb-lci-lca", meta: {}, params: {}, query: {} },
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
 * Mounts the CDB/LCI/LCA page with minimal test context.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(CdbLciLcaPage, {
    global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
  });
}

/**
 * Resets all hoisted mocks and session state between tests.
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

describe("CdbLciLcaPage — guest layout", () => {
  beforeEach(() => { resetPageState(); });

  it("renders the public header when unauthenticated", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".cdb-page__header").exists()).toBe(true);
    expect(wrapper.text()).toContain("cdbLciLca.header.publicTool");
  });

  it("shows guest CTA after a valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".tool-guest-cta").exists()).toBe(true);
  });

  it("does not show NuxtLayout when unauthenticated", () => {
    expect(mountPage().find(".nuxt-layout").exists()).toBe(false);
  });
});

describe("CdbLciLcaPage — authenticated layout", () => {
  beforeEach(() => { resetPageState(); });

  it("renders NuxtLayout when authenticated", () => {
    mockIsAuthenticated.value = true;
    const wrapper = mountPage();
    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
    expect(wrapper.find(".cdb-page__header").exists()).toBe(false);
  });

  it("does not show guest CTA when authenticated", () => {
    mockIsAuthenticated.value = true;
    expect(mountPage().find(".tool-guest-cta").exists()).toBe(false);
  });
});

describe("CdbLciLcaPage — form validation", () => {
  beforeEach(() => { resetPageState(); });

  it("shows validation error when amount is missing", async () => {
    mockValidate.mockReturnValue([{ field: "amount", messageKey: "errors.amountRequired" }]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".n-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("cdbLciLca.errors.amountRequired");
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it("shows validation error when all product rates are null", async () => {
    mockValidate.mockReturnValue([{ field: "cdbRatePct", messageKey: "errors.atLeastOneRateRequired" }]);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("cdbLciLca.errors.atLeastOneRateRequired");
  });

  it("clears the validation error on a valid submit", async () => {
    mockValidate
      .mockReturnValueOnce([{ field: "amount", messageKey: "errors.amountRequired" }])
      .mockReturnValue([]);
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).not.toContain("cdbLciLca.errors.amountRequired");
  });
});

describe("CdbLciLcaPage — calculation results", () => {
  beforeEach(() => { resetPageState(); });

  it("shows CalculatorResultSummary after valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const summary = wrapper.find(".calculator-result-summary");
    expect(summary.exists()).toBe(true);
    expect(summary.text()).toContain("cdbLciLca.results.bestOption");
  });

  it("displays the ranking section", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find(".cdb-page__ranking").exists()).toBe(true);
  });

  it("shows disclaimer warning after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.text()).toContain("cdbLciLca.disclaimer.note");
  });

  it("does not show results before calculation", () => {
    const wrapper = mountPage();
    expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
    expect(wrapper.find(".cdb-page__ranking").exists()).toBe(false);
  });
});

describe("CdbLciLcaPage — save simulation", () => {
  beforeEach(() => { resetPageState(); });

  it("calls saveSimulationMutation with cdb_lci_lca slug", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-cdb-001" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find((b) => b.text().includes("cdbLciLca.actions.save"));
    expect(saveButton).toBeDefined();
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
    expect(mockSaveMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ toolSlug: "cdb_lci_lca" }));
  });

  it("captures exception when save simulation fails", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockRejectedValue(new Error("network error"));
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const saveButton = wrapper.findAll(".n-button").find((b) => b.text().includes("cdbLciLca.actions.save"));
    await saveButton!.trigger("click");
    await flushPromises();
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe("CdbLciLcaPage — premium add as goal", () => {
  beforeEach(() => { resetPageState(); });

  it("shows add as goal button for premium users after calculation", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find((b) => b.text().includes("cdbLciLca.actions.addAsGoal"));
    expect(goalButton).toBeDefined();
  });

  it("calls createGoalMutation when premium user clicks add goal", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-xyz" });
    mockCreateGoalMutateAsync.mockResolvedValue({ id: "goal-1" });
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find((b) => b.text().includes("cdbLciLca.actions.addAsGoal"));
    await goalButton!.trigger("click");
    await flushPromises();
    expect(mockCreateGoalMutateAsync).toHaveBeenCalledOnce();
  });

  it("captures exception when add goal fails", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-xyz" });
    mockCreateGoalMutateAsync.mockRejectedValue(new Error("goal error"));
    const wrapper = mountPage();
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    const goalButton = wrapper.findAll(".n-button").find((b) => b.text().includes("cdbLciLca.actions.addAsGoal"));
    await goalButton!.trigger("click");
    await flushPromises();
    expect(mockCaptureException).toHaveBeenCalled();
  });
});
