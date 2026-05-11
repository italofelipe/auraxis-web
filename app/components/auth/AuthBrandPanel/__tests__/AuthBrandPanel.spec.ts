import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import AuthBrandPanel from "../AuthBrandPanel.vue";

const { mockRoutePath } = vi.hoisted(() => ({
  mockRoutePath: { value: "/login" },
}));

vi.mock("#app", () => ({
  useRoute: (): { path: string } => ({
    get path(): string { return mockRoutePath.value; },
  }),
}));

const globalConfig = {
  mocks: {
    $t: (key: string): string => key,
  },
  stubs: {
    AuthFeatureList: {
      props: ["features"],
      template: `
        <div class="auth-feature-list-stub">
          <article v-for="feature in features" :key="feature.title">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      `,
    },
    NuxtLink: {
      props: ["to"],
      template: "<a :href='to'><slot /></a>",
    },
  },
};

describe("AuthBrandPanel", () => {
  it("matches the login prototype copy without the recovery metric panel", () => {
    mockRoutePath.value = "/login";

    const wrapper = mount(AuthBrandPanel, { global: globalConfig });

    expect(wrapper.text()).toContain("Volte ao seu painel de analytics em segundos.");
    expect(wrapper.text()).toContain("Resumo executivo para decisões rápidas e profundidade analítica para investigar cada variação.");
    expect(wrapper.find(".auth-brand__metric").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("SYS.VER.4.2.9");
  });

  it("matches the signup prototype headline and keeps the simple auth panel", () => {
    mockRoutePath.value = "/register";

    const wrapper = mount(AuthBrandPanel, { global: globalConfig });

    expect(wrapper.text()).toContain("Crie sua conta e ligue seu painel de controle financeiro.");
    expect(wrapper.text()).toContain("Cadastro curto, linguagem clara e experiência consistente com o analytics principal.");
    expect(wrapper.find(".auth-brand__metric").exists()).toBe(false);
  });

  it("renders the security analytics panel for password recovery", () => {
    mockRoutePath.value = "/forgot-password";

    const wrapper = mount(AuthBrandPanel, { global: globalConfig });

    expect(wrapper.text()).toContain("Security DNA Active");
    expect(wrapper.text()).toContain("Taxa de Mitigação de Ameaças");
    expect(wrapper.text()).toContain("AES-256-GCM");
    expect(wrapper.text()).toContain("2,408 Ativos");
    expect(wrapper.text()).toContain("SYS.VER.4.2.9");
  });
});
