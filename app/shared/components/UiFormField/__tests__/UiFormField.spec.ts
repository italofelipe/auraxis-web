import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiFormField from "../UiFormField.vue";

describe("UiFormField", () => {
  it("renders label with correct for attribute", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Email", fieldId: "email-input" },
      slots: { default: "<input id=\"email-input\" />" },
    });
    const label = wrapper.find("label");
    expect(label.text()).toContain("Email");
    expect(label.attributes("for")).toBe("email-input");
  });

  it("renders asterisco when required=true", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Nome", fieldId: "nome", required: true },
    });
    const required = wrapper.find(".ui-form-field__required");
    expect(required.exists()).toBe(true);
    expect(required.text()).toBe("*");
  });

  it("does not render asterisco when required=false", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Nome", fieldId: "nome", required: false },
    });
    expect(wrapper.find(".ui-form-field__required").exists()).toBe(false);
  });

  it("renders error message and applies error class", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Email", fieldId: "email", error: "Campo inválido" },
    });
    const error = wrapper.find(".ui-form-field__error");
    expect(error.exists()).toBe(true);
    expect(error.text()).toBe("Campo inválido");
    expect(error.attributes("role")).toBe("alert");
    expect(wrapper.find(".ui-form-field--error").exists()).toBe(true);
  });

  it("renders hint when no error", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Email", fieldId: "email", hint: "Dica útil" },
    });
    const hint = wrapper.find(".ui-form-field__hint");
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toBe("Dica útil");
  });

  it("hides hint when error is present", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Email", fieldId: "email", error: "Erro", hint: "Dica" },
    });
    expect(wrapper.find(".ui-form-field__hint").exists()).toBe(false);
    expect(wrapper.find(".ui-form-field__error").exists()).toBe(true);
  });

  it("renders slot content", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Campo", fieldId: "campo" },
      slots: { default: "<input id=\"campo\" data-testid=\"my-input\" />" },
    });
    expect(wrapper.find("[data-testid=\"my-input\"]").exists()).toBe(true);
  });

  it("does not apply error class when no error", () => {
    const wrapper = mount(UiFormField, {
      props: { label: "Campo", fieldId: "campo" },
    });
    expect(wrapper.find(".ui-form-field--error").exists()).toBe(false);
  });
});
