import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type App } from "vue";

import CustoVidaRegionalPage from "./custo-de-vida-regional.vue";
import type { RegionalCostResult } from "~/features/tools/model/custo-de-vida-regional";

const mockValidate = vi.hoisted(() => vi.fn().mockReturnValue([]));
const mockCalculate = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = ref(false);

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
}));
vi.mock("echarts/core", () => ({ use: vi.fn() }));
vi.mock("vue-echarts", () => ({ default: { props: ["option", "autoresize"], template: "<div class='v-chart'></div>" } }));

vi.mock("naive-ui", () => ({
  NAlert: { props: ["type"], template: "<div class='n-alert'><slot /></div>" },
  NButton: { props: ["type", "size", "quaternary", "block", "attrType", "tag", "href", "target", "rel"], template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>", emits: ["click"] },
  NForm: { emits: ["submit"], template: "<form @submit.prevent='$emit(\"submit\", $event)'><slot /></form>" },
  NFormItem: { props: ["label"], template: "<div class='n-form-item'><slot /></div>" },
  NInputNumber: { props: ["value", "min", "max", "precision", "prefix"], emits: ["update:value"], template: "<input class='n-input-number' />" },
  NProgress: { props: ["percentage", "status", "type", "showIndicator"], template: "<div class='n-progress'></div>" },
  NSelect: { props: ["value", "options", "filterable", "placeholder"], emits: ["update:value"], template: "<select class='n-select'></select>" },
  NSpace: { props: ["vertical", "size"], template: "<div><slot /></div>" },
  NThing: { props: ["title", "description"], template: "<div class='n-thing'>{{ title }}: {{ description }}</div>" },
  useMessage: vi.fn(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() })),
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { isAuthenticated: boolean } => ({
    get isAuthenticated(): boolean {
      return mockIsAuthenticated.value;
    },
  }),
}));

vi.mock("~/features/tools/model/custo-de-vida-regional", () => ({
  EXPENSE_CATEGORY_KEYS: ["housing", "transport", "food", "leisure", "other"],
  UF_CODES: ["SP", "RJ"],
  getRegionalEntry: (uf: string): { name: string; avgIncome: number; avgCost: number } => ({ name: uf, avgIncome: 6800, avgCost: 4800 }),
  createDefaultRegionalCostFormState: (): object => ({ uf: "SP", monthlyIncome: 0, housing: 0, transport: 0, food: 0, leisure: 0, other: 0 }),
  decodeQueryToForm: vi.fn().mockReturnValue(null),
  encodeFormToQuery: vi.fn().mockReturnValue("encoded"),
  validateRegionalCostForm: mockValidate,
  calculateRegionalCost: mockCalculate,
}));

const mockResult: RegionalCostResult = {
  totalMonthlyCost: 6000,
  totalAnnualCost: 72000,
  committedPct: 60,
  savingsRatePct: 40,
  monthlySavings: 4000,
  categories: [
    { key: "housing", amount: 2500, pctOfIncome: 25, pctOfTotal: 41.67 },
    { key: "food", amount: 1500, pctOfIncome: 15, pctOfTotal: 25 },
  ],
  targetWealth: 1800000,
  yearsToRetirement: 23,
  regional: { uf: "SP", name: "São Paulo", avgIncome: 6800, avgCost: 4800, costVsRegionalPct: 25, incomeVsRegionalPct: 0 },
  sustainabilityScore: 80,
};

const globalStubs = {
  NuxtLayout: { props: ["name"], template: "<div class='nuxt-layout'><slot /></div>" },
  UiPageHeader: { props: ["title", "subtitle"], template: "<div class='ui-page-header'><h1>{{ title }}</h1></div>" },
  UiGlassPanel: { props: ["glow"], template: "<div class='ui-glass-panel'><slot /></div>" },
  UiSurfaceCard: { template: "<div class='ui-surface-card'><slot /></div>" },
  UiStickySummaryCard: { template: "<div class='ui-sticky-summary-card'><slot /></div>" },
  CalculatorFormSection: { props: ["title"], template: "<div class='calculator-form-section'><slot /></div>" },
  ToolGuestCta: { template: "<div class='tool-guest-cta'>guest-cta</div>" },
  UiChart: { props: ["option", "height"], template: "<div class='v-chart'></div>" },
  NuxtLink: { props: ["to"], template: "<a class='nuxt-link'><slot /></a>" },
};

/**
 * Installs a minimal Nuxt app context onto the Vue app instance.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/tools/custo-de-vida-regional", meta: {}, params: {}, query: {} },
    $router: { push: vi.fn(), replace: vi.fn() },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: { head: { push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })) } },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    runWithContext: <T>(cb: () => T): T => cb(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  });
}

/**
 * @returns Mounted component wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(CustoVidaRegionalPage, {
    global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
  });
}

/**
 * Resets shared mock state before each test.
 */
function resetState(): void {
  setActivePinia(createPinia());
  mockValidate.mockReturnValue([]);
  mockCalculate.mockReset();
  mockIsAuthenticated.value = false;
}

describe("CustoVidaRegionalPage — layout", () => {
  beforeEach(resetState);

  it("renders NuxtLayout", () => {
    expect(mountPage().find(".nuxt-layout").exists()).toBe(true);
  });

  it("shows guest CTA for unauthenticated users", () => {
    expect(mountPage().find(".tool-guest-cta").exists()).toBe(true);
  });
});

describe("CustoVidaRegionalPage — validation", () => {
  beforeEach(resetState);

  it("shows a validation error and skips calculation when invalid", async () => {
    mockValidate.mockReturnValue([{ field: "monthlyIncome", messageKey: "errors.incomeRequired" }]);
    const w = mountPage();
    await w.find("form").trigger("submit");
    await flushPromises();
    expect(w.find(".n-alert").exists()).toBe(true);
    expect(mockCalculate).not.toHaveBeenCalled();
  });
});

describe("CustoVidaRegionalPage — results", () => {
  beforeEach(resetState);

  it("does not render results before calculation", () => {
    expect(mountPage().find(".n-progress").exists()).toBe(false);
  });

  it("renders score and share actions after calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const w = mountPage();
    await w.find("form").trigger("submit");
    await flushPromises();
    expect(mockCalculate).toHaveBeenCalled();
    expect(w.find(".n-progress").exists()).toBe(true);
    expect(w.find("[data-testid='copy-share-url']").exists()).toBe(true);
  });
});
