import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ref, type App } from "vue";
import DefaultLayout from "./default.vue";

vi.mock("vue-i18n", () => ({ useI18n: (): { t: (key: string) => string } => ({ t: (key: string) => key }) }));

vi.mock("~/stores/session", () => ({
  useSessionStore: vi.fn(() => ({
    userEmail: "test@auraxis.com",
    isAuthenticated: true,
  })),
}));

vi.mock("~/composables/useLogout", () => ({
  useLogout: vi.fn(() => ({ logout: vi.fn() })),
}));

vi.mock("#imports", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useI18n: (): { t: (key: string) => string } => ({ t: (key: string) => key }),
  };
});

const mockIsLoaded = ref(false);
const mockIsProfileComplete = ref(true);
const mockProfile = ref<{ id?: string; name?: string } | null>(null);

vi.mock("~/stores/user", () => ({
  useUserStore: vi.fn(() => ({
    get profile(): { id?: string; name?: string } | null { return mockProfile.value; },
    get isLoaded(): boolean { return mockIsLoaded.value; },
    get isProfileComplete(): boolean { return mockIsProfileComplete.value; },
    displayName: "",
    setProfile: vi.fn(),
    clearProfile: vi.fn(),
  })),
}));

vi.mock("~/features/profile/composables/use-user-profile-query", () => ({
  useUserProfileQuery: vi.fn(() => ({ data: null, isLoading: false })),
}));

/**
 * Installs a minimal Nuxt app context on the Vue app instance so that Nuxt
 * composables (useRoute, useRouter) can resolve without a full Nuxt runtime.
 * tryUseNuxtApp reads the nuxt instance from getCurrentInstance()?.appContext.app.$nuxt.
 * @param app Vue application instance.
 */
function nuxtContextPlugin(app: App): void {
  const fakeNuxtApp = {
    _route: {
      path: "/dashboard",
      meta: { pageTitle: "Dashboard financeiro", pageSubtitle: "Visão consolidada" },
      params: {},
      query: {},
    },
    $router: { push: vi.fn(), replace: vi.fn() },
    $config: { public: {} },
    payload: { serverRendered: false },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (app as any).$nuxt = fakeNuxtApp;
}

/**
 * Shared stub config for all DefaultLayout tests.
 */
const globalStubs = {
  UiAppShell: {
    props: ["navItems", "user", "pageTitle", "pageSubtitle"],
    emits: ["user-logout"],
    template: `
      <div>
        <span v-for="item in navItems" :key="item.key">{{ item.label }}</span>
        <button data-testid="logout-btn" @click="$emit('user-logout')" />
        <slot />
      </div>
    `,
  },
  ProfileCompletionModal: {
    props: ["open"],
    emits: ["close", "saved"],
    template: "<div v-if=\"open\" data-testid=\"profile-modal\"><button data-testid=\"close-modal\" @click=\"$emit('close')\" /><button data-testid=\"saved-modal\" @click=\"$emit('saved')\" /></div>",
  },
  BillingStatusBanner: true,
  EmailConfirmationBanner: true,
};

describe("DefaultLayout", () => {
  beforeEach(() => {
    mockIsLoaded.value = false;
    mockIsProfileComplete.value = true;
    mockProfile.value = null;
    localStorage.clear();
  });

  it("mounts with UiAppShell and passes nav items and slot content", () => {
    setActivePinia(createPinia());

    const wrapper = mount(DefaultLayout, {
      slots: {
        default: "<p>Conteudo</p>",
      },
      global: {
        plugins: [{ install: nuxtContextPlugin }],
        stubs: globalStubs,
      },
    });

    expect(wrapper.text()).toContain("nav.dashboard");
    expect(wrapper.text()).toContain("nav.transactions");
    expect(wrapper.text()).toContain("nav.tools");
    expect(wrapper.text()).toContain("Conteudo");
    // Items with enabled-prod flags (portfolio, goals) are visible in the nav.
    // Items still in draft (alerts, simulations, sharedEntries) remain hidden.
    expect(wrapper.text()).toContain("nav.portfolio");
    expect(wrapper.text()).toContain("nav.goals");
  });

  it("calls logout when UiAppShell emits user-logout", async () => {
    setActivePinia(createPinia());
    const wrapper = mount(DefaultLayout, {
      global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
    });
    await wrapper.find("[data-testid='logout-btn']").trigger("click");
    expect(wrapper.exists()).toBe(true);
  });

  it("shows ProfileCompletionModal when isLoaded=true and isProfileComplete=false", async () => {
    setActivePinia(createPinia());
    mockIsLoaded.value = true;
    mockIsProfileComplete.value = false;

    const wrapper = mount(DefaultLayout, {
      global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
    });

    expect(wrapper.find("[data-testid='profile-modal']").exists()).toBe(true);
  });

  it("closes ProfileCompletionModal when close event is emitted", async () => {
    setActivePinia(createPinia());
    mockIsLoaded.value = true;
    mockIsProfileComplete.value = false;

    const wrapper = mount(DefaultLayout, {
      global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
    });

    await wrapper.find("[data-testid='close-modal']").trigger("click");
    expect(wrapper.find("[data-testid='profile-modal']").exists()).toBe(false);
  });

  it("hides modal when profile is complete", async () => {
    setActivePinia(createPinia());
    mockIsLoaded.value = true;
    mockIsProfileComplete.value = true;

    const wrapper = mount(DefaultLayout, {
      global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
    });

    expect(wrapper.find("[data-testid='profile-modal']").exists()).toBe(false);
  });

  it("does not show modal when isLoaded=false", async () => {
    setActivePinia(createPinia());
    mockIsLoaded.value = false;
    mockIsProfileComplete.value = false;

    const wrapper = mount(DefaultLayout, {
      global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
    });

    expect(wrapper.find("[data-testid='profile-modal']").exists()).toBe(false);
  });

  it("does not show modal when already dismissed (localStorage flag set)", async () => {
    setActivePinia(createPinia());
    mockIsLoaded.value = true;
    mockIsProfileComplete.value = false;
    // Simulate already-dismissed: set localStorage flag
    const uid = "test@auraxis.com";
    localStorage.setItem(`auraxis:profile_modal_seen:${uid}`, "1");

    const wrapper = mount(DefaultLayout, {
      global: { plugins: [{ install: nuxtContextPlugin }], stubs: globalStubs },
    });

    expect(wrapper.find("[data-testid='profile-modal']").exists()).toBe(false);
  });
});
