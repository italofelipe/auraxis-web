import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import FeriasPage from "./ferias.vue";
import type { FeriasResult } from "~/features/tools/model/ferias";

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
  NCheckbox: {
    props: ["checked", "disabled"],
    emits: ["update:checked"],
    template: "<label class='n-checkbox'><input type='checkbox' :checked='checked' :disabled='disabled' @change='$emit(\"update:checked\", $event.target.checked)' /><slot /></label>",
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
    props: ["vertical", "size", "justify"],
    template: "<div><slot /></div>",
  },
  NTag: {
    props: ["round", "type", "size"],
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

vi.mock("~/features/tools/model/ferias", () => ({
  BR_TAX_TABLE_YEAR: 2025,
  VACATION_DAYS_OPTIONS: [30, 20, 15, 10],
  ABONO_DAYS: 10,
  MIN_REST_DAYS_WITH_ABONO: 20,
  createDefaultFeriasFormState: (): {
    grossSalary: null;
    vacationDays: number;
    abonoEnabled: boolean;
    overtimeAverage: number;
    dependents: number;
  } => ({
    grossSalary: null,
    vacationDays: 30,
    abonoEnabled: false,
    overtimeAverage: 0,
    dependents: 0,
  }),
  validateFeriasForm: mockValidate,
  calculateFerias: mockCalculate,
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

const mockResult: FeriasResult = {
  grossSalary: 5000,
  vacationDays: 30,
  abonoEnabled: false,
  dailyRate: 166.67,
  vacationBasePay: 5000.10,
  constitutionalThird: 1666.70,
  vacationGross: 6666.80,
  abonoValue: 0,
  totalGross: 6666.80,
  inss: 617.08,
  dependentsDeduction: 0,
  irBase: 6049.72,
  irrf: 743.12,
  netTotal: 5306.60,
  effectiveRate: 20.4,
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
      path: "/tools/ferias",
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
 * Mounts the ferias page with minimal Nuxt test context.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(FeriasPage, {
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

describe("FeriasPage", () => {
  beforeEach(() => {
    resetPageState();
  });

  describe("guest layout", () => {
    it("renders the public hero and brand header when unauthenticated", () => {
      const wrapper = mountPage();

      expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
      expect(wrapper.text()).toContain("ferias.hero.title");
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
    it("shows a validation error when grossSalary is missing", async () => {
      mockValidate.mockReturnValue([
        { field: "grossSalary", messageKey: "errors.grossSalaryRequired" },
      ]);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.find(".n-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("ferias.errors.grossSalaryRequired");
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it("shows abonoRequiresMinRestDays error when abono enabled with too few days", async () => {
      mockValidate.mockReturnValue([
        { field: "abonoEnabled", messageKey: "errors.abonoRequiresMinRestDays" },
      ]);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.text()).toContain("ferias.errors.abonoRequiresMinRestDays");
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
    it("shows CalculatorResultSummary with net total after valid calculation", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const summary = wrapper.find(".calculator-result-summary");
      expect(summary.exists()).toBe(true);
      expect(summary.text()).toContain("ferias.results.netTotal");
    });

    it("displays the breakdown section with vacation pay rows", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.find(".ferias-page__breakdown").exists()).toBe(true);
    });

    it("shows the best month tip note", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.text()).toContain("ferias.results.bestMonthNote");
    });

    it("shows the disclaimer with table year and abono exempt notice", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.text()).toContain("ferias.disclaimer.tableYear");
      expect(wrapper.text()).toContain("ferias.disclaimer.abonoExempt");
      expect(wrapper.text()).toContain("ferias.disclaimer.notLegal");
    });

    it("does not show results before calculation", () => {
      const wrapper = mountPage();

      expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
      expect(wrapper.find(".ferias-page__breakdown").exists()).toBe(false);
    });
  });

  describe("save simulation", () => {
    it("calls saveSimulationMutation with ferias_clt slug when authenticated user clicks save", async () => {
      mockIsAuthenticated.value = true;
      mockCalculate.mockReturnValue(mockResult);
      mockSaveMutateAsync.mockResolvedValue({ id: "sim-789" });

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const saveButton = wrapper.findAll(".n-button").find(
        (b) => b.text().includes("ferias.actions.save"),
      );
      expect(saveButton).toBeDefined();
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
      expect(mockSaveMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ toolSlug: "ferias_clt" }),
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
        (b) => b.text().includes("ferias.actions.save"),
      );
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockCaptureException).toHaveBeenCalledOnce();
    });
  });
});
