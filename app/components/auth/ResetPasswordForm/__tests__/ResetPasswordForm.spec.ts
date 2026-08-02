import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import ResetPasswordForm from "../ResetPasswordForm.vue";
import { NuxtLinkStub } from "~/test-utils";

const globalConfig = {
  stubs: { NuxtLink: NuxtLinkStub },
};

/**
 * Mounts the form with the shared stubs.
 *
 * @param props Optional props.
 * @returns Mounted wrapper.
 */
const mountForm = (props: Record<string, unknown> = {}): ReturnType<typeof mount> =>
  mount(ResetPasswordForm, { global: globalConfig, props });

describe("ResetPasswordForm", () => {
  it("renders both password fields with a visibility toggle", () => {
    const wrapper = mountForm();

    // The regression this guards: the screen used bare <input type=password>,
    // so there was no way to check what had been typed (#1307).
    const toggles = wrapper.findAll(".ui-password-field__toggle");
    expect(toggles).toHaveLength(2);
    expect(wrapper.find("#reset-password").exists()).toBe(true);
    expect(wrapper.find("#reset-confirm-password").exists()).toBe(true);
  });

  it("reveals the password when the toggle is pressed", async () => {
    const wrapper = mountForm();

    expect(wrapper.find("#reset-password").attributes("type")).toBe("password");
    await wrapper.findAll(".ui-password-field__toggle")[0]!.trigger("click");
    expect(wrapper.find("#reset-password").attributes("type")).toBe("text");
  });

  it("shows the strength meter so the backend rules are visible before submitting", async () => {
    const wrapper = mountForm();

    // The meter only renders once there is something to measure.
    await wrapper.find("#reset-password").setValue("Nova");

    expect(wrapper.find(".strength-meter").exists()).toBe(true);
  });

  it("renders the reworked copy and the CTA hint", () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain("Criar nova senha");
    expect(wrapper.text()).toContain("Salvar nova senha");
    expect(wrapper.text()).toContain("Depois de salvar, levamos você para o login.");
  });

  it("surfaces the server error passed by the page", () => {
    const wrapper = mountForm({ serverError: "Este link expirou. Peça um novo para continuar." });

    const alert = wrapper.find("[role='alert']");
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain("Este link expirou");
  });

  it("disables the submit button while the request is in flight", () => {
    const wrapper = mountForm({ loading: true });

    const submit = wrapper.find("button[type='submit']");
    expect(submit.attributes("disabled")).toBeDefined();
    expect(submit.attributes("aria-busy")).toBe("true");
    expect(wrapper.text()).toContain("Salvando");
  });

  it("does not emit submit when the password breaks the backend rules", async () => {
    const wrapper = mountForm();

    await wrapper.find("#reset-password").setValue("curta1!");
    await wrapper.find("#reset-confirm-password").setValue("curta1!");
    await wrapper.find("form").trigger("submit");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("emits submit with the password when the form is valid", async () => {
    const wrapper = mountForm();

    await wrapper.find("#reset-password").setValue("NovaSenha@1");
    await wrapper.find("#reset-confirm-password").setValue("NovaSenha@1");
    await wrapper.find("form").trigger("submit");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.emitted("submit")).toBeTruthy();
    expect(wrapper.emitted("submit")![0]).toEqual([{ password: "NovaSenha@1" }]);
  });
});
