import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiIcon from "../UiIcon.vue";

describe("UiIcon", () => {
  it("renders icon for valid name", () => {
    const wrapper = mount(UiIcon, {
      props: { name: "dashboard" },
    });
    expect(wrapper.find(".ui-icon").exists()).toBe(true);
  });

  it("aria-hidden=\"true\" when decorative (default)", () => {
    const wrapper = mount(UiIcon, {
      props: { name: "dashboard" },
    });
    const el = wrapper.element.querySelector("[aria-hidden]") ?? wrapper.element;
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("aria-label set when not decorative", () => {
    const wrapper = mount(UiIcon, {
      props: { name: "dashboard", decorative: false, label: "Dashboard" },
    });
    const el = wrapper.element.querySelector("[aria-label]") ?? wrapper.element;
    expect(el.getAttribute("aria-label")).toBe("Dashboard");
  });
});
