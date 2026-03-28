import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiSurfaceCard from "../UiSurfaceCard.vue";

describe("UiSurfaceCard", () => {
  it("renders slot content", () => {
    const wrapper = mount(UiSurfaceCard, {
      slots: { default: "<span>Hello Card</span>" },
    });
    expect(wrapper.text()).toContain("Hello Card");
  });

  it("applies default padding-md class", () => {
    const wrapper = mount(UiSurfaceCard);
    expect(wrapper.classes()).toContain("ui-surface-card--padding-md");
  });

  it("applies padding-sm class when padding=\"sm\"", () => {
    const wrapper = mount(UiSurfaceCard, {
      props: { padding: "sm" },
    });
    expect(wrapper.classes()).toContain("ui-surface-card--padding-sm");
  });

  it("applies padding-lg class when padding=\"lg\"", () => {
    const wrapper = mount(UiSurfaceCard, {
      props: { padding: "lg" },
    });
    expect(wrapper.classes()).toContain("ui-surface-card--padding-lg");
  });

  it("applies padding-none class when padding=\"none\"", () => {
    const wrapper = mount(UiSurfaceCard, {
      props: { padding: "none" },
    });
    expect(wrapper.classes()).toContain("ui-surface-card--padding-none");
  });

  it("applies shadow class by default", () => {
    const wrapper = mount(UiSurfaceCard);
    expect(wrapper.classes()).toContain("ui-surface-card--shadow");
  });

  it("does not apply shadow class when shadow=false", () => {
    const wrapper = mount(UiSurfaceCard, {
      props: { shadow: false },
    });
    expect(wrapper.classes()).not.toContain("ui-surface-card--shadow");
  });

  it("applies bordered class by default", () => {
    const wrapper = mount(UiSurfaceCard);
    expect(wrapper.classes()).toContain("ui-surface-card--bordered");
  });

  it("does not apply bordered class when bordered=false", () => {
    const wrapper = mount(UiSurfaceCard, {
      props: { bordered: false },
    });
    expect(wrapper.classes()).not.toContain("ui-surface-card--bordered");
  });

  it("renders as div by default", () => {
    const wrapper = mount(UiSurfaceCard);
    expect(wrapper.element.tagName.toLowerCase()).toBe("div");
  });

  it("renders as article when as=\"article\"", () => {
    const wrapper = mount(UiSurfaceCard, {
      props: { as: "article" },
    });
    expect(wrapper.element.tagName.toLowerCase()).toBe("article");
  });

  it("renders as section when as=\"section\"", () => {
    const wrapper = mount(UiSurfaceCard, {
      props: { as: "section" },
    });
    expect(wrapper.element.tagName.toLowerCase()).toBe("section");
  });

  it("matches snapshot with default state", () => {
    const wrapper = mount(UiSurfaceCard, {
      slots: { default: "Snapshot content" },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
