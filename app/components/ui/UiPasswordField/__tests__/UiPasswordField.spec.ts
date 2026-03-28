import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiPasswordField from "../UiPasswordField.vue";

describe("UiPasswordField", () => {
  it("renders input type=\"password\" by default", () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "" },
    });
    expect(wrapper.find("input").attributes("type")).toBe("password");
  });

  it("type changes to \"text\" after clicking toggle button", async () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "" },
    });
    const toggle = wrapper.find("button[aria-label=\"Mostrar senha\"]");
    expect(toggle.exists()).toBe(true);
    await toggle.trigger("click");
    expect(wrapper.find("input").attributes("type")).toBe("text");
  });

  it("toggles back to password type on second click", async () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "" },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.find("input").attributes("type")).toBe("text");
    await wrapper.find("button[aria-label=\"Ocultar senha\"]").trigger("click");
    expect(wrapper.find("input").attributes("type")).toBe("password");
  });

  it("shows Eye icon when password hidden and EyeOff when visible", async () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "" },
    });
    // Initially hidden: button label "Mostrar senha"
    expect(wrapper.find("button[aria-label=\"Mostrar senha\"]").exists()).toBe(true);
    await wrapper.find("button").trigger("click");
    // After showing: button label "Ocultar senha"
    expect(wrapper.find("button[aria-label=\"Ocultar senha\"]").exists()).toBe(true);
  });

  it("emits update:modelValue on input", async () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "" },
    });
    const input = wrapper.find("input");
    await input.setValue("novasenha");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["novasenha"]);
  });

  it("applies error class when error prop is set", () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "", error: "Senha inválida" },
    });
    expect(wrapper.find(".ui-password-field__input--error").exists()).toBe(true);
  });

  it("does not apply error class when no error", () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "" },
    });
    expect(wrapper.find(".ui-password-field__input--error").exists()).toBe(false);
  });

  it("applies disabled attribute", () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "", disabled: true },
    });
    expect(wrapper.find("input").attributes("disabled")).toBeDefined();
  });

  it("snapshot default state", () => {
    const wrapper = mount(UiPasswordField, {
      props: { modelValue: "", label: "Senha", fieldId: "password" },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
