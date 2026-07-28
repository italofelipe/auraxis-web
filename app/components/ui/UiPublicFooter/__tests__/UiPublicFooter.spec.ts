import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "~/test-utils/renderWithProviders";
import UiPublicFooter from "../UiPublicFooter.vue";

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string, params?: Record<string, unknown>) => string } => ({
    t: (key: string, params?: Record<string, unknown>): string => {
      const map: Record<string, string> = {
        "components.publicFooter.brand": "Auraxis",
        "components.publicFooter.tagline": "Controle financeiro inteligente.",
        "components.publicFooter.columns.product.title": "Produto",
        "components.publicFooter.columns.product.links.tools": "Ferramentas",
        "components.publicFooter.columns.product.links.plans": "Planos",
        "components.publicFooter.columns.product.links.login": "Entrar",
        "components.publicFooter.columns.legal.title": "Legal",
        "components.publicFooter.columns.legal.links.terms": "Termos de Uso",
        "components.publicFooter.columns.legal.links.privacy": "Privacidade",
        "components.publicFooter.columns.legal.links.cookies": "Cookies",
        "components.publicFooter.copyright": "© {year} Auraxis. Todos os direitos reservados.",
      };
      if (params) {
        return Object.entries(params).reduce(
          (s, [k, v]) => s.replace(`{${k}}`, String(v)),
          map[key] ?? key,
        );
      }
      return map[key] ?? key;
    },
  }),
}));

const stubs = {
  NuxtLink: {
    template: "<a :href=\"to\"><slot /></a>",
    props: ["to"],
  },
};

describe("UiPublicFooter", () => {
  it("renders brand name and product signature", () => {
    const wrapper = renderWithProviders(UiPublicFooter, { global: { stubs } });

    expect(wrapper.text()).toContain("Auraxis");
    expect(wrapper.text()).toContain("Precision Layered Analytics");
  });

  it("renders legal navigation links", () => {
    const wrapper = renderWithProviders(UiPublicFooter, { global: { stubs } });

    expect(wrapper.text()).toContain("Termos de Uso");
    expect(wrapper.text()).toContain("Privacidade");
    expect(wrapper.text()).toContain("Cookies");
    expect(wrapper.text()).toContain("Blog");
    expect(wrapper.text()).toContain("Sobre nós");
    expect(wrapper.text()).toContain("Suporte");
    expect(wrapper.find("a[href=\"/blog\"]").exists()).toBe(true);
    expect(wrapper.find("a[href=\"/cookies\"]").exists()).toBe(true);
    expect(wrapper.find("a[href=\"/about-us\"]").exists()).toBe(true);
    expect(wrapper.find("a[href=\"/support\"]").exists()).toBe(true);
  });

  it("renders copyright with the provided year prop", () => {
    const wrapper = renderWithProviders(UiPublicFooter, {
      props: { year: 2025 },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("2025");
  });

  it("renders copyright with current year when year prop is omitted", () => {
    const wrapper = renderWithProviders(UiPublicFooter, { global: { stubs } });

    expect(wrapper.text()).toContain(String(new Date().getFullYear()));
  });

  it("renders the legal navigation label for accessibility", () => {
    const wrapper = renderWithProviders(UiPublicFooter, { global: { stubs } });

    expect(wrapper.find("nav").attributes("aria-label")).toBe("Legal");
  });

  describe("landing surface", () => {
    it("points product/institutional links at the app host", () => {
      const wrapper = renderWithProviders(UiPublicFooter, {
        props: { surface: "landing" },
        global: { stubs },
      });

      expect(wrapper.find("a[href=\"https://app.auraxis.com.br/about-us\"]").exists()).toBe(true);
      expect(wrapper.find("a[href=\"https://app.auraxis.com.br/support\"]").exists()).toBe(true);
      expect(wrapper.find("a[href=\"/about-us\"]").exists()).toBe(false);
      expect(wrapper.find("a[href=\"/support\"]").exists()).toBe(false);
    });

    it("keeps content and legal links relative to the apex", () => {
      const wrapper = renderWithProviders(UiPublicFooter, {
        props: { surface: "landing" },
        global: { stubs },
      });

      expect(wrapper.find("a[href=\"/blog\"]").exists()).toBe(true);
      expect(wrapper.find("a[href=\"/privacy\"]").exists()).toBe(true);
      expect(wrapper.find("a[href=\"/terms\"]").exists()).toBe(true);
      expect(wrapper.find("a[href=\"/cookies\"]").exists()).toBe(true);
    });
  });

  it("keeps every link relative on the marketing surface", () => {
    const wrapper = renderWithProviders(UiPublicFooter, {
      props: { surface: "marketing" },
      global: { stubs },
    });

    expect(wrapper.find("a[href=\"/about-us\"]").exists()).toBe(true);
    expect(wrapper.find("a[href=\"/support\"]").exists()).toBe(true);
    expect(wrapper.find("a[href^=\"https://app.auraxis.com.br\"]").exists()).toBe(false);
  });
});
