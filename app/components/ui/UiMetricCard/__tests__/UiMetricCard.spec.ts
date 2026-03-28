import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import UiMetricCard from "../UiMetricCard.vue";

const MockIcon = defineComponent({
  name: "MockIcon",
  props: ["size"],
  render() { return h("svg", { class: "mock-icon" }); },
});

describe("UiMetricCard", () => {
  it("renders label", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00" },
    });
    expect(wrapper.text()).toContain("Saldo Total");
  });

  it("renders value", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00" },
    });
    expect(wrapper.text()).toContain("R$ 12.430,00");
  });

  it("shows trend badge when trend prop is provided", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00", trend: 5.25 },
    });
    expect(wrapper.find(".ui-trend-badge").exists()).toBe(true);
  });

  it("does not show trend badge when trend is undefined", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00" },
    });
    expect(wrapper.find(".ui-trend-badge").exists()).toBe(false);
  });

  it("shows loading skeleton when loading=true", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "", loading: true },
    });
    expect(wrapper.find(".ui-metric-card__skeleton").exists()).toBe(true);
  });

  it("hides loading skeleton when loading=false", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00", loading: false },
    });
    expect(wrapper.find(".ui-metric-card__skeleton").exists()).toBe(false);
  });

  it("does not render label/value in loading state", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00", loading: true },
    });
    expect(wrapper.find(".ui-metric-card__label").exists()).toBe(false);
    expect(wrapper.find(".ui-metric-card__value").exists()).toBe(false);
  });

  it("renders icon when icon prop is provided", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00", icon: MockIcon },
    });
    expect(wrapper.find(".mock-icon").exists()).toBe(true);
  });

  it("does not render icon when icon prop is absent", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "R$ 12.430,00" },
    });
    expect(wrapper.find(".ui-metric-card__icon").exists()).toBe(false);
  });

  it("skeleton has aria-busy attribute", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Saldo Total", value: "", loading: true },
    });
    expect(wrapper.find("[aria-busy=\"true\"]").exists()).toBe(true);
  });

  it("matches snapshot with trend", () => {
    const wrapper = mount(UiMetricCard, {
      props: { label: "Receitas", value: "R$ 5.000,00", trend: 2.5 },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
