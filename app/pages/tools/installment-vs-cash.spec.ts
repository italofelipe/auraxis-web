import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type App } from "vue";

import InstallmentVsCashPage from "./installment-vs-cash.vue";
import { useToolContextStore } from "~/stores/toolContext";
import type { InstallmentVsCashFormState } from "~/features/tools/model/installment-vs-cash";

const mockPush = vi.hoisted(() => vi.fn());
const mockSaveRedirect = vi.hoisted(() => vi.fn());
const mockMessageSuccess = vi.hoisted(() => vi.fn());
const mockMessageError = vi.hoisted(() => vi.fn());
const mockCalculateMutateAsync = vi.hoisted(() => vi.fn());
const mockSaveMutateAsync = vi.hoisted(() => vi.fn());
const mockGoalMutateAsync = vi.hoisted(() => vi.fn());
const mockExpenseMutateAsync = vi.hoisted(() => vi.fn());
const mockEntitlementCheck = vi.hoisted(() => vi.fn().mockResolvedValue(false));
const mockCaptureException = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = ref(false);
const mockHasPremiumAccess = ref(false);

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string) => key }),
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useSeoMeta: vi.fn(),
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string) => key }),
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

vi.mock("naive-ui", () => ({
  NAlert: {
    props: ["type"],
    template: "<div class='n-alert'><slot /></div>",
  },
  NButton: {
    props: ["type", "size", "loading", "disabled", "quaternary"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NDatePicker: {
    props: ["value", "type", "clearable"],
    template: "<input class='n-date-picker' />",
  },
  NForm: { template: "<form><slot /></form>" },
  NFormItem: {
    props: ["label"],
    template: "<div class='n-form-item'><slot /></div>",
  },
  NInput: {
    props: ["value", "type"],
    template: "<input class='n-input' />",
  },
  NModal: {
    props: ["show", "preset", "title"],
    template: "<div v-if='show' class='n-modal'><slot /></div>",
  },
  NSpace: {
    props: ["vertical", "size", "justify"],
    template: "<div><slot /></div>",
  },
  NTag: {
    props: ["round", "type"],
    template: "<span><slot /></span>",
  },
  NThing: {
    props: ["title", "description"],
    template: "<div><strong>{{ title }}</strong><span>{{ description }}</span><slot /></div>",
  },
  useMessage: (): { success: typeof mockMessageSuccess; error: typeof mockMessageError } => ({
    success: mockMessageSuccess,
    error: mockMessageError,
  }),
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
  };
});

vi.mock("~/composables/useAuthRedirectContext", () => ({
  useAuthRedirectContext: (): { saveRedirect: typeof mockSaveRedirect } => ({
    saveRedirect: mockSaveRedirect,
  }),
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): {
    restore: ReturnType<typeof vi.fn>;
    isAuthenticated: boolean;
    userEmail: string | null;
  } => ({
    restore: vi.fn(),
    get isAuthenticated(): boolean {
      return mockIsAuthenticated.value;
    },
    userEmail: null,
  }),
}));

vi.mock("~/features/paywall/services/entitlement.client", () => ({
  useEntitlementClient: (): {
    checkEntitlement: typeof mockEntitlementCheck;
  } => ({
    checkEntitlement: mockEntitlementCheck,
  }),
}));

vi.mock("~/core/observability", () => ({
  captureException: mockCaptureException,
}));

vi.mock("~/features/tools/queries/use-installment-vs-cash-calculate-mutation", () => ({
  useInstallmentVsCashCalculateMutation: (): {
    mutateAsync: typeof mockCalculateMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
    isError: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: ref(false),
    isError: ref(false),
  }),
}));

