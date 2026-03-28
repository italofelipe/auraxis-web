import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiTrendBadge from "../UiTrendBadge.vue";

describe("UiTrendBadge", () => {
  it("applies positive class when value > 0", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 12.5 },
    });
    expect(wrapper.classes()).toContain("ui-trend-badge--positive");
  });

  it("applies negative class when value < 0", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: -3.2 },
    });
    expect(wrapper.classes()).toContain("ui-trend-badge--negative");
  });

  it("applies neutral class when value is 0", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 0 },
    });
    expect(wrapper.classes()).toContain("ui-trend-badge--neutral");
  });

  it("formats positive value with + prefix and comma decimal", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 12.5 },
    });
    expect(wrapper.text()).toContain("+12,50%");
  });

  it("formats negative value with comma decimal", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: -3.2 },
    });
    expect(wrapper.text()).toContain("-3,20%");
  });

  it("formats zero as neutral value", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 0 },
    });
    expect(wrapper.text()).toContain("0,00%");
  });

  it("shows icon by default", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 5 },
    });
    expect(wrapper.find(".ui-trend-badge__icon").exists()).toBe(true);
  });

  it("hides icon when showIcon=false", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 5, showIcon: false },
    });
    expect(wrapper.find(".ui-trend-badge__icon").exists()).toBe(false);
  });

  it("respects decimals prop", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 12.5, decimals: 1 },
    });
    expect(wrapper.text()).toContain("+12,5%");
  });

  it("matches snapshot for positive state", () => {
    const wrapper = mount(UiTrendBadge, {
      props: { value: 12.5 },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
