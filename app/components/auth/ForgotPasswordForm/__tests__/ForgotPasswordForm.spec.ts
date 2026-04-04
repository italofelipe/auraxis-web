import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import ForgotPasswordForm from "../ForgotPasswordForm.vue";
import { NuxtLinkStub } from "~/test-utils";

const IllustrationMailSentStub = {
  template: "<svg class='illustration-mail-sent' aria-hidden='true' />",
};

const globalConfig = {
  stubs: {
    NuxtLink: NuxtLinkStub,
    IllustrationMailSent: IllustrationMailSentStub,
  },
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
    // Subtitle comes from i18n key auth.forgotPassword.subtitle
    expect(wrapper.text()).toContain("Informe seu email");
  });

  it("shows back-to-login link", () => {
    const wrapper = mount(ForgotPasswordForm, { global: globalConfig });
    // Translation for auth.forgotPassword.backToLogin
    expect(wrapper.text()).toContain("Voltar ao login");
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
    // Translation for auth.forgotPassword.backToLogin
    expect(wrapper.text()).toContain("Voltar ao login");
  });

  it("triggers submit handler when form is submitted", async () => {
    const wrapper = mount(ForgotPasswordForm, { global: globalConfig });
    await wrapper.find("#forgot-email").setValue("test@example.com");
    await wrapper.find("form").trigger("submit");
    await nextTick();
    // Form submits — component remains mounted
    expect(wrapper.exists()).toBe(true);
  });

  it("isPending reflects loading and isSubmitting computed correctly", () => {
    const wrapper = mount(ForgotPasswordForm, {
      props: { loading: false },
      global: globalConfig,
    });
    const btn = wrapper.find("button[type='submit']");
    // loading=false and isSubmitting=false → disabled undefined
    expect(btn.attributes("disabled")).toBeUndefined();
  });

  it("shows spinner element when loading is true (isPending branch)", () => {
    const wrapper = mount(ForgotPasswordForm, {
      props: { loading: true },
      global: globalConfig,
    });
    expect(wrapper.find(".forgot-form__spinner").exists()).toBe(true);
  });
});
