import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TermsOfServicePage from "./terms-of-service.vue";
import { nuxtAppContextPlugin } from "~/test-utils";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

/**
 * Mounts the terms page with the minimal Nuxt context required by head composables.
 *
 * @returns Mounted Vue wrapper.
 */
function mountPage(): VueWrapper {
  return mount(TermsOfServicePage, { global: { plugins: [nuxtAppContextPlugin], stubs } });
}

describe("TermsOfServicePage (/terms-of-service)", () => {
  it("renders the page title", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Termos de Uso");
  });

  it("displays document version and effective date", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("2.2.0");
    expect(wrapper.text()).toContain("2026-07-19");
  });

  it("displays the support email", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("suporte@auraxis.com.br");
  });

  it("contains a mailto link for the support email", () => {
    const wrapper = mountPage();
    const mailLinks = wrapper.findAll("a[href=\"mailto:suporte@auraxis.com.br\"]");
    expect(mailLinks.length).toBeGreaterThan(0);
  });

  it("displays navigation link to Privacy Policy", () => {
    const wrapper = mountPage();
    const privLink = wrapper.find("a[href=\"/privacy\"]");
    expect(privLink.exists()).toBe(true);
  });

  it("displays navigation link to Cookies Policy", () => {
    const wrapper = mountPage();
    const cookiesLink = wrapper.find("a[href=\"/cookies\"]");
    expect(cookiesLink.exists()).toBe(true);
  });

  it("displays back link to login", () => {
    const wrapper = mountPage();
    const backLink = wrapper.find("a[href=\"/login\"]");
    expect(backLink.exists()).toBe(true);
  });

  it("contains section about who can use the service", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Quem pode usar");
  });

  it("contains section about permitted use", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Uso permitido");
  });

  it("contains section about prohibited use", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Uso proibido");
  });

  it("contains section about AI insights and no model training", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Insights com IA");
    expect(wrapper.text()).toContain("não usa dados do usuário para treinar modelos");
    expect(wrapper.text()).toContain("não autoriza provedores de IA a treinarem modelos");
  });

  it("contains section about limitation of liability", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Limitação de responsabilidade");
  });

  it("contains section about acceptance", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Aceite");
  });

  it("displays the Auraxis brand in the header", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Auraxis");
  });

  it("contains internal links to Privacy Policy", () => {
    const wrapper = mountPage();
    const privLinks = wrapper.findAll("a[href=\"/privacy\"]");
    expect(privLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("contains internal links to Cookies Policy", () => {
    const wrapper = mountPage();
    const cookiesLinks = wrapper.findAll("a[href=\"/cookies\"]");
    expect(cookiesLinks.length).toBeGreaterThanOrEqual(2);
  });
});
