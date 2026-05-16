import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type App } from "vue";

import SharedEntriesPage from "./shared-entries.vue";

const useSharedByMeQueryMock = vi.hoisted(() => vi.fn());
const useSharedWithMeQueryMock = vi.hoisted(() => vi.fn());
const useRevokeSharedEntryMutationMock = vi.hoisted(() => vi.fn());
const useEntitlementQueryMock = vi.hoisted(() => vi.fn());

vi.mock("#imports", () => ({
  computed,
  definePageMeta: vi.fn(),
  ref,
  useHead: vi.fn(),
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

vi.mock("~/features/shared-entries/queries/use-shared-by-me-query", () => ({
  useSharedByMeQuery: useSharedByMeQueryMock,
}));

vi.mock("~/features/shared-entries/queries/use-shared-with-me-query", () => ({
  useSharedWithMeQuery: useSharedWithMeQueryMock,
}));

vi.mock("~/features/shared-entries/queries/use-revoke-shared-entry-mutation", () => ({
  useRevokeSharedEntryMutation: useRevokeSharedEntryMutationMock,
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
  NCard: {
    template: "<section><slot /></section>",
  },
  NStatistic: {
    props: ["label", "value"],
    template: "<div>{{ label }} {{ value }}</div>",
  },
  NTabs: {
    template: "<div><slot /></div>",
  },
  NTabPane: {
    props: ["name", "tab"],
    template: "<section><slot /></section>",
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
  SharedEntryRow: {
    template: "<div data-testid='shared-entry-row' />",
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
      path: "/shared-entries",
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

describe("SharedEntriesPage — entitlement gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSharedByMeQueryMock.mockReturnValue({
      data: ref([]),
      isLoading: ref(false),
      isError: ref(false),
    });
    useSharedWithMeQueryMock.mockReturnValue({
      data: ref([]),
      isLoading: ref(false),
      isError: ref(false),
    });
    useRevokeSharedEntryMutationMock.mockReturnValue({
      mutate: vi.fn(),
    });
    useEntitlementQueryMock.mockReturnValue({
      data: ref(false),
      isLoading: ref(false),
      isError: ref(false),
    });
  });

  it("wraps the page content in the shared_entries paywall gate", () => {
    const wrapper = mount(SharedEntriesPage, {
      global: {
        plugins: [{ install: nuxtContextPlugin }],
        stubs,
        mocks: { $t: (key: string): string => key },
      },
    });

    const gate = wrapper.find("[data-testid='paywall-gate']");
    expect(gate.exists()).toBe(true);
    expect(gate.attributes("data-feature")).toBe("shared_entries");
  });

  it("renders an upgrade prompt for the locked shared entries state", () => {
    const wrapper = mount(SharedEntriesPage, {
      global: {
        plugins: [{ install: nuxtContextPlugin }],
        stubs,
        mocks: { $t: (key: string): string => key },
      },
    });

    const prompt = wrapper.find("[data-testid='upgrade-prompt']");
    expect(prompt.exists()).toBe(true);
    expect(prompt.text()).toContain("pages.sharedEntries.title");
  });
});
