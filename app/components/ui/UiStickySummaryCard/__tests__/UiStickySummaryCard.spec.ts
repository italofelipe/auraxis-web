import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiStickySummaryCard from "../UiStickySummaryCard.vue";

describe("UiStickySummaryCard", () => {
  it("renders default slot content", () => {
    const wrapper = mount(UiStickySummaryCard, {
      slots: { default: "<p>Summary content</p>" },
    });
    expect(wrapper.text()).toContain("Summary content");
  });

  it("applies sticky class when sticky=true (default)", () => {
    const wrapper = mount(UiStickySummaryCard);
    expect(wrapper.classes()).toContain("ui-sticky-summary-card--sticky");
  });

  it("applies sticky class when sticky=true explicitly", () => {
    const wrapper = mount(UiStickySummaryCard, {
      props: { sticky: true },
    });
    expect(wrapper.classes()).toContain("ui-sticky-summary-card--sticky");
  });

  it("does not apply sticky class when sticky=false", () => {
    const wrapper = mount(UiStickySummaryCard, {
      props: { sticky: false },
    });
    expect(wrapper.classes()).not.toContain("ui-sticky-summary-card--sticky");
  });

  it("applies top style with default offset when sticky=true", () => {
    const wrapper = mount(UiStickySummaryCard, {
      props: { sticky: true },
    });
    expect(wrapper.attributes("style")).toContain("top:");
  });

  it("applies custom topOffset when provided", () => {
    const wrapper = mount(UiStickySummaryCard, {
      props: { sticky: true, topOffset: "24px" },
    });
    expect(wrapper.attributes("style")).toContain("top: 24px");
  });

  it("does not apply top style when sticky=false", () => {
    const wrapper = mount(UiStickySummaryCard, {
      props: { sticky: false },
    });
    expect(wrapper.attributes("style")).toBeFalsy();
  });

  it("passes glow=true to UiGlassPanel by default", () => {
    const wrapper = mount(UiStickySummaryCard);
    const glassPanel = wrapper.findComponent({ name: "UiGlassPanel" });
    expect(glassPanel.props("glow")).toBe(true);
  });

  it("passes glow=false to UiGlassPanel when glow=false", () => {
    const wrapper = mount(UiStickySummaryCard, {
      props: { glow: false },
    });
    const glassPanel = wrapper.findComponent({ name: "UiGlassPanel" });
    expect(glassPanel.props("glow")).toBe(false);
  });

  it("passes glow=true to UiGlassPanel when glow=true", () => {
    const wrapper = mount(UiStickySummaryCard, {
      props: { glow: true },
    });
    const glassPanel = wrapper.findComponent({ name: "UiGlassPanel" });
    expect(glassPanel.props("glow")).toBe(true);
  });

  it("matches snapshot with defaults", () => {
    const wrapper = mount(UiStickySummaryCard, {
      slots: { default: "Content" },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
