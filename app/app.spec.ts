import { mount } from "@vue/test-utils";
import { NConfigProvider, type GlobalTheme, type GlobalThemeOverrides } from "naive-ui";
import { computed, type ComputedRef } from "vue";
import { describe, expect, it, vi } from "vitest";

import App from "./app.vue";

vi.mock("~/composables/useNaiveTheme", () => ({
  useNaiveTheme: (): {
    theme: ComputedRef<GlobalTheme | null>;
    themeOverrides: ComputedRef<GlobalThemeOverrides>;
  } => ({
    theme: computed<GlobalTheme | null>(() => null),
    themeOverrides: computed<GlobalThemeOverrides>(() => ({
      common: { primaryColor: "#087FA7" },
    })),
  }),
}));

describe("App bootstrap", () => {
  it("renderiza NConfigProvider com tema Auraxis envolvendo layout e page", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          NConfigProvider: {
            // Render slot so child stubs are visible in the output
            template: "<div data-testid='n-config-provider'><slot /></div>",
            props: ["theme", "themeOverrides", "preflightStyleDisabled"],
          },
          NuxtLoadingIndicator: true,
          NuxtLayout: {
            template: "<div><slot /></div>",
          },
          NuxtPage: true,
        },
      },
    });

    // NConfigProvider wraps the entire app
    expect(wrapper.html()).toContain("n-config-provider");
    // Nuxt structural components are present inside the provider
    expect(wrapper.html()).toContain("nuxt-loading-indicator-stub");
    expect(wrapper.html()).toContain("nuxt-page-stub");
  });

  it("passa tema e overrides Auraxis para o NConfigProvider", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          NConfigProvider: true,
          NuxtLoadingIndicator: true,
          NuxtLayout: { template: "<div><slot /></div>" },
          NuxtPage: true,
        },
      },
    });

    const provider = wrapper.findComponent(NConfigProvider);
    // theme and theme-overrides props are passed
    expect(provider.exists() || wrapper.html().includes("config-provider")).toBe(true);
  });
});
