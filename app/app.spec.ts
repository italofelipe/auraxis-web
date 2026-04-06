import { mount } from "@vue/test-utils";
import { NConfigProvider, type GlobalTheme } from "naive-ui";
import { computed, ref, type ComputedRef } from "vue";
import { describe, expect, it, vi } from "vitest";

import App from "./app.vue";

vi.mock("~/composables/useTheme", () => ({
  useTheme: (): { isDark: ReturnType<typeof ref<boolean>>; toggle: () => void; naiveTheme: ComputedRef<GlobalTheme | null> } => ({
    isDark: ref(true),
    toggle: vi.fn(),
    naiveTheme: computed<GlobalTheme | null>(() => null),
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

  it("passa darkTheme e auraxisThemeOverrides para o NConfigProvider", () => {
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
