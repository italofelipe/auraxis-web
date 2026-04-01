import { ref, type Ref } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import UiToolsShell from "../UiToolsShell.vue";

/* ── Module mocks ─────────────────────────────────────────────── */

const toggleMock = vi.fn();
const openDrawerMock = vi.fn();
const closeDrawerMock = vi.fn();

const isCollapsedRef = ref(false);
const isMobileRef = ref(false);
const isDrawerOpenRef = ref(false);

vi.mock("~/composables/useSidebarState", () => ({
  useSidebarState: (): {
    isCollapsed: Ref<boolean>;
    toggle: () => void;
    collapse: () => void;
    expand: () => void;
  } => ({
    isCollapsed: isCollapsedRef,
    toggle: toggleMock,
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
    isMobile: isMobileRef,
    isDrawerOpen: isDrawerOpenRef,
    openDrawer: openDrawerMock,
    closeDrawer: closeDrawerMock,
    toggleDrawer: vi.fn(),
  }),
}));

vi.mock("vue-router", () => ({
  useRoute: (): { path: string } => ({ path: "/tools" }),
}));

vi.mock("lucide-vue-next", () => ({
  PieChart: { template: "<span class='icon-pie-chart' />" },
  Menu: { template: "<span class='icon-menu' />" },
  X: { template: "<span class='icon-x' />" },
}));

const stubs = {
  UiSidebarNav: {
    props: ["items", "collapsed", "currentRoute"],
    template: "<nav class='ui-sidebar-nav' />",
  },
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

/* ── Helpers ──────────────────────────────────────────────────── */

beforeEach(() => {
  isCollapsedRef.value = false;
  isMobileRef.value = false;
  isDrawerOpenRef.value = false;
  vi.clearAllMocks();
});

/* ── Tests ────────────────────────────────────────────────────── */

describe("UiToolsShell", () => {
  it("renders the sidebar and main content area", () => {
    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__sidebar").exists()).toBe(true);
    expect(wrapper.find(".ui-tools-shell__main").exists()).toBe(true);
  });

  it("renders default slot content in the main area", () => {
    const wrapper = mount(UiToolsShell, {
      slots: { default: "<p class='content'>Tool page</p>" },
      global: { stubs },
    });

    expect(wrapper.find(".content").exists()).toBe(true);
    expect(wrapper.find(".ui-tools-shell__content").text()).toContain("Tool page");
  });

  it("renders sidebar-footer slot when provided", () => {
    const wrapper = mount(UiToolsShell, {
      slots: { "sidebar-footer": "<div class='upgrade-block'>Upgrade</div>" },
      global: { stubs },
    });

    expect(wrapper.find(".upgrade-block").exists()).toBe(true);
  });

  it("does not render sidebar-footer wrapper when slot is not provided", () => {
    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__sidebar-footer").exists()).toBe(false);
  });

  it("applies collapsed class when isCollapsed is true on desktop", async () => {
    isCollapsedRef.value = true;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__sidebar--collapsed").exists()).toBe(true);
  });

  it("does not apply collapsed class when isMobile is true", async () => {
    isCollapsedRef.value = true;
    isMobileRef.value = true;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__sidebar--collapsed").exists()).toBe(false);
  });

  it("calls toggle when collapse button is clicked on desktop", async () => {
    const wrapper = mount(UiToolsShell, { global: { stubs } });

    const toggle = wrapper.find(".ui-tools-shell__toggle");
    await toggle.trigger("click");

    expect(toggleMock).toHaveBeenCalledOnce();
  });

  it("renders mobile topbar when isMobile is true", () => {
    isMobileRef.value = true;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__mobile-bar").exists()).toBe(true);
  });

  it("does not render mobile topbar on desktop", () => {
    isMobileRef.value = false;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__mobile-bar").exists()).toBe(false);
  });

  it("calls openDrawer when mobile menu button is clicked", async () => {
    isMobileRef.value = true;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    await wrapper.find(".ui-tools-shell__mobile-bar .ui-tools-shell__toggle").trigger("click");

    expect(openDrawerMock).toHaveBeenCalledOnce();
  });

  it("shows overlay when mobile drawer is open", () => {
    isMobileRef.value = true;
    isDrawerOpenRef.value = true;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__overlay").exists()).toBe(true);
  });

  it("calls closeDrawer when overlay is clicked", async () => {
    isMobileRef.value = true;
    isDrawerOpenRef.value = true;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    await wrapper.find(".ui-tools-shell__overlay").trigger("click");

    expect(closeDrawerMock).toHaveBeenCalledOnce();
  });

  it("applies drawer-open class when mobile drawer is open", () => {
    isMobileRef.value = true;
    isDrawerOpenRef.value = true;

    const wrapper = mount(UiToolsShell, { global: { stubs } });

    expect(wrapper.find(".ui-tools-shell__sidebar--drawer-open").exists()).toBe(true);
  });

  it("passes navItems to UiSidebarNav", () => {
    const navItems = [
      { key: "calculadoras", label: "Calculadoras", to: "/tools" },
    ];

    const wrapper = mount(UiToolsShell, {
      props: { navItems },
      global: { stubs },
    });

    const nav = wrapper.find(".ui-sidebar-nav");
    expect(nav.exists()).toBe(true);
  });
});
