import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { LayoutDashboard, Wallet, BarChart2 } from "lucide-vue-next";
import UiSidebarNav from "../UiSidebarNav.vue";
import type { SidebarNavItem } from "../UiSidebarNav.types";

const NuxtLinkStub = {
  template: "<a :href=\"to\" v-bind=\"$attrs\"><slot /></a>",
  props: ["to"],
};

const globalConfig = {
  stubs: { NuxtLink: NuxtLinkStub },
};

const items: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { key: "carteira", label: "Carteira", to: "/carteira", icon: Wallet },
  { key: "analises", label: "Análises", to: "/analises", icon: BarChart2 },
];

describe("UiSidebarNav", () => {
  it("renders all items", () => {
    const wrapper = mount(UiSidebarNav, {
      props: { items },
      global: globalConfig,
    });
    const links = wrapper.findAll("a");
    expect(links).toHaveLength(3);
    expect(links[0].text()).toContain("Dashboard");
    expect(links[1].text()).toContain("Carteira");
    expect(links[2].text()).toContain("Análises");
  });

  it("marks active item via exact match of currentRoute", () => {
    const wrapper = mount(UiSidebarNav, {
      props: { items, currentRoute: "/carteira" },
      global: globalConfig,
    });
    const links = wrapper.findAll("a");
    expect(links[1].classes()).toContain("ui-sidebar-nav-item--active");
    expect(links[0].classes()).not.toContain("ui-sidebar-nav-item--active");
  });

  it("marks active item via prefix match of currentRoute", () => {
    const wrapper = mount(UiSidebarNav, {
      props: { items, currentRoute: "/carteira/detalhe/btc" },
      global: globalConfig,
    });
    const links = wrapper.findAll("a");
    expect(links[1].classes()).toContain("ui-sidebar-nav-item--active");
    expect(links[0].classes()).not.toContain("ui-sidebar-nav-item--active");
  });

  it("marks no item active when currentRoute is undefined", () => {
    const wrapper = mount(UiSidebarNav, {
      props: { items },
      global: globalConfig,
    });
    const links = wrapper.findAll("a");
    links.forEach((link) => {
      expect(link.classes()).not.toContain("ui-sidebar-nav-item--active");
    });
  });

  it("propagates collapsed prop to all items", () => {
    const wrapper = mount(UiSidebarNav, {
      props: { items, collapsed: true },
      global: globalConfig,
    });
    const links = wrapper.findAll("a");
    links.forEach((link) => {
      expect(link.classes()).toContain("ui-sidebar-nav-item--collapsed");
    });
  });

  it("does not propagate collapsed when false", () => {
    const wrapper = mount(UiSidebarNav, {
      props: { items, collapsed: false },
      global: globalConfig,
    });
    const links = wrapper.findAll("a");
    links.forEach((link) => {
      expect(link.classes()).not.toContain("ui-sidebar-nav-item--collapsed");
    });
  });

  it("renders a nav element as root", () => {
    const wrapper = mount(UiSidebarNav, {
      props: { items },
      global: globalConfig,
    });
    expect(wrapper.find("nav").exists()).toBe(true);
  });
});
