import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import AuthBrandPanel from "../AuthBrandPanel.vue";

vi.mock("vue-i18n");

const { mockRoutePath } = vi.hoisted(() => ({
  mockRoutePath: { value: "/login" },
}));

vi.mock("#app", () => ({
  useRoute: (): { path: string } => ({
    get path(): string {
      return mockRoutePath.value;
    },
  }),
}));

const globalConfig = {
  mocks: {
    $t: (key: string): string => key,
  },
  stubs: {
    NuxtLink: {
      props: ["to"],
      template: "<a :href='to'><slot /></a>",
    },
  },
};

describe("AuthBrandPanel", () => {
  it("renders the login hero with CTAs and three feature chips", () => {
    mockRoutePath.value = "/login";

    const wrapper = mount(AuthBrandPanel, { global: globalConfig });

    expect(wrapper.find(".auth-hero--login").exists()).toBe(true);
    // Login copy comes from i18n keys (mock echoes the key).
    expect(wrapper.text()).toContain("auth.login.hero.headline");
    expect(wrapper.text()).toContain("auth.login.hero.ctaCreate");
    expect(wrapper.text()).toContain("auth.login.hero.ctaRecover");
    expect(wrapper.findAll(".auth-hero__chip")).toHaveLength(3);
    // Old growth/security panel artifacts must be gone.
    expect(wrapper.text()).not.toContain("SYS.VER.4.2.9");
    expect(wrapper.find(".auth-brand__metric").exists()).toBe(false);
  });

  it("renders the register hero variant without the login CTAs/chips", () => {
    mockRoutePath.value = "/register";

    const wrapper = mount(AuthBrandPanel, { global: globalConfig });

    expect(wrapper.find(".auth-hero--register").exists()).toBe(true);
    expect(wrapper.text()).toContain("Crie sua conta e ligue seu painel financeiro.");
    expect(wrapper.findAll(".auth-hero__chip")).toHaveLength(0);
  });

  it("renders the recover hero variant for password recovery", () => {
    mockRoutePath.value = "/forgot-password";

    const wrapper = mount(AuthBrandPanel, { global: globalConfig });

    expect(wrapper.find(".auth-hero--recover").exists()).toBe(true);
    expect(wrapper.text()).toContain("Recupere o acesso com tranquilidade.");
  });
});
