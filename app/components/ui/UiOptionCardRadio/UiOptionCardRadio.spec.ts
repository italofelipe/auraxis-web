import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiOptionCardRadio from "./UiOptionCardRadio.vue";
import type { QuestionnaireOptionDto } from "~/features/investor-profile/contracts/investor-profile.dto";

/**
 * Builds a minimal QuestionnaireOptionDto fixture for testing.
 *
 * @param overrides - Partial overrides for the fixture.
 * @returns QuestionnaireOptionDto fixture.
 */
const makeOption = (overrides: Partial<QuestionnaireOptionDto> = {}): QuestionnaireOptionDto => ({
  id: 1,
  text: "Preservar meu patrimônio",
  points: 1,
  ...overrides,
});

describe("UiOptionCardRadio", () => {
  it("renders the option text", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption({ text: "Crescimento moderado" }), selected: false },
    });

    expect(wrapper.text()).toContain("Crescimento moderado");
  });

  it("has role='radio'", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false },
    });

    expect(wrapper.attributes("role")).toBe("radio");
  });

  it("has aria-checked='false' when not selected", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false },
    });

    expect(wrapper.attributes("aria-checked")).toBe("false");
  });

  it("has aria-checked='true' when selected", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: true },
    });

    expect(wrapper.attributes("aria-checked")).toBe("true");
  });

  it("has tabindex='0' when not disabled", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false },
    });

    expect(wrapper.attributes("tabindex")).toBe("0");
  });

  it("has tabindex='-1' when disabled", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false, disabled: true },
    });

    expect(wrapper.attributes("tabindex")).toBe("-1");
  });

  it("emits 'select' with option.id on click", async () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption({ id: 42 }), selected: false },
    });

    await wrapper.trigger("click");

    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual([42]);
  });

  it("does not emit 'select' when disabled and clicked", async () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false, disabled: true },
    });

    await wrapper.trigger("click");

    expect(wrapper.emitted("select")).toBeFalsy();
  });

  it("emits 'select' on Enter keydown", async () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption({ id: 7 }), selected: false },
    });

    await wrapper.trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("select")![0]).toEqual([7]);
  });

  it("emits 'select' on Space keydown", async () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption({ id: 3 }), selected: false },
    });

    await wrapper.trigger("keydown", { key: " " });

    expect(wrapper.emitted("select")![0]).toEqual([3]);
  });

  it("does not emit 'select' on other keydown events", async () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false },
    });

    await wrapper.trigger("keydown", { key: "Tab" });

    expect(wrapper.emitted("select")).toBeFalsy();
  });

  it("applies selected class when selected=true", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: true },
    });

    expect(wrapper.classes()).toContain("ui-option-card-radio--selected");
  });

  it("does not apply selected class when selected=false", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false },
    });

    expect(wrapper.classes()).not.toContain("ui-option-card-radio--selected");
  });

  it("applies disabled class when disabled=true", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false, disabled: true },
    });

    expect(wrapper.classes()).toContain("ui-option-card-radio--disabled");
  });

  it("has aria-disabled when disabled", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false, disabled: true },
    });

    expect(wrapper.attributes("aria-disabled")).toBe("true");
  });

  it("does not have aria-disabled when not disabled", () => {
    const wrapper = mount(UiOptionCardRadio, {
      props: { option: makeOption(), selected: false },
    });

    expect(wrapper.attributes("aria-disabled")).toBeUndefined();
  });
});
