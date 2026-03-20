import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ForgotPasswordForm from "../ForgotPasswordForm.vue";

const NuxtLinkStub = {
  template: "<a :href=\"to\" v-bind=\"$attrs\"><slot /></a>",
  props: ["to"],
};

const globalConfig = {
  stubs: { NuxtLink: NuxtLinkStub },
};

describe("ForgotPasswordForm", () => {
  it("renders email input and submit button by default", () => {
    const wrapper = mount(ForgotPasswordForm, { global: globalConfig });
    expect(wrapper.find("input[type='email']").exists()).toBe(true);
    expect(wrapper.find("button[type='submit']").exists()).toBe(true);
  });

  it("shows title and instructions", () => {
    const wrapper = mount(ForgotPasswordForm, { global: globalConfig });
    expect(wrapper.text()).toContain("Recuperar senha");
    expect(wrapper.text()).toContain("link para redefinir");
  });

  it("shows back-to-login link", () => {
    const wrapper = mount(ForgotPasswordForm, { global: globalConfig });
    expect(wrapper.text()).toContain("Voltar para o login");
  });

  it("disables submit when loading", () => {
    const wrapper = mount(ForgotPasswordForm, {
      props: { loading: true },
      global: globalConfig,
    });
    expect(wrapper.find("button[type='submit']").attributes("disabled")).toBeDefined();
  });

  it("shows loading text when loading", () => {
    const wrapper = mount(ForgotPasswordForm, {
      props: { loading: true },
      global: globalConfig,
    });
    expect(wrapper.text()).toContain("Enviando");
  });

  it("shows success state when success prop is true", () => {
    const wrapper = mount(ForgotPasswordForm, {
      props: { success: true },
      global: globalConfig,
    });
    expect(wrapper.find("input[type='email']").exists()).toBe(false);
    expect(wrapper.find("button[type='submit']").exists()).toBe(false);
    expect(wrapper.text()).toContain("E-mail enviado");
  });

  it("shows spam instructions in success state", () => {
    const wrapper = mount(ForgotPasswordForm, {
      props: { success: true },
      global: globalConfig,
    });
    expect(wrapper.text()).toContain("spam");
  });

  it("renders back-to-login link in success state", () => {
    const wrapper = mount(ForgotPasswordForm, {
      props: { success: true },
      global: globalConfig,
    });
    expect(wrapper.text()).toContain("Voltar para o login");
  });
});
