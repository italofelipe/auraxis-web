import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiPageLoader from "../UiPageLoader.vue";

describe("UiPageLoader", () => {
  it("renders with role=status and aria-busy", () => {
    const wrapper = mount(UiPageLoader);
    expect(wrapper.attributes("role")).toBe("status");
    expect(wrapper.attributes("aria-busy")).toBe("true");
  });

  it("renders 3 content rows by default", () => {
    const wrapper = mount(UiPageLoader);
    const rows = wrapper.findAll(".ui-page-loader__row");
    expect(rows).toHaveLength(3);
  });

  it("renders the given number of rows", () => {
    const wrapper = mount(UiPageLoader, { props: { rows: 5 } });
    expect(wrapper.findAll(".ui-page-loader__row")).toHaveLength(5);
  });

  it("renders 1 row when rows=1", () => {
    const wrapper = mount(UiPageLoader, { props: { rows: 1 } });
    expect(wrapper.findAll(".ui-page-loader__row")).toHaveLength(1);
  });

  it("does not render title skeleton by default", () => {
    const wrapper = mount(UiPageLoader);
    expect(wrapper.find(".ui-page-loader__title").exists()).toBe(false);
  });

  it("renders title skeleton when withTitle=true", () => {
    const wrapper = mount(UiPageLoader, { props: { withTitle: true } });
    expect(wrapper.find(".ui-page-loader__title").exists()).toBe(true);
  });

  it("renders title skeleton alongside content rows", () => {
    const wrapper = mount(UiPageLoader, { props: { withTitle: true, rows: 2 } });
    expect(wrapper.find(".ui-page-loader__title").exists()).toBe(true);
    expect(wrapper.findAll(".ui-page-loader__row")).toHaveLength(2);
  });

  it("has the ui-page-loader root class", () => {
    const wrapper = mount(UiPageLoader);
    expect(wrapper.classes()).toContain("ui-page-loader");
  });

  it("matches snapshot with defaults", () => {
    const wrapper = mount(UiPageLoader);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("matches snapshot with title and custom row count", () => {
    const wrapper = mount(UiPageLoader, { props: { withTitle: true, rows: 4 } });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
