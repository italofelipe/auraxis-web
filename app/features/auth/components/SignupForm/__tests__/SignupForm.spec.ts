import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import SignupForm from "../SignupForm.vue";

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
    expect(wrapper.text()).toContain("auth.signup.hasAccount");
    expect(wrapper.text()).toContain("auth.signup.signIn");
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
    expect(wrapper.text()).toContain("auth.signup.submitLoading");
  });

  it("renders social auth buttons", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.find(".signup-form__social").exists()).toBe(true);
  });

  it("renders title and subtitle", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.text()).toContain("auth.signup.title");
    expect(wrapper.text()).toContain("auth.signup.subtitle");
  });

  it("shows divider between social and email form", () => {
    const wrapper = mount(SignupForm, { global: globalConfig });
    expect(wrapper.text()).toContain("auth.signup.divider");
  });
});
