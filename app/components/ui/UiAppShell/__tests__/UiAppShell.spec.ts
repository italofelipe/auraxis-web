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

const closeDrawerMock = vi.fn();
const openDrawerMock = vi.fn();

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
    openDrawer: openDrawerMock,
    closeDrawer: closeDrawerMock,
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

const UiTopbarStub = {
  template: `<header
    @click.self="$emit('menu-toggle')"
    data-testid="topbar"
  />`,
  emits: ["action", "user-settings", "user-logout", "menu-toggle"],
};

const globalConfig = {
  plugins: [createPinia()],
  stubs: {
    NuxtLink: { template: "<a :href=\"to\"><slot /></a>", props: ["to"] },
    UiSidebarNav: { template: "<nav />" },
    UiTopbar: UiTopbarStub,
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

  it("emits topbar-action when topbar emits action event", async () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          UiTopbar: {
            template: "<header />",
            emits: ["action", "user-settings", "user-logout", "menu-toggle"],
            mounted() {
              (this as unknown as { $emit: (e: string, v?: unknown) => void }).$emit("action", "my-action");
            },
          },
        },
      },
    });
    const emitted = wrapper.emitted("topbar-action");
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual(["my-action"]);
  });

  it("emits user-settings when topbar emits user-settings", async () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          UiTopbar: {
            template: "<header />",
            emits: ["action", "user-settings", "user-logout", "menu-toggle"],
            mounted() {
              (this as unknown as { $emit: (e: string) => void }).$emit("user-settings");
            },
          },
        },
      },
    });
    expect(wrapper.emitted("user-settings")).toBeTruthy();
  });

  it("emits user-logout when topbar emits user-logout", async () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          UiTopbar: {
            template: "<header />",
            emits: ["action", "user-settings", "user-logout", "menu-toggle"],
            mounted() {
              (this as unknown as { $emit: (e: string) => void }).$emit("user-logout");
            },
          },
        },
      },
    });
    expect(wrapper.emitted("user-logout")).toBeTruthy();
  });

  it("snapshot default state", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
