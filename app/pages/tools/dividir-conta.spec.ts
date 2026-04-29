import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App, type ComputedRef } from "vue";

import DividirContaPage from "./dividir-conta.vue";
import type { DividirContaResult } from "~/features/tools/model/dividir-conta";

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
    template: "<div><strong>{{ title }}</strong><span>{{ description }}</span></div>",
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

vi.mock("~/features/tools/model/dividir-conta", () => ({
  DIVIDIR_CONTA_MODES: ["equal", "individual"],
  createDefaultDividirContaFormState: (): {
    total: null;
    serviceFeePct: number;
    tipPct: number;
    people: number;
    mode: string;
    individualAmounts: null[];
  } => ({
    total: null,
    serviceFeePct: 10,
    tipPct: 0,
    people: 2,
    mode: "equal",
    individualAmounts: [null, null],
  }),
  validateDividirContaForm: mockValidate,
  calculateDividirConta: mockCalculate,
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

vi.mock("~/features/goals/queries/use-create-goal-mutation", () => ({
  useCreateGoalMutation: (): {
    mutateAsync: typeof mockGoalMutateAsync;
    isPending: ReturnType<typeof ref<boolean>>;
  } => ({
    mutateAsync: mockGoalMutateAsync,
    isPending: ref(false),
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockResult: DividirContaResult = {
  serviceFeeBrl: 20,
  tipBrl: 0,
  totalWithFees: 220,
  perPersonEqual: 55,
  perPersonIndividual: [55, 55, 55, 55],
};

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
  VChart: {
    template: "<div class='v-chart'></div>",
  },
};

/**
 * Installs a minimal Nuxt context so composables can resolve.
 *
 * @param app Vue app instance under test.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: { path: "/tools/dividir-conta", meta: {}, params: {}, query: {} },
    $router: { push: mockPush, replace: vi.fn() },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: {
      head: {
        push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })),
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
 * Mounts the DividirConta page with minimal Nuxt test context.
 *
 * @returns Mounted wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(DividirContaPage, {
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

beforeEach(() => {
  resetPageState();
});

describe("DividirContaPage — guest layout", () => {
  it("renders the public hero and brand header when unauthenticated", () => {
    const wrapper = mountPage();

    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
    expect(wrapper.text()).toContain("dividirConta.hero.title");
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

describe("DividirContaPage — authenticated layout", () => {
  it("shows NuxtLayout and no standalone header when authenticated", () => {
    mockIsAuthenticated.value = true;
    const wrapper = mountPage();

    expect(wrapper.find(".nuxt-layout").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta").exists()).toBe(false);
  });
});

describe("DividirContaPage — form validation", () => {
  it("shows a validation error when total is missing", async () => {
    mockValidate.mockReturnValue([
      { field: "total", messageKey: "errors.totalRequired" },
    ]);
    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".n-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("dividirConta.errors.totalRequired");
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it("clears validation error on a valid second submit", async () => {
    mockValidate
      .mockReturnValueOnce([{ field: "total", messageKey: "errors.totalRequired" }])
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

describe("DividirContaPage — calculation result", () => {
  it("shows CalculatorResultSummary with per-person amount after valid calculation", async () => {
    mockCalculate.mockReturnValue(mockResult);
    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const summary = wrapper.find(".calculator-result-summary");
    expect(summary.exists()).toBe(true);
    expect(summary.text()).toContain("dividirConta.results.perPersonEqual");
  });
});

describe("DividirContaPage — save simulation", () => {
  it("calls saveSimulationMutation with dividir_conta slug when authenticated user clicks save", async () => {
    mockIsAuthenticated.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-abc" });

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const saveButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("dividirConta.actions.save"),
    );
    expect(saveButton).toBeDefined();
    await saveButton!.trigger("click");
    await flushPromises();

    expect(mockSaveMutateAsync).toHaveBeenCalledOnce();
    expect(mockSaveMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: "split-bill" }),
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
      (b) => b.text().includes("dividirConta.actions.save"),
    );
    await saveButton!.trigger("click");
    await flushPromises();

    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe("DividirContaPage — add as goal (premium)", () => {
  it("calls createGoalMutation with perPersonEqual as target_amount for premium user", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-def" });
    mockGoalMutateAsync.mockResolvedValue({ id: "goal-xyz" });

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const goalButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("dividirConta.actions.addAsGoal"),
    );
    expect(goalButton).toBeDefined();
    await goalButton!.trigger("click");
    await flushPromises();

    expect(mockGoalMutateAsync).toHaveBeenCalledOnce();
    expect(mockGoalMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ target_amount: mockResult.perPersonEqual }),
    );
  });

  it("does not show add-as-goal button for non-premium user", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = false;
    mockCalculate.mockReturnValue(mockResult);

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const goalButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("dividirConta.actions.addAsGoal"),
    );
    expect(goalButton).toBeUndefined();
  });

  it("captures exception when add-as-goal fails", async () => {
    mockIsAuthenticated.value = true;
    mockHasPremiumAccess.value = true;
    mockCalculate.mockReturnValue(mockResult);
    mockSaveMutateAsync.mockResolvedValue({ id: "sim-ghi" });
    mockGoalMutateAsync.mockRejectedValue(new Error("goal error"));

    const wrapper = mountPage();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const goalButton = wrapper.findAll(".n-button").find(
      (b) => b.text().includes("dividirConta.actions.addAsGoal"),
    );
    await goalButton!.trigger("click");
    await flushPromises();

    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});
