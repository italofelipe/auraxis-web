import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { LayoutDashboard } from "lucide-vue-next";
import UiSidebarNavItem from "../UiSidebarNavItem.vue";

const NuxtLinkStub = {
  template: "<a :href=\"to\" v-bind=\"$attrs\"><slot /></a>",
  props: ["to"],
};

const globalConfig = {
  stubs: { NuxtLink: NuxtLinkStub },
};

describe("UiSidebarNavItem", () => {
  it("renders label when not collapsed", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard" },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__label").text()).toBe("Dashboard");
  });

  it("hides label when collapsed=true", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", collapsed: true },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__label").exists()).toBe(false);
  });

  it("applies active class when active=true", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: true },
      global: globalConfig,
    });
    expect(wrapper.find("a").classes()).toContain("ui-sidebar-nav-item--active");
  });

  it("does not apply active class when active=false", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: false },
      global: globalConfig,
    });
    expect(wrapper.find("a").classes()).not.toContain("ui-sidebar-nav-item--active");
  });

  it("applies aria-current=\"page\" when active", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: true },
      global: globalConfig,
    });
    expect(wrapper.find("a").attributes("aria-current")).toBe("page");
  });

  it("does not set aria-current when inactive", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: false },
      global: globalConfig,
    });
    expect(wrapper.find("a").attributes("aria-current")).toBeUndefined();
  });

  it("renders icon when passed", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__icon").exists()).toBe(true);
  });

  it("does not render icon container when icon is not passed", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard" },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__icon").exists()).toBe(false);
  });

  it("renders as NuxtLink with correct to prop", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Carteira", to: "/carteira" },
      global: globalConfig,
    });
    expect(wrapper.find("a").attributes("href")).toBe("/carteira");
  });
});
