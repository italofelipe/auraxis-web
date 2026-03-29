import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { NCollapse, NCollapseItem } from "naive-ui";
import CalculatorFormSection from "../CalculatorFormSection.vue";

describe("CalculatorFormSection", () => {
  it("renders title when provided", () => {
    const wrapper = mount(CalculatorFormSection, {
      props: { title: "Valores do produto" },
    });
    expect(wrapper.text()).toContain("Valores do produto");
  });

  it("renders description when provided", () => {
    const wrapper = mount(CalculatorFormSection, {
      props: { description: "Informe o preço e as parcelas." },
    });
    expect(wrapper.text()).toContain("Informe o preço e as parcelas.");
  });

  it("renders slot content", () => {
    const wrapper = mount(CalculatorFormSection, {
      slots: { default: "<input data-testid=\"field\" />" },
    });
    expect(wrapper.find("[data-testid=\"field\"]").exists()).toBe(true);
  });

  it("does not render title element when title is omitted", () => {
    const wrapper = mount(CalculatorFormSection);
    expect(wrapper.find(".calculator-form-section__title").exists()).toBe(false);
  });

  it("does not render header block when neither title nor description is provided", () => {
    const wrapper = mount(CalculatorFormSection);
    expect(wrapper.find(".calculator-form-section__header").exists()).toBe(false);
  });

  it("renders NCollapse when collapsible=true", () => {
    const wrapper = mount(CalculatorFormSection, {
      props: { collapsible: true, title: "Advanced" },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.findComponent(NCollapse).exists()).toBe(true);
  });

  it("does not render NCollapse when collapsible=false (default)", () => {
    const wrapper = mount(CalculatorFormSection, {
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.findComponent(NCollapse).exists()).toBe(false);
  });

  it("collapseItem is expanded by default when collapsible=true and defaultExpanded=true", () => {
    const wrapper = mount(CalculatorFormSection, {
      props: { collapsible: true, title: "Section", defaultExpanded: true },
      global: { components: { NCollapse, NCollapseItem } },
    });
    const collapse = wrapper.findComponent(NCollapse);
    expect(collapse.props("expandedNames")).toEqual(["section"]);
  });

  it("collapseItem is collapsed when collapsible=true and defaultExpanded=false", () => {
    const wrapper = mount(CalculatorFormSection, {
      props: { collapsible: true, title: "Section", defaultExpanded: false },
      global: { components: { NCollapse, NCollapseItem } },
    });
    const collapse = wrapper.findComponent(NCollapse);
    expect(collapse.props("expandedNames")).toEqual([]);
  });

  it("renders slot content inside collapsible panel", () => {
    const wrapper = mount(CalculatorFormSection, {
      props: { collapsible: true, title: "Section", defaultExpanded: true },
      slots: { default: "<span class=\"inner\">Inner content</span>" },
      global: { components: { NCollapse, NCollapseItem } },
    });
    expect(wrapper.find(".inner").exists()).toBe(true);
  });
});
