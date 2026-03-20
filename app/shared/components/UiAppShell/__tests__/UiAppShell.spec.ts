import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { ref, type Ref } from "vue";
import UiAppShell from "../UiAppShell.vue";
import { LayoutDashboard, Wallet } from "lucide-vue-next";

vi.mock("vue-router", () => ({
  useRoute: (): { path: string } => ({ path: "/dashboard" }),
}));

vi.mock("~/composables/useSidebarState", () => ({
  useSidebarState: (): {
    isCollapsed: Ref<boolean>;
    toggle: () => void;
    collapse: () => void;
    expand: () => void;
  } => ({
    isCollapsed: ref(false),
    toggle: vi.fn(),
    collapse: vi.fn(),
    expand: vi.fn(),
  }),
}));

vi.mock("~/composables/useResponsiveShell", () => ({
  useResponsiveShell: (): {
    isMobile: Ref<boolean>;
    isDrawerOpen: Ref<boolean>;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
  } => ({
    isMobile: ref(false),
    isDrawerOpen: ref(false),
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
    toggleDrawer: vi.fn(),
  }),
}));

const defaultProps = {
  navItems: [
    {
      key: "dashboard",
      label: "Dashboard",
      to: "/dashboard",
      icon: LayoutDashboard,
    },
    { key: "wallet", label: "Carteira", to: "/carteira", icon: Wallet },
  ],
  user: { name: "João Silva", description: "Investidor Moderado" },
  pageTitle: "Dashboard",
  pageSubtitle: "Dezembro 2025",
};

const globalConfig = {
  plugins: [createPinia()],
  stubs: {
    NuxtLink: { template: "<a :href=\"to\"><slot /></a>", props: ["to"] },
    UiSidebarNav: { template: "<nav />" },
    UiTopbar: { template: "<header />" },
    Transition: { template: "<slot />" },
  },
};

describe("UiAppShell", () => {
  it("renders sidebar and main area", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(wrapper.find(".ui-app-shell__sidebar").exists()).toBe(true);
    expect(wrapper.find(".ui-app-shell__main").exists()).toBe(true);
  });

  it("renders slot content in main area", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
      slots: { default: "<p class=\"test-content\">Conteúdo</p>" },
    });
    expect(wrapper.find(".test-content").exists()).toBe(true);
  });

  it("renders logo text Auraxis", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(wrapper.find(".ui-app-shell__logo-text").text()).toBe("Auraxis");
  });

  it("renders topbar (header element) inside main area", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    // UiTopbar is stubbed as <header />
    expect(wrapper.find("header").exists()).toBe(true);
  });

  it("sidebar has aria-label", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    const sidebar = wrapper.find(".ui-app-shell__sidebar");
    expect(sidebar.attributes("aria-label")).toBe("Navegação principal");
  });

  it("snapshot default state", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
