import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import UiSocialAuthButtons from "../UiSocialAuthButtons.vue";

describe("UiSocialAuthButtons", () => {
  it("renders Google and Facebook buttons by default", () => {
    const wrapper = mount(UiSocialAuthButtons);
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.classes()).toContain("ui-social-auth__btn--google");
    expect(buttons[1]!.classes()).toContain("ui-social-auth__btn--facebook");
  });

  it("displays labels when not compact", () => {
    const wrapper = mount(UiSocialAuthButtons);
    expect(wrapper.text()).toContain("Continuar com Google");
    expect(wrapper.text()).toContain("Continuar com Facebook");
  });

  it("hides labels in compact mode", () => {
    const wrapper = mount(UiSocialAuthButtons, {
      props: { compact: true },
    });
    expect(wrapper.text()).not.toContain("Continuar com Google");
    expect(wrapper.text()).not.toContain("Continuar com Facebook");
  });

  it("emits google-click when Google button is clicked", async () => {
    const wrapper = mount(UiSocialAuthButtons);
    await wrapper.find(".ui-social-auth__btn--google").trigger("click");
    expect(wrapper.emitted("google-click")).toHaveLength(1);
  });

  it("emits facebook-click when Facebook button is clicked", async () => {
    const wrapper = mount(UiSocialAuthButtons);
    await wrapper.find(".ui-social-auth__btn--facebook").trigger("click");
    expect(wrapper.emitted("facebook-click")).toHaveLength(1);
  });

  it("disables buttons when disabled prop is true", () => {
    const wrapper = mount(UiSocialAuthButtons, {
      props: { disabled: true },
    });
    wrapper.findAll("button").forEach((btn) => {
      expect(btn.attributes("disabled")).toBeDefined();
    });
  });

  it("does not emit events when disabled button is clicked natively", () => {
    const wrapper = mount(UiSocialAuthButtons, {
      props: { disabled: true },
    });
    const googleBtn = wrapper.find(".ui-social-auth__btn--google");
    expect(googleBtn.attributes("disabled")).toBeDefined();
    expect(wrapper.emitted("google-click")).toBeUndefined();
  });

  it("applies compact class in compact mode", () => {
    const wrapper = mount(UiSocialAuthButtons, {
      props: { compact: true },
    });
    expect(wrapper.find(".ui-social-auth").classes()).toContain("ui-social-auth--compact");
  });

  it("has accessible aria-label on buttons in compact mode", () => {
    const wrapper = mount(UiSocialAuthButtons, {
      props: { compact: true },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons[0]!.attributes("aria-label")).toBe("Entrar com Google");
    expect(buttons[1]!.attributes("aria-label")).toBe("Entrar com Facebook");
  });
});
