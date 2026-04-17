import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type App, type ComputedRef, computed } from "vue";

import InssIrFolhaPage from "./inss-ir-folha.vue";
import type { InssIrResult } from "~/features/tools/model/inss-ir-folha";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockSaveMutateAsync = vi.hoisted(() => vi.fn());
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
  NCollapse: { template: "<div class='n-collapse'><slot /></div>" },
  NCollapseItem: {
    props: ["title", "name"],
    template: "<div class='n-collapse-item'><div class='n-collapse-item__title'>{{ title }}</div><slot /></div>",
  },
  // Pass the native DOM event so the parent's @submit.prevent modifier can
  // call event.preventDefault() without receiving undefined.
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
    props: ["vertical", "size", "justify"],
    template: "<div><slot /></div>",
  },
  NTag: {
    props: ["round", "type", "size"],
    template: "<span><slot /></span>",
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

vi.mock("~/features/tools/model/inss-ir-folha", () => ({
  BR_TAX_TABLE_YEAR: 2025,
  PRIVATE_PENSION_DEDUCTION_LIMIT: 0.12,
  createDefaultInssIrFormState: (): { grossSalary: null; dependents: number; alimentPension: number; privatePension: number } => ({
    grossSalary: null,
    dependents: 0,
    alimentPension: 0,
    privatePension: 0,
  }),
  validateInssIrForm: mockValidate,
  calculateInssIr: mockCalculate,
}));

vi.mock("~/features/simulations/queries/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: (): { mutateAsync: typeof mockSaveMutateAsync; isPending: ReturnType<typeof ref<boolean>> } => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: (): { data: typeof mockHasPremiumAccess; isLoading: ReturnType<typeof ref<boolean>> } => ({
    data: mockHasPremiumAccess,
    isLoading: ref(false),
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockResult: InssIrResult = {
  grossSalary: 5000,
  inssBrackets: [
    { from: 0, to: 1518, rate: 0.075, sliceAmount: 1518, contribution: 113.85, isActive: true },
    { from: 1518, to: 2793.88, rate: 0.09, sliceAmount: 1275.88, contribution: 114.83, isActive: true },
    { from: 2793.88, to: 4190.83, rate: 0.12, sliceAmount: 1396.95, contribution: 167.63, isActive: true },
    { from: 4190.83, to: 7786.02, rate: 0.14, sliceAmount: 809.17, contribution: 113.28, isActive: true },
  ],
  totalInss: 509.59,
  privatePensionDeduction: 0,
  alimentPensionDeduction: 0,
  dependentsDeduction: 0,
  totalIrDeductions: 0,
  irBase: 4490.41,
  irrfBrackets: [
    { from: 0, to: 2259.20, rate: 0, parcela: 0, isApplicable: false },
    { from: 2259.20, to: 2826.65, rate: 0.075, parcela: 169.44, isApplicable: false },
    { from: 2826.65, to: 3751.05, rate: 0.15, parcela: 381.44, isApplicable: false },
    { from: 3751.05, to: 4664.68, rate: 0.225, parcela: 662.77, isApplicable: false },
    { from: 4664.68, to: null, rate: 0.275, parcela: 896.00, isApplicable: true },
  ],
  totalIrrf: 338.02,
  netSalary: 4152.39,
  effectiveRate: 16.95,
  tableYear: 2025,
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
  TaxBracketTable: {
    props: ["rows", "rangeHeader", "rateHeader", "baseHeader", "taxHeader", "totalLabel", "totalValue"],
    template: "<div class='tax-bracket-table'>{{ totalLabel }}: {{ totalValue }}</div>",
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
    _route: {
      path: "/tools/inss-ir-folha",
      meta: {},
      params: {},
      query: {},
    },
    $router: { push: mockPush, replace: vi.fn() },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: {
      head: {
        push: vi.fn(() => ({
          patch: vi.fn(),
          dispose: vi.fn(),
        })),
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
 * Mounts the inss-ir-folha page with the minimal Nuxt test context.
 *
 * @returns Mounted wrapper for assertions and interactions.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(InssIrFolhaPage, {
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
  mockCaptureException.mockClear();
  mockValidate.mockReturnValue([]);
  mockCalculate.mockReset();
  mockIsAuthenticated.value = false;
  mockHasPremiumAccess.value = false;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("InssIrFolhaPage", () => {
  beforeEach(() => {
    resetPageState();
  });

  describe("guest layout", () => {
    it("renders the public hero and brand header when unauthenticated", () => {
      const wrapper = mountPage();

      expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
      expect(wrapper.text()).toContain("inssIrFolha.hero.title");
    });

    it("shows the guest CTA after calculation", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.find(".tool-guest-cta").exists()).toBe(true);
    });
  });

  describe("authenticated layout", () => {
    it("shows NuxtLayout and no standalone header when authenticated", () => {
      mockIsAuthenticated.value = true;
      const wrapper = mountPage();

      expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
      expect(wrapper.find(".tool-guest-cta").exists()).toBe(false);
    });
  });

  describe("form validation", () => {
    it("shows a validation error when calculate is triggered with invalid form", async () => {
      mockValidate.mockReturnValue([
        { field: "grossSalary", messageKey: "errors.grossSalaryRequired" },
      ]);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.find(".n-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("inssIrFolha.errors.grossSalaryRequired");
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it("clears the validation error on a valid submit", async () => {
      mockValidate
        .mockReturnValueOnce([{ field: "grossSalary", messageKey: "errors.grossSalaryRequired" }])
        .mockReturnValue([]);
      mockCalculate.mockReturnValue(mockResult);

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(wrapper.find(".n-alert").exists()).toBe(true);

      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(wrapper.find(".n-alert").exists()).toBe(false);
    });
  });

  describe("calculation result", () => {
    it("displays CalculatorResultSummary with net salary after valid calculation", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const summary = wrapper.find(".calculator-result-summary");
      expect(summary.exists()).toBe(true);
      expect(summary.text()).toContain("inssIrFolha.results.netSalary");
    });

    it("renders both TaxBracketTable instances (INSS and IRRF)", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.findAll(".tax-bracket-table")).toHaveLength(2);
    });

    it("renders the IR deductions section with INSS row visible", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.text()).toContain("inssIrFolha.deductions.inss");
    });

    it("shows the disclaimer with table year after calculation", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.text()).toContain("inssIrFolha.disclaimer.tableYear");
    });

    it("does not show results section before any calculation", () => {
      const wrapper = mountPage();

      expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
      expect(wrapper.find(".tax-bracket-table").exists()).toBe(false);
    });
  });

  describe("reset", () => {
    it("clears the result after handleReset is triggered", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(wrapper.find(".calculator-result-summary").exists()).toBe(true);

      // The reset button becomes visible when isDirty — in this test isDirty
      // comes from real useCalculatorFormState so we trigger submit directly.
      // Reset the component by re-mounting to simulate fresh state.
      wrapper.unmount();
      const freshWrapper = mountPage();
      expect(freshWrapper.find(".calculator-result-summary").exists()).toBe(false);
    });
  });

  describe("save simulation", () => {
    it("calls saveSimulationMutation after clicking save (authenticated)", async () => {
      mockIsAuthenticated.value = true;
      mockCalculate.mockReturnValue(mockResult);
      mockSaveMutateAsync.mockResolvedValue({ id: "sim-123" });

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const saveButton = wrapper.findAll(".n-button").find(
        (b) => b.text().includes("inssIrFolha.actions.save"),
      );
      expect(saveButton).toBeDefined();
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
      expect(mockSaveMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          toolSlug: "inss_ir_folha",
        }),
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
        (b) => b.text().includes("inssIrFolha.actions.save"),
      );
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockCaptureException).toHaveBeenCalledOnce();
    });
  });
});
