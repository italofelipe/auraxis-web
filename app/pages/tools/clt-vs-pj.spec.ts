import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import CltVsPjPage from "./clt-vs-pj.vue";
import type { CltVsPjResult } from "~/features/tools/model/clt-vs-pj";

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

vi.mock("~/features/tools/composables/useToolPageStructuredData", () => ({
  useToolPageStructuredData: vi.fn(),
}));

vi.mock("naive-ui", () => ({
  NAlert: {
    props: ["type"],
    template: "<div class='n-alert'><slot /></div>",
  },
  NButton: {
    props: ["type", "size", "loading", "disabled", "quaternary", "block"],
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
  NThing: {
    props: ["title", "description"],
    template: "<div><strong>{{ title }}</strong><span>{{ description }}</span><slot name='footer' /></div>",
  },
  NTooltip: {
    template: "<div class='n-tooltip'><slot name='trigger' /><slot /></div>",
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

vi.mock("~/features/tools/model/clt-vs-pj", () => ({
  PJ_TABLE_YEAR: 2025,
  PJ_REGIMES: ["mei", "simples", "lucro_presumido"],
  MEI_MONTHLY_LIMIT: 6750,
  MIN_PROLABORE: 1518,
  PROLABORE_INSS_RATE: 0.11,
  LUCRO_PRESUMIDO_EFFECTIVE_RATE: 0.1453,
  getSimplasRate: vi.fn().mockReturnValue(0.06),
  createDefaultCltVsPjFormState: (): {
    cltGrossSalary: null;
    cltVT: number;
    cltVR: number;
    cltHealthPlan: number;
    cltPLR: number;
    dependents: number;
    pjMonthlyInvoice: null;
    pjRegime: string;
    pjFixedCosts: number;
    pjHealthPlan: number;
    pjPensao: number;
  } => ({
    cltGrossSalary: null,
    cltVT: 0,
    cltVR: 0,
    cltHealthPlan: 0,
    cltPLR: 0,
    dependents: 0,
    pjMonthlyInvoice: null,
    pjRegime: "simples",
    pjFixedCosts: 0,
    pjHealthPlan: 0,
    pjPensao: 0,
  }),
  validateCltVsPjForm: mockValidate,
  calculateCltVsPj: mockCalculate,
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

// ─── Mock result ──────────────────────────────────────────────────────────────

const mockResult: CltVsPjResult = {
  cltNetMonthly: 3800,
  cltEmployerTotalCost: 6400,
  pjNetMonthly: 4200,
  pjTaxAmount: 600,
  pjInssProLabore: 167,
  breakEvenInvoice: 7500,
  pjIsMoreProfitable: true,
  monthlyDifference: 400,
  regime: "simples",
  tableYear: 2025,
};

// ─── Stubs ────────────────────────────────────────────────────────────────────

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
    template: "<div class='tool-guest-cta'>toolGuestCta.registerCta</div>",
  },
  ToolSaveResult: {
    props: ["intent", "label", "amount", "description"],
    template: "<div class='tool-save-result-stub' />",
  },
};

/**
 * Installs a minimal Nuxt context so composables like useSeoMeta can resolve.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: { path: "/tools/clt-vs-pj", meta: {}, params: {}, query: {} },
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
  Reflect.set(app, "$nuxt", fakeNuxtApp);
}

/**
 * Mounts the CLT vs PJ page with minimal Nuxt test context.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(CltVsPjPage, {
    global: {
      plugins: [{ install: nuxtContextPlugin }],
      stubs: globalStubs,
    },
  });
}

/**
 * Resets all hoisted mocks and local session state between tests.
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

describe("CltVsPjPage", () => {
  beforeEach(resetPageState);

  describe("guest layout", () => {
    it("renders the public hero and brand header when unauthenticated", () => {
      const wrapper = mountPage();
      expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
      expect(wrapper.text()).toContain("cltVsPj.hero.title");
    });

    it("shows the guest CTA after calculation", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();
      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(wrapper.find(".tool-guest-cta").exists()).toBe(true);
    });

    it("does not show results before calculation", () => {
      const wrapper = mountPage();
      expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
    });
  });

  describe("authenticated layout", () => {
    it("shows NuxtLayout when authenticated", () => {
      mockIsAuthenticated.value = true;
      const wrapper = mountPage();

      expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
      expect(wrapper.find(".tool-guest-cta").exists()).toBe(false);
    });
  });

  describe("form validation", () => {
    it("shows validation errors and blocks calculation", async () => {
      mockValidate.mockReturnValue([
        { field: "cltGrossSalary", messageKey: "errors.cltGrossSalaryRequired" },
      ]);
      const wrapper = mountPage();
      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(wrapper.find(".n-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("cltVsPj.errors.cltGrossSalaryRequired");
      expect(mockCalculate).not.toHaveBeenCalled();

      mockValidate.mockReturnValue([
        { field: "pjMonthlyInvoice", messageKey: "errors.meiLimitExceeded" },
      ]);
      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(wrapper.text()).toContain("cltVsPj.errors.meiLimitExceeded");
    });

    it("clears the validation error on a valid submit", async () => {
      mockValidate
        .mockReturnValueOnce([{ field: "cltGrossSalary", messageKey: "errors.cltGrossSalaryRequired" }])
        .mockReturnValue([]);
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();
      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(wrapper.text()).toContain("cltVsPj.errors.cltGrossSalaryRequired");
      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(mockCalculate).toHaveBeenCalledOnce();
      expect(wrapper.text()).not.toContain("cltVsPj.errors.cltGrossSalaryRequired");
    });
  });

  describe("calculation result", () => {
    it("shows summary, comparison section and disclaimer after valid calculation", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.find(".calculator-result-summary").exists()).toBe(true);
      expect(wrapper.find(".clt-vs-pj-page__comparison").exists()).toBe(true);
      expect(wrapper.text()).toContain("cltVsPj.disclaimer.note");
    });
  });

  describe("save simulation", () => {
    it("calls saveSimulationMutation with clt_vs_pj slug", async () => {
      mockIsAuthenticated.value = true;
      mockCalculate.mockReturnValue(mockResult);
      mockSaveMutateAsync.mockResolvedValue({ id: "sim-cvp-1" });

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const saveButton = wrapper.findAll(".n-button").find(
        (b) => b.text().includes("cltVsPj.actions.save"),
      );
      expect(saveButton).toBeDefined();
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockSaveMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ toolSlug: "clt_vs_pj" }),
      );
    });

    it("captures exception when save fails", async () => {
      mockIsAuthenticated.value = true;
      mockCalculate.mockReturnValue(mockResult);
      mockSaveMutateAsync.mockRejectedValue(new Error("network error"));

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const saveButton = wrapper.findAll(".n-button").find(
        (b) => b.text().includes("cltVsPj.actions.save"),
      );
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockCaptureException).toHaveBeenCalledOnce();
    });
  });

  describe("premium goal", () => {
    it("shows Add as Goal button when premium", async () => {
      mockIsAuthenticated.value = true;
      mockHasPremiumAccess.value = true;
      mockCalculate.mockReturnValue(mockResult);
      mockGoalMutateAsync.mockResolvedValue({ id: "goal-1" });

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const goalButton = wrapper.findAll(".n-button").find(
        (b) => b.text().includes("cltVsPj.actions.addAsGoal"),
      );
      expect(goalButton).toBeDefined();
    });

    it("creates goal with pjNetMonthly when PJ wins", async () => {
      mockIsAuthenticated.value = true;
      mockHasPremiumAccess.value = true;
      mockCalculate.mockReturnValue(mockResult); // pjIsMoreProfitable: true
      mockGoalMutateAsync.mockResolvedValue({ id: "goal-1" });

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const goalButton = wrapper.findAll(".n-button").find(
        (b) => b.text().includes("cltVsPj.actions.addAsGoal"),
      );
      await goalButton!.trigger("click");
      await flushPromises();

      expect(mockGoalMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ target_amount: mockResult.pjNetMonthly }),
      );
    });
  });
});
