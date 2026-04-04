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

  it("renders navigation links for tools and plans", () => {
    const wrapper = renderWithProviders(UiPublicHeader, {
      props: { authenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Ferramentas");
    expect(wrapper.text()).toContain("Planos");
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
      props: { authenticated: false },
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
