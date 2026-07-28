import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "~/test-utils/renderWithProviders";
import UiPublicHeader from "../UiPublicHeader.vue";

vi.mock("~/stores/session", () => ({
  useSessionStore: vi.fn(() => ({
    isAuthenticated: false,
    restore: vi.fn(),
    getAccessToken: vi.fn(() => null),
  })),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string, params?: Record<string, unknown>) => string } => ({
    t: (key: string, params?: Record<string, unknown>): string => {
      const map: Record<string, string> = {
        "components.publicHeader.brand": "Auraxis",
        "components.publicHeader.navAriaLabel": "Navegação principal",
        "components.publicHeader.nav.tools": "Ferramentas",
        "components.publicHeader.nav.plans": "Planos",
        "components.publicHeader.cta.login": "Entrar",
        "components.publicHeader.cta.register": "Criar conta",
        "components.publicHeader.cta.dashboard": "Ir para o Dashboard",
        "components.publicHeader.mobileMenuAriaLabel": "Abrir menu",
        "components.publicHeader.mobileMenuCloseAriaLabel": "Fechar menu",
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
    props: ["to", "activeClass"],
  },
};

describe("UiPublicHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the brand name", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Auraxis");
  });

  it("renders marketing navigation links on the marketing surface", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false, surface: "marketing" },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Produto");
    expect(wrapper.text()).toContain("Analytics");
    expect(wrapper.text()).toContain("Planos");
    expect(wrapper.text()).toContain("FAQ");
    expect(wrapper.text()).toContain("Blog");
  });

  it("hides landing navigation on the app surface", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false, surface: "app" },
      global: { stubs },
    });

    expect(wrapper.text()).not.toContain("Produto");
    expect(wrapper.text()).not.toContain("Analytics");
    expect(wrapper.text()).not.toContain("Blog");
    expect(wrapper.text()).toContain("Entrar");
    expect(wrapper.text()).toContain("Criar conta");
  });

  it("keeps auth CTAs relative on the marketing surface", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false, surface: "marketing" },
      global: { stubs },
    });

    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
    expect(hrefs).toContain("/login");
    expect(hrefs).toContain("/register");
    expect(hrefs).not.toContain("https://app.auraxis.com.br/login");
  });

  describe("landing surface", () => {
    it("shows content navigation instead of marketing anchors", () => {
      const wrapper = renderWithProviders(UiPublicHeader, {
        props: { authenticated: false, surface: "landing" },
        global: { stubs },
      });

      expect(wrapper.text()).toContain("Ferramentas");
      expect(wrapper.text()).toContain("Soluções");
      expect(wrapper.text()).toContain("Planos");
      expect(wrapper.text()).toContain("Blog");
      expect(wrapper.text()).not.toContain("Produto");
      expect(wrapper.text()).not.toContain("Analytics");
      expect(wrapper.text()).not.toContain("FAQ");
    });

    it("keeps content navigation relative to the apex", () => {
      const wrapper = renderWithProviders(UiPublicHeader, {
        props: { authenticated: false, surface: "landing" },
        global: { stubs },
      });

      const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
      expect(hrefs).toContain("/tools");
      expect(hrefs).toContain("/controle-financeiro");
      expect(hrefs).toContain("/#planos");
      expect(hrefs).toContain("/blog");
    });

    it("points auth CTAs at the app host", () => {
      const wrapper = renderWithProviders(UiPublicHeader, {
        props: { authenticated: false, surface: "landing" },
        global: { stubs },
      });

      const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
      expect(hrefs).toContain("https://app.auraxis.com.br/login");
      expect(hrefs).toContain("https://app.auraxis.com.br/register");
      expect(hrefs).not.toContain("/login");
      expect(hrefs).not.toContain("/register");
    });

    it("points the dashboard CTA at the app host when authenticated", () => {
      const wrapper = renderWithProviders(UiPublicHeader, {
        props: { authenticated: true, surface: "landing" },
        global: { stubs },
      });

      const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
      expect(hrefs).toContain("https://app.auraxis.com.br/dashboard");
    });
  });

  it("shows login and register when not authenticated", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Entrar");
    expect(wrapper.text()).toContain("Criar conta");
    expect(wrapper.text()).not.toContain("Ir para o Dashboard");
  });

  it("shows dashboard link when authenticated", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: true },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Ir para o Dashboard");
    expect(wrapper.text()).not.toContain("Entrar");
    expect(wrapper.text()).not.toContain("Criar conta");
  });

  it("mobile menu is closed by default", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false },
      global: { stubs },
    });

    expect(wrapper.find(".ui-public-header__mobile-menu").exists()).toBe(false);
  });

  it("opens mobile menu when hamburger is clicked", async () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false },
      global: { stubs },
    });

    const hamburger = wrapper.find(".ui-public-header__hamburger");
    await hamburger.trigger("click");

    expect(wrapper.find(".ui-public-header__mobile-menu").exists()).toBe(true);
    expect(hamburger.attributes("aria-expanded")).toBe("true");
  });

  it("closes mobile menu when hamburger is clicked again", async () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false },
      global: { stubs },
    });

    const hamburger = wrapper.find(".ui-public-header__hamburger");
    await hamburger.trigger("click");
    await hamburger.trigger("click");

    expect(wrapper.find(".ui-public-header__mobile-menu").exists()).toBe(false);
    expect(hamburger.attributes("aria-expanded")).toBe("false");
  });

  it("closes mobile menu when a mobile nav link is clicked", async () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false, surface: "marketing" },
      global: { stubs },
    });

    await wrapper.find(".ui-public-header__hamburger").trigger("click");
    expect(wrapper.find(".ui-public-header__mobile-menu").exists()).toBe(true);

    const mobileLinks = wrapper.findAll(".ui-public-header__mobile-link");
    await mobileLinks[0]!.trigger("click");

    expect(wrapper.find(".ui-public-header__mobile-menu").exists()).toBe(false);
  });

  it("shows dashboard link in mobile menu when authenticated", async () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: true },
      global: { stubs },
    });

    await wrapper.find(".ui-public-header__hamburger").trigger("click");

    expect(wrapper.find(".ui-public-header__mobile-menu").text()).toContain("Ir para o Dashboard");
  });
});
