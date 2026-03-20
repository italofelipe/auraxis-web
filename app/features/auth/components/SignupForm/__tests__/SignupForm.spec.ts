import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SignupForm from "../SignupForm.vue";

const NuxtLinkStub = {
  template: "<a :href=\"to\" v-bind=\"$attrs\"><slot /></a>",
  props: ["to"],
};

const globalConfig = {
  stubs: { NuxtLink: NuxtLinkStub },
};

describe("SignupForm", () => {
  it("renders email input, two password fields and submit button", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.find("input[type='email']").exists()).toBe(true);
    const passwordInputs = wrapper.findAll("input[type='password']");
    expect(passwordInputs).toHaveLength(2);
    expect(wrapper.find("button[type='submit']").exists()).toBe(true);
  });

  it("shows login link", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.text()).toContain("Já tem uma conta?");
    expect(wrapper.text()).toContain("Entrar");
  });

  it("disables submit when loading", () => {
    const wrapper = mount(SignupForm, {
      props: { loading: true },
      global: globalConfig,
    });
    expect(wrapper.find("button[type='submit']").attributes("disabled")).toBeDefined();
  });

  it("shows loading text when loading", () => {
    const wrapper = mount(SignupForm, {
      props: { loading: true },
      global: globalConfig,
    });
    expect(wrapper.text()).toContain("Criando conta");
  });

  it("renders social auth buttons", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.find(".signup-form__social").exists()).toBe(true);
  });

  it("renders title and subtitle", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.text()).toContain("Criar conta");
    expect(wrapper.text()).toContain("gratuitamente");
  });

  it("shows divider between social and email form", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.text()).toContain("ou registre com e-mail");
  });
});