vi.mock("~/features/tools/queries/use-save-installment-vs-cash-mutation", () => ({
  useSaveInstallmentVsCashMutation: (): {
    mutateAsync: typeof mockSaveMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/tools/queries/use-create-goal-from-installment-vs-cash-mutation", () => ({
  useCreateGoalFromInstallmentVsCashMutation: (): {
    mutateAsync: typeof mockGoalMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockGoalMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/tools/queries/use-create-planned-expense-from-installment-vs-cash-mutation", () => ({
  useCreatePlannedExpenseFromInstallmentVsCashMutation: (): {
    mutateAsync: typeof mockExpenseMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockExpenseMutateAsync,
    isPending: ref(false),
  }),
}));

const globalStubs = {
  UiPageHeader: {
    props: ["title", "subtitle"],
    template: "<div><h1>{{ title }}</h1><p>{{ subtitle }}</p></div>",
  },
  UiGlassPanel: { template: "<div><slot /></div>" },
  UiSurfaceCard: { template: "<div><slot /></div>" },
  UiSegmentedControl: {
    props: ["modelValue", "options"],
    template: "<div class='segmented' />",
  },
  InstallmentVsCashCalculatorForm: {
    props: ["modelValue", "loading"],
    template: `
      <div>
        <button class='calculator-update' @click='$emit("update:modelValue", validForm)'>Preencher</button>
        <button class='calculator-submit' @click='$emit("submit")'>Calcular</button>
      </div>
    `,
    data: (): { validForm: InstallmentVsCashFormState } => ({
      validForm: {
        scenarioLabel: "Notebook",
        cashPrice: 900,
        installmentCount: 3,
        installmentInputMode: "total",
        installmentAmount: null,
        installmentTotal: 990,
        firstPaymentDelayPreset: "30_days",
        customFirstPaymentDelayDays: null,
        opportunityRateType: "manual",
        opportunityRateAnnual: 12,
        inflationRateAnnual: 4.5,
        feesEnabled: false,
        feesUpfront: null,
      },
    }),
    emits: ["submit", "update:modelValue"],
  },
  InstallmentVsCashResults: {
    props: ["calculation"],
    template: "<div class='results'>resultado</div>",
  },
  InstallmentVsCashActionBar: {
    props: ["isAuthenticated", "hasPremiumAccess", "isSaving", "isBridging", "hasSavedSimulation"],
    template: `
      <div class='action-bar'>
        <button class='save-action' @click='$emit("save")'>save</button>
        <button class='goal-action' @click='$emit("goal")'>goal</button>
        <button class='expense-action' @click='$emit("expense")'>expense</button>
      </div>
    `,
    emits: ["save", "goal", "expense"],
  },
};

const calculationResponse = {
  toolId: "installment_vs_cash",
  ruleVersion: "2026.1",
  input: {
    cashPrice: 900,
    installmentCount: 3,
    installmentAmount: 330,
    installmentTotal: 990,
    firstPaymentDelayDays: 30,
    opportunityRateType: "manual",
    opportunityRateAnnual: 12,
    inflationRateAnnual: 4.5,
    feesUpfront: 0,
    scenarioLabel: "Notebook",
  },
  result: {
    recommendedOption: "cash",
    recommendationReason: "À vista ficou melhor.",
    formulaExplainer: "Comparação por valor presente.",
    comparison: {
      cashOptionTotal: 900,
      installmentOptionTotal: 990,
      installmentPresentValue: 940,
      installmentRealValueToday: 930,
      presentValueDeltaVsCash: 40,
      absoluteDeltaVsCash: 90,
      relativeDeltaVsCashPercent: 4.44,
      breakEvenDiscountPercent: 9.09,
      breakEvenOpportunityRateAnnual: 18.2,
    },
    options: {
      cash: { total: 900 },
      installment: {
        count: 3,
        amounts: [330, 330, 330],
        installmentAmount: 330,
        nominalTotal: 990,
        upfrontFees: 0,
        firstPaymentDelayDays: 30,
      },
    },
    neutralityBand: { absoluteBrl: 10, relativePercent: 1 },
    assumptions: {
      opportunityRateType: "manual",
      opportunityRateAnnualPercent: 12,
      inflationRateAnnualPercent: 4.5,
      periodicity: "monthly",
      firstPaymentDelayDays: 30,
      upfrontFeesApplyTo: "installment",
      neutralityRule: "hybrid",
    },
    indicatorSnapshot: null,
    schedule: [],
  },
};

/**
 * Installs a minimal Nuxt context so composables like useHead can resolve.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: {
      path: "/tools/parcelado-vs-a-vista",
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
 * Mounts the public calculator page with the minimal Nuxt test context.
 *
 * @returns Mounted wrapper for assertions and interactions.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(InstallmentVsCashPage, {
    global: {
      plugins: [{ install: nuxtContextPlugin }],
      stubs: globalStubs,
    },
  });
}

/**
 * Fills the stubbed calculator form and submits it once.
 *
 * @param wrapper Mounted page wrapper.
 */
async function calculateFromStubForm(
  wrapper: ReturnType<typeof mountPage>,
): Promise<void> {
  await wrapper.find(".calculator-update").trigger("click");
  await wrapper.find(".calculator-submit").trigger("click");
  await flushPromises();
}

/**
 * Resets all hoisted mocks and local session state between tests.
 */
function resetPageState(): void {
  setActivePinia(createPinia());
  mockPush.mockClear();
  mockSaveRedirect.mockClear();
  mockCalculateMutateAsync.mockReset();
  mockSaveMutateAsync.mockReset();
  mockGoalMutateAsync.mockReset();
  mockExpenseMutateAsync.mockReset();
  mockMessageSuccess.mockClear();
  mockMessageError.mockClear();
  mockCaptureException.mockClear();
  mockIsAuthenticated.value = false;
  mockHasPremiumAccess.value = false;
  sessionStorage.clear();
}

describe("InstallmentVsCashPage", () => {
  beforeEach(() => {
    resetPageState();
  });

  it("renders the public hero copy", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("pages.installmentVsCash.hero.title");
    expect(wrapper.text()).toContain("pages.installmentVsCash.header.publicTool");
  });

  it("shows a validation warning before calling the API", async () => {
    const wrapper = mountPage();

    await wrapper.find(".calculator-submit").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Informe um preço à vista maior que zero.");
    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it("submits the calculation once the form emits valid data", async () => {
    mockCalculateMutateAsync.mockResolvedValue(calculationResponse);

    const wrapper = mountPage();
    await calculateFromStubForm(wrapper);

    expect(mockCalculateMutateAsync).toHaveBeenCalledOnce();
    expect(wrapper.find(".results").exists()).toBe(true);
  });

  it("reports and surfaces calculation failures", async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error("boom"));

    const wrapper = mountPage();
    await calculateFromStubForm(wrapper);

    expect(mockCaptureException).toHaveBeenCalledOnce();
    expect(mockMessageError).toHaveBeenCalledWith(
      "pages.installmentVsCash.errors.calculate",
    );
  });

  it("persists context and redirects to login when saving unauthenticated", async () => {
    mockCalculateMutateAsync.mockResolvedValue(calculationResponse);

    const wrapper = mountPage();
    await calculateFromStubForm(wrapper);
    await wrapper.find(".save-action").trigger("click");

    const toolContextStore = useToolContextStore();
    expect(toolContextStore.pendingToolId).toBe("installment_vs_cash");
    expect(mockSaveRedirect).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("saves the simulation directly for authenticated users", async () => {
    mockIsAuthenticated.value = true;
    mockCalculateMutateAsync.mockResolvedValue(calculationResponse);
    mockSaveMutateAsync.mockResolvedValue({
      simulation: { id: "sim-1", goalId: null },
    });

    const wrapper = mountPage();
    await calculateFromStubForm(wrapper);
    await wrapper.find(".save-action").trigger("click");

    expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
    expect(mockMessageSuccess).toHaveBeenCalledWith("pages.installmentVsCash.success.saved");
  });

  it("reports save failures for authenticated users", async () => {
    mockIsAuthenticated.value = true;
    mockCalculateMutateAsync.mockResolvedValue(calculationResponse);
    mockSaveMutateAsync.mockRejectedValue(new Error("save failed"));

    const wrapper = mountPage();
    await calculateFromStubForm(wrapper);
    await wrapper.find(".save-action").trigger("click");
    await flushPromises();

    expect(mockCaptureException).toHaveBeenCalledOnce();
    expect(mockMessageError).toHaveBeenCalledWith(
      "pages.installmentVsCash.errors.save",
    );
  });

  it("routes to plans when a premium action is requested without premium access", async () => {
    mockIsAuthenticated.value = true;
    mockCalculateMutateAsync.mockResolvedValue(calculationResponse);

    const wrapper = mountPage();
    await calculateFromStubForm(wrapper);
    await wrapper.find(".goal-action").trigger("click");

    expect(mockPush).toHaveBeenCalledWith("/plans");
  });

  it("opens the goal modal when the user is premium", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculateMutateAsync.mockResolvedValue(calculationResponse);
    mockSaveMutateAsync.mockResolvedValue({
      simulation: { id: "sim-1", goalId: null },
    });

    const wrapper = mountPage();
    await calculateFromStubForm(wrapper);
    await wrapper.find(".goal-action").trigger("click");
    await flushPromises();

    expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
    expect(wrapper.find(".n-modal").exists()).toBe(true);
  });
});
