import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import UiTopbar from "../UiTopbar.vue";

const MockIcon = defineComponent({ render: () => h("span", "icon") });

describe("UiTopbar", () => {
  it("renders title via UiPageHeader", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-page-header__title").text()).toBe("Dashboard");
  });

  it("renders subtitle via UiPageHeader when provided", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", subtitle: "Mês de Dezembro", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-page-header__subtitle").text()).toBe("Mês de Dezembro");
  });

  it("does not render subtitle when absent", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-page-header__subtitle").exists()).toBe(false);
  });

  it("renders action buttons", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", variant: "positive" },
          { key: "add-expense", label: "Despesa", variant: "negative" },
        ],
      },
    });
    const actions = wrapper.findAll(".ui-topbar__action");
    expect(actions).toHaveLength(2);
    expect(actions[0]!.text()).toContain("Receita");
    expect(actions[1]!.text()).toContain("Despesa");
  });

  it("emits action with correct key when action button is clicked", async () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", variant: "positive" },
          { key: "add-expense", label: "Despesa", variant: "negative" },
        ],
      },
    });
    await wrapper.findAll(".ui-topbar__action")[0]!.trigger("click");
    expect(wrapper.emitted("action")).toBeTruthy();
    expect(wrapper.emitted("action")![0]).toEqual(["add-income"]);
  });

  it("emits action with correct key for second action", async () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", variant: "positive" },
          { key: "add-expense", label: "Despesa", variant: "negative" },
        ],
      },
    });
    await wrapper.findAll(".ui-topbar__action")[1]!.trigger("click");
    expect(wrapper.emitted("action")![0]).toEqual(["add-expense"]);
  });

  it("does not render menu button when showMenuButton is false", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: false },
    });
    expect(wrapper.find(".ui-topbar__menu-btn").exists()).toBe(false);
  });

  it("renders menu button when showMenuButton is true", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
    });
    expect(wrapper.find(".ui-topbar__menu-btn").exists()).toBe(true);
  });

  it("emits menu-toggle when menu button is clicked", async () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
    });
    await wrapper.find(".ui-topbar__menu-btn").trigger("click");
    expect(wrapper.emitted("menu-toggle")).toBeTruthy();
  });

  it("renders UiUserMenu", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-user-menu").exists()).toBe(true);
  });

  it("applies correct variant class to action button", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", icon: MockIcon, variant: "positive" },
        ],
      },
    });
    const action = wrapper.find(".ui-topbar__action");
    expect(action.classes()).toContain("ui-topbar__action--positive");
  });

  it("renders action icon when provided", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", icon: MockIcon, variant: "positive" },
        ],
      },
    });
    expect(wrapper.find(".ui-topbar__action span").text()).toBe("icon");
  });
});
