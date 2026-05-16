import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App } from "vue";

import SimulationsPage from "./simulations.vue";

const useSimulationsQueryMock = vi.hoisted(() => vi.fn());
const useDeleteSimulationMutationMock = vi.hoisted(() => vi.fn());
const navigateToMock = vi.hoisted(() => vi.fn());
const useEntitlementQueryMock = vi.hoisted(() => vi.fn());

vi.mock("#imports", () => ({
  computed,
  definePageMeta: vi.fn(),
  navigateTo: navigateToMock,
  ref,
  useHead: vi.fn(),
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

vi.mock("~/features/simulations/queries/use-simulations-query", () => ({
  useSimulationsQuery: useSimulationsQueryMock,
}));

vi.mock("~/features/simulations/queries/use-delete-simulation-mutation", () => ({
  useDeleteSimulationMutation: useDeleteSimulationMutationMock,
}));

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: useEntitlementQueryMock,
}));

vi.mock("~/components/paywall/PaywallGate.vue", () => ({
  default: {
    props: ["feature"],
    template: `
      <section data-testid="paywall-gate" :data-feature="feature">
        <slot />
        <slot name="locked" />
      </section>
    `,
  },
}));

vi.mock("~/components/paywall/UiUpgradePrompt.vue", () => ({
  default: {
    props: ["featureName", "description", "ctaLabel"],
    template: `
      <div data-testid="upgrade-prompt">
        <span>{{ featureName }}</span>
        <span>{{ description }}</span>
        <span>{{ ctaLabel }}</span>
      </div>
    `,
  },
}));

const stubs = {
  NPageHeader: {
    props: ["title", "subtitle"],
    template: "<header><h1>{{ title }}</h1><p>{{ subtitle }}</p></header>",
  },
  NButton: {
    template: "<button class='n-button' @click=\"$emit('click')\"><slot /></button>",
    emits: ["click"],
  },
  NDropdown: {
    props: ["options"],
    template: "<div><slot /></div>",
  },
  NRadioGroup: {
    template: "<div><slot /></div>",
  },
  NRadioButton: {
    props: ["value", "label"],
    template: "<button>{{ label }}</button>",
  },
  UiInlineError: {
    template: "<div data-testid='inline-error' />",
  },
  UiPageLoader: {
    template: "<div data-testid='page-loader' />",
  },
  UiEmptyState: {
    props: ["title", "description"],
    template: "<div data-testid='empty-state'>{{ title }} {{ description }}</div>",
  },
  SimulationCard: {
    template: "<article data-testid='simulation-card' />",
  },
};

/**
 * Installs the minimal Nuxt app context required by useHead in page tests.
 *
 * @param app Vue test app instance.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: {
      path: "/simulations",
      meta: {},
      params: {},
      query: {},
    },
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
  });
}

describe("SimulationsPage — entitlement gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationsQueryMock.mockReturnValue({
      data: ref({
        cards: [],
        simulations: [],
        total: 0,
        page: 1,
        perPage: 0,
        pages: 0,
      }),
      isLoading: ref(false),
      isError: ref(false),
    });
    useDeleteSimulationMutationMock.mockReturnValue({
      mutate: vi.fn(),
    });
    useEntitlementQueryMock.mockReturnValue({
      data: ref(false),
      isLoading: ref(false),
      isError: ref(false),
    });
  });

  it("wraps the page content in the advanced_simulations paywall gate", () => {
    const wrapper = mount(SimulationsPage, {
      global: {
        plugins: [{ install: nuxtContextPlugin }],
        stubs,
        mocks: { $t: (key: string): string => key },
      },
    });

    const gate = wrapper.find("[data-testid='paywall-gate']");
    expect(gate.exists()).toBe(true);
    expect(gate.attributes("data-feature")).toBe("advanced_simulations");
  });

  it("renders an upgrade prompt for the locked simulations state", () => {
    const wrapper = mount(SimulationsPage, {
      global: {
        plugins: [{ install: nuxtContextPlugin }],
        stubs,
        mocks: { $t: (key: string): string => key },
      },
    });

    const prompt = wrapper.find("[data-testid='upgrade-prompt']");
    expect(prompt.exists()).toBe(true);
    expect(prompt.text()).toContain("pages.simulations.title");
  });
});
