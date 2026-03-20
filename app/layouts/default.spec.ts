import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { App } from "vue";
import DefaultLayout from "./default.vue";

vi.mock("~/stores/session", () => ({
  useSessionStore: vi.fn(() => ({
    userEmail: "test@auraxis.com",
    signOut: vi.fn(),
    isAuthenticated: true,
  })),
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

describe("DefaultLayout", () => {
  it("mounts with UiAppShell and passes nav items and slot content", () => {
    setActivePinia(createPinia());

    const wrapper = mount(DefaultLayout, {
      slots: {
        default: "<p>Conteudo</p>",
      },
      global: {
        plugins: [{ install: nuxtContextPlugin }],
        stubs: {
          UiAppShell: {
            props: ["navItems", "user", "pageTitle", "pageSubtitle"],
            template: `
              <div>
                <span v-for="item in navItems" :key="item.key">{{ item.label }}</span>
                <slot />
              </div>
            `,
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Dashboard");
    expect(wrapper.text()).toContain("Carteira");
    expect(wrapper.text()).toContain("Ferramentas");
    expect(wrapper.text()).toContain("Conteudo");
  });
});
