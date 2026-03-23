import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import LoginForm from "../LoginForm.vue";

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string) => key }),
}));

const NuxtLinkStub = {
  template: "<a :href=\"to\" v-bind=\"$attrs\"><slot /></a>",
  props: ["to"],
};

const globalConfig = {
  stubs: { NuxtLink: NuxtLinkStub },
};

describe("LoginForm", () => {
  it("renders email input, password field and submit button", () => {
    const wrapper = mount(LoginForm, { global: globalConfig });
    expect(wrapper.find("input[type='email']").exists()).toBe(true);
    expect(wrapper.find("input[type='password']").exists()).toBe(true);
    expect(wrapper.find("button[type='submit']").exists()).toBe(true);
  });

  it("shows forgot-password link", () => {
    const wrapper = mount(LoginForm, { global: globalConfig });
    expect(wrapper.text()).toContain("auth.login.forgotPassword");
  });

  it("shows register link", () => {
    const wrapper = mount(LoginForm, { global: globalConfig });
    expect(wrapper.text()).toContain("auth.login.createAccount");
  });

  it("disables submit button when loading", () => {
    const wrapper = mount(LoginForm, {
      props: { loading: true },
      global: globalConfig,
    });
    const btn = wrapper.find("button[type='submit']");
    expect(btn.attributes("disabled")).toBeDefined();
  });

  it("shows loading text when loading prop is true", () => {
    const wrapper = mount(LoginForm, {
      props: { loading: true },
      global: globalConfig,
    });
    expect(wrapper.text()).toContain("auth.login.submitLoading");
  });

  it("renders social auth buttons", () => {
    const wrapper = mount(LoginForm, { global: globalConfig });
    expect(wrapper.find(".login-form__social").exists()).toBe(true);
  });

  it("shows divider between social and email form", () => {
    const wrapper = mount(LoginForm, { global: globalConfig });
    expect(wrapper.text()).toContain("auth.login.divider");
  });

  it("renders title and subtitle", () => {
    const wrapper = mount(LoginForm, { global: globalConfig });
    expect(wrapper.text()).toContain("auth.login.title");
    expect(wrapper.text()).toContain("auth.login.subtitle");
  });
});
