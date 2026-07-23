import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PrivacyPolicyPage from "./privacy-policy.vue";
import { nuxtAppContextPlugin } from "~/test-utils";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

/**
 * Mounts the privacy policy page with the minimal Nuxt context required by head composables.
 *
 * @returns Mounted Vue wrapper.
 */
function mountPage(): VueWrapper {
  return mount(PrivacyPolicyPage, { global: { plugins: [nuxtAppContextPlugin], stubs } });
}

describe("PrivacyPolicyPage (/privacy-policy)", () => {
  it("renders the page title", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Política de Privacidade");
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

  it("displays navigation link to Terms of Service", () => {
    const wrapper = mountPage();
    const termsLink = wrapper.find("a[href=\"/terms\"]");
    expect(termsLink.exists()).toBe(true);
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

  it("contains section about the policy objective", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Objetivo");
  });

  it("contains section about data processed", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Dados tratados");
  });

  it("contains section about purposes", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Finalidades");
  });

  it("contains section about legal bases", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Bases legais");
  });

  it("contains section about data subject rights", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Direitos do titular");
  });

  it("contains section about third-party sharing", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Compartilhamento e subprocessadores");
  });

  it("mentions LGPD in the content", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("LGPD");
  });

  it("states that user data is not used to train AI models", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("não usa dados do usuário para treinar modelos próprios");
    expect(wrapper.text()).toContain(
      "não autoriza uso de dados do usuário para treinar modelos de terceiros",
    );
  });

  it("keeps the informational nature disclaimer for AI insights", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("não constituem recomendação financeira");
  });

  it("displays the Auraxis brand in the header", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Auraxis");
  });

  it("contains internal links to Terms of Service", () => {
    const wrapper = mountPage();
    const termsLinks = wrapper.findAll("a[href=\"/terms\"]");
    expect(termsLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("contains internal links to Cookies Policy", () => {
    const wrapper = mountPage();
    const cookiesLinks = wrapper.findAll("a[href=\"/cookies\"]");
    expect(cookiesLinks.length).toBeGreaterThanOrEqual(2);
  });
});
