import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { NCollapse, NCollapseItem } from "naive-ui";
import { defineComponent, h } from "vue";
import DetailedBreakdownPanel from "../DetailedBreakdownPanel.vue";

const sections = [
  { key: "formula", title: "Entenda o cálculo" },
  { key: "break-even", title: "Break-even" },
  { key: "schedule", title: "Cronograma" },
];

describe("DetailedBreakdownPanel", () => {
  it("renders NCollapse", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: { sections },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.findComponent(NCollapse).exists()).toBe(true);
  });

  it("renders one NCollapseItem per section", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: { sections },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.findAllComponents(NCollapseItem).length).toBe(3);
  });

  it("renders section titles", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: { sections },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.text()).toContain("Entenda o cálculo");
    expect(wrapper.text()).toContain("Break-even");
    expect(wrapper.text()).toContain("Cronograma");
  });

  it("expands sections listed in defaultExpanded", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: { sections, defaultExpanded: ["formula", "break-even"] },
      global: { components: { NCollapse, NCollapseItem } },
    });
    const collapse = wrapper.findComponent(NCollapse);
    expect(collapse.props("expandedNames")).toEqual(["formula", "break-even"]);
  });

  it("starts with no sections expanded when defaultExpanded is empty", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: { sections, defaultExpanded: [] },
      global: { components: { NCollapse, NCollapseItem } },
    });
    const collapse = wrapper.findComponent(NCollapse);
    expect(collapse.props("expandedNames")).toEqual([]);
  });

  it("starts with no sections expanded by default (defaultExpanded omitted)", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: { sections },
      global: { components: { NCollapse, NCollapseItem } },
    });
    const collapse = wrapper.findComponent(NCollapse);
    expect(collapse.props("expandedNames")).toEqual([]);
  });

  it("renders named slot content for each section key when expanded", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: {
        sections: [{ key: "formula", title: "Fórmula" }],
        defaultExpanded: ["formula"],
      },
      slots: { "section-formula": "<span class=\"formula-content\">Fórmula aqui</span>" },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.find(".formula-content").exists()).toBe(true);
    expect(wrapper.text()).toContain("Fórmula aqui");
  });

  it("renders section component when section.component is provided and section is expanded", () => {
    const InlineComp = defineComponent({
      render() { return h("div", { class: "inline-comp" }, "Inline component content"); },
    });

    const wrapper = mount(DetailedBreakdownPanel, {
      props: {
        sections: [{ key: "custom", title: "Custom", component: InlineComp }],
        defaultExpanded: ["custom"],
      },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.find(".inline-comp").exists()).toBe(true);
  });

  it("renders a single section correctly", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: { sections: [{ key: "only", title: "Only Section" }] },
      slots: { "section-only": "<p>Only content</p>" },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.findAllComponents(NCollapseItem).length).toBe(1);
    expect(wrapper.text()).toContain("Only Section");
  });

  it("all sections expanded when all keys are in defaultExpanded", () => {
    const wrapper = mount(DetailedBreakdownPanel, {
      props: {
        sections,
        defaultExpanded: ["formula", "break-even", "schedule"],
      },
      global: { components: { NCollapse, NCollapseItem } },
    });
    const collapse = wrapper.findComponent(NCollapse);
    expect(collapse.props("expandedNames")).toEqual(["formula", "break-even", "schedule"]);
  });
});
