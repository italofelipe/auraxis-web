import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import UiEmptyState from "../UiEmptyState.vue";

const MockIcon = defineComponent({
  name: "MockIcon",
  props: ["size"],
  render() { return h("svg", { class: "mock-icon" }); },
});

describe("UiEmptyState", () => {
  it("renders title", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Nenhum item encontrado" },
    });
    expect(wrapper.text()).toContain("Nenhum item encontrado");
  });

  it("renders description when provided", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio", description: "Adicione itens aqui." },
    });
    expect(wrapper.find(".ui-empty-state__description").exists()).toBe(true);
    expect(wrapper.text()).toContain("Adicione itens aqui.");
  });

  it("does not render description when not provided", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio" },
    });
    expect(wrapper.find(".ui-empty-state__description").exists()).toBe(false);
  });

  it("renders action button when actionLabel is provided", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio", actionLabel: "Adicionar" },
    });
    const button = wrapper.find(".ui-empty-state__action");
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("Adicionar");
  });

  it("does not render action button when actionLabel is not provided", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio" },
    });
    expect(wrapper.find(".ui-empty-state__action").exists()).toBe(false);
  });

  it("emits action event when button is clicked", async () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio", actionLabel: "Clique aqui" },
    });
    await wrapper.find(".ui-empty-state__action").trigger("click");
    expect(wrapper.emitted("action")).toBeTruthy();
    expect(wrapper.emitted("action")).toHaveLength(1);
  });

  it("renders icon when icon prop is provided", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio", icon: MockIcon },
    });
    expect(wrapper.find(".ui-empty-state__icon-wrap").exists()).toBe(true);
    expect(wrapper.find(".mock-icon").exists()).toBe(true);
  });

  it("does not render icon wrap when icon prop is not provided", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio" },
    });
    expect(wrapper.find(".ui-empty-state__icon-wrap").exists()).toBe(false);
  });

  it("has role=\"status\" attribute", () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio" },
    });
    expect(wrapper.attributes("role")).toBe("status");
  });

  it("emits action multiple times on multiple clicks", async () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: "Vazio", actionLabel: "Clique" },
    });
    const button = wrapper.find(".ui-empty-state__action");
    await button.trigger("click");
    await button.trigger("click");
    expect(wrapper.emitted("action")).toHaveLength(2);
  });

  it("matches snapshot with all props", () => {
    const wrapper = mount(UiEmptyState, {
      props: {
        title: "Nenhum item",
        description: "Adicione itens para ver aqui.",
        actionLabel: "Adicionar",
        icon: MockIcon,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
