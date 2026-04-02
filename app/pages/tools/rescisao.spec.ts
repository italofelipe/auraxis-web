import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import RescisaoPage from "./rescisao.vue";
import type { RescisaoResult } from "~/features/tools/model/rescisao";

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
    template: "<label class='n-checkbox'><input type='checkbox' :checked='checked' @change='$emit(\"update:checked\", $event.target.checked)' /><slot /></label>",
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

vi.mock("~/composables/useToolCta", () => ({
  useToolCta: (): { showCta: ComputedRef<boolean> } => ({
    showCta: computed(() => !mockIsAuthenticated.value),
  }),
}));

vi.mock("~/core/observability", () => ({
  captureException: mockCaptureException,
}));

vi.mock("~/features/tools/model/rescisao", () => ({
  BR_TAX_TABLE_YEAR: 2025,
  TERMINATION_TYPES: ["sem_justa_causa", "com_justa_causa", "pedido_de_demissao", "acordo"],
  AVISO_PREVIO_BASE_DAYS: 30,
  AVISO_PREVIO_EXTRA_DAYS_PER_YEAR: 3,
  AVISO_PREVIO_MAX_DAYS: 90,
  FGTS_MULTA_RATE_SEM_JUSTA_CAUSA: 0.4,
  FGTS_MULTA_RATE_ACORDO: 0.2,
  createDefaultRescisaoFormState: (): {
    grossSalary: null;
    terminationType: string;
    yearsOfService: number;
    daysWorkedInLastMonth: number;
    monthsFor13: number;
    monthsForVacation: number;
    hasExpiredVacation: boolean;
    overtimeAverage: number;
    dependents: number;
    fgtsBalance: number;
  } => ({
    grossSalary: null,
    terminationType: "sem_justa_causa",
    yearsOfService: 1,
    daysWorkedInLastMonth: 30,
    monthsFor13: 1,
    monthsForVacation: 0,
    hasExpiredVacation: false,
    overtimeAverage: 0,
    dependents: 0,
    fgtsBalance: 0,
  }),
  validateRescisaoForm: mockValidate,
  calculateRescisao: mockCalculate,
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

const mockResult: RescisaoResult = {
  grossSalary: 5000,
  terminationType: "sem_justa_causa",
  noticeDays: 33,
  saldoSalario: 5000,
  avisoPrevio: 5500,
  decimoTerceiroProporcional: 2500,
  feriasProporcionaisBase: 2500,
  feriasProporcionaisThird: 833.33,
  feriasProporcionais: 3333.33,
  feriasVencidasBase: 0,
  feriasVencidasThird: 0,
  feriasVencidas: 0,
  fgtsMulta: 4000,
  totalGross: 20333.33,
  inssBase: 10000,
  inss: 967.08,
  dependentsDeduction: 0,
  irrfBase: 15366.25,
  irrf: 3326.22,
  netTotal: 16040.03,
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
};

/**
 * Installs a minimal Nuxt context so composables like useSeoMeta can resolve.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: {
      path: "/tools/rescisao",
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
 * Mounts the rescisao page with minimal Nuxt test context.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(RescisaoPage, {
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

describe("RescisaoPage", () => {
  beforeEach(() => {
    resetPageState();
  });

  describe("guest layout", () => {
    it("renders the public hero and brand header when unauthenticated", () => {
      const wrapper = mountPage();

      expect(wrapper.find(".rescisao-page__header").exists()).toBe(true);
      expect(wrapper.text()).toContain("rescisao.hero.title");
      expect(wrapper.text()).toContain("rescisao.header.publicTool");
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
      expect(wrapper.find(".rescisao-page__header").exists()).toBe(false);
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
      expect(wrapper.text()).toContain("rescisao.errors.grossSalaryRequired");
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it("shows validation error for invalid days worked", async () => {
      mockValidate.mockReturnValue([
        { field: "daysWorkedInLastMonth", messageKey: "errors.daysWorkedInLastMonthInvalid" },
      ]);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.text()).toContain("rescisao.errors.daysWorkedInLastMonthInvalid");
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
      expect(summary.text()).toContain("rescisao.results.netTotal");
    });

    it("displays the breakdown section with rescisão rows", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.find(".rescisao-page__breakdown").exists()).toBe(true);
    });

    it("shows the disclaimer with table year and aviso note", async () => {
      mockCalculate.mockReturnValue(mockResult);
      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(wrapper.text()).toContain("rescisao.disclaimer.tableYear");
      expect(wrapper.text()).toContain("rescisao.disclaimer.avisoPrevioNote");
      expect(wrapper.text()).toContain("rescisao.disclaimer.notLegal");
    });

    it("does not show results before calculation", () => {
      const wrapper = mountPage();

      expect(wrapper.find(".calculator-result-summary").exists()).toBe(false);
      expect(wrapper.find(".rescisao-page__breakdown").exists()).toBe(false);
    });
  });

  describe("save simulation", () => {
    it("calls saveSimulationMutation with rescisao_clt slug when authenticated user clicks save", async () => {
      mockIsAuthenticated.value = true;
      mockCalculate.mockReturnValue(mockResult);
      mockSaveMutateAsync.mockResolvedValue({ id: "sim-rescisao-001" });

      const wrapper = mountPage();

      await wrapper.find("form").trigger("submit");
      await flushPromises();

      const saveButton = wrapper.findAll(".n-button").find(
        (b) => b.text().includes("rescisao.actions.save"),
      );
      expect(saveButton).toBeDefined();
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
      expect(mockSaveMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ toolSlug: "rescisao_clt" }),
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
        (b) => b.text().includes("rescisao.actions.save"),
      );
      await saveButton!.trigger("click");
      await flushPromises();

      expect(mockCaptureException).toHaveBeenCalledOnce();
    });
  });
});
