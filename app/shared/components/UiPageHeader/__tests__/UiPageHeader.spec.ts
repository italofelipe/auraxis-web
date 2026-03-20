import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiPageHeader from "../UiPageHeader.vue";

describe("UiPageHeader", () => {
  it("renders title", () => {
    const wrapper = mount(UiPageHeader, {
      props: { title: "Dashboard" },
    });
    expect(wrapper.find(".ui-page-header__title").text()).toBe("Dashboard");
  });

  it("renders subtitle when present", () => {
    const wrapper = mount(UiPageHeader, {
      props: { title: "Dashboard", subtitle: "Mês de Dezembro" },
    });
    const subtitle = wrapper.find(".ui-page-header__subtitle");
    expect(subtitle.exists()).toBe(true);
    expect(subtitle.text()).toBe("Mês de Dezembro");
  });

  it("does not render subtitle when undefined", () => {
    const wrapper = mount(UiPageHeader, {
      props: { title: "Dashboard" },
    });
    expect(wrapper.find(".ui-page-header__subtitle").exists()).toBe(false);
  });

  it("renders h1 element for title", () => {
    const wrapper = mount(UiPageHeader, {
      props: { title: "Carteira" },
    });
    expect(wrapper.find("h1").exists()).toBe(true);
  });
});
