import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiSegmentedControl from "../UiSegmentedControl.vue";

const options = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
];

describe("UiSegmentedControl", () => {
  it("renders all options", () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "day", options },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0]!.text()).toBe("Dia");
    expect(buttons[1]!.text()).toBe("Semana");
    expect(buttons[2]!.text()).toBe("Mês");
    expect(buttons[3]!.text()).toBe("Ano");
  });

  it("active option has active class", () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "week", options },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons[1]!.classes()).toContain("ui-segmented-control__option--active");
    expect(buttons[0]!.classes()).not.toContain("ui-segmented-control__option--active");
  });

  it("active option has aria-pressed=\"true\"", () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "month", options },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons[2]!.attributes("aria-pressed")).toBe("true");
    expect(buttons[0]!.attributes("aria-pressed")).toBe("false");
  });

  it("click emits update:modelValue with correct value", async () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "day", options },
    });
    await wrapper.findAll("button")[2]!.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["month"]);
  });

  it("disabled option has disabled attribute", () => {
    const optionsWithDisabled = [
      ...options.slice(0, 2),
      { value: "month", label: "Mês", disabled: true },
      options[3]!,
    ];
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "day", options: optionsWithDisabled },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons[2]!.attributes("disabled")).toBeDefined();
  });

  it("clicking disabled option does not emit", async () => {
    const optionsWithDisabled = [
      { value: "day", label: "Dia" },
      { value: "month", label: "Mês", disabled: true },
    ];
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "day", options: optionsWithDisabled },
    });
    await wrapper.findAll("button")[1]!.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("renders group role with aria-label", () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "day", options, ariaLabel: "Período" },
    });
    const group = wrapper.find("[role=\"group\"]");
    expect(group.exists()).toBe(true);
    expect(group.attributes("aria-label")).toBe("Período");
  });

  it("snapshot default state", () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { modelValue: "month", options },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
