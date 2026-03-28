import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiGlassPanel from "../UiGlassPanel.vue";

describe("UiGlassPanel", () => {
  it("renders slot content", () => {
    const wrapper = mount(UiGlassPanel, {
      slots: { default: "<p>Glass content</p>" },
    });
    expect(wrapper.text()).toContain("Glass content");
  });

  it("applies glow class when glow=true", () => {
    const wrapper = mount(UiGlassPanel, {
      props: { glow: true },
    });
    expect(wrapper.classes()).toContain("ui-glass-panel--glow");
  });

  it("does not apply glow class when glow=false", () => {
    const wrapper = mount(UiGlassPanel, {
      props: { glow: false },
    });
    expect(wrapper.classes()).not.toContain("ui-glass-panel--glow");
  });

  it("does not apply glow class by default", () => {
    const wrapper = mount(UiGlassPanel);
    expect(wrapper.classes()).not.toContain("ui-glass-panel--glow");
  });

  it("applies default padding-md class", () => {
    const wrapper = mount(UiGlassPanel);
    expect(wrapper.classes()).toContain("ui-glass-panel--padding-md");
  });

  it("applies padding-sm class when padding=\"sm\"", () => {
    const wrapper = mount(UiGlassPanel, {
      props: { padding: "sm" },
    });
    expect(wrapper.classes()).toContain("ui-glass-panel--padding-sm");
  });

  it("applies padding-lg class when padding=\"lg\"", () => {
    const wrapper = mount(UiGlassPanel, {
      props: { padding: "lg" },
    });
    expect(wrapper.classes()).toContain("ui-glass-panel--padding-lg");
  });

  it("applies padding-none class when padding=\"none\"", () => {
    const wrapper = mount(UiGlassPanel, {
      props: { padding: "none" },
    });
    expect(wrapper.classes()).toContain("ui-glass-panel--padding-none");
  });

  it("applies default radius-lg class", () => {
    const wrapper = mount(UiGlassPanel);
    expect(wrapper.classes()).toContain("ui-glass-panel--radius-lg");
  });

  it("applies radius-sm class when radius=\"sm\"", () => {
    const wrapper = mount(UiGlassPanel, {
      props: { radius: "sm" },
    });
    expect(wrapper.classes()).toContain("ui-glass-panel--radius-sm");
  });

  it("applies radius-md class when radius=\"md\"", () => {
    const wrapper = mount(UiGlassPanel, {
      props: { radius: "md" },
    });
    expect(wrapper.classes()).toContain("ui-glass-panel--radius-md");
  });

  it("always has ui-glass-panel base class", () => {
    const wrapper = mount(UiGlassPanel);
    expect(wrapper.classes()).toContain("ui-glass-panel");
  });

  it("matches snapshot with default state", () => {
    const wrapper = mount(UiGlassPanel, {
      slots: { default: "Panel content" },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
