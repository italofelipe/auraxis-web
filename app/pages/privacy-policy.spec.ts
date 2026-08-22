import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PrivacyPolicyPage from "./privacy-policy.vue";
import {
  PRIVACY_POLICY_VERSION,
  privacyPolicyDocument,
} from "~/features/legal/legal-documents";
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

  // Derivado das constantes de propósito: fixar "2.2.0" na unha fazia o teste
  // reprovar a cada bump legítimo de versão, sem nada de errado no documento.
  it("displays document version and effective date", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain(PRIVACY_POLICY_VERSION);
    expect(wrapper.text()).toContain(privacyPolicyDocument.updatedAtLabel);
  });

  it("displays the data subject channel", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain(privacyPolicyDocument.contactEmail);
  });

  it("contains a mailto link for the data subject channel", () => {
    const wrapper = mountPage();
    const mailLinks = wrapper.findAll(
      `a[href="mailto:${privacyPolicyDocument.contactEmail}"]`,
    );
    expect(mailLinks.length).toBeGreaterThan(0);
  });

  // Exigência do art. 9º, I da LGPD: o titular precisa saber quem é o
  // controlador. Antes disto a página em produção não citava nem a razão
  // social nem o CNPJ (web#1116, platform#1007).
  it("identifies the data controller by legal name and tax id", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Sensorium");
    expect(wrapper.text()).toContain("47.093.328/0001-63");
  });

  it("states the ANPD small-agent waiver for appointing a DPO", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain("Resolução CD/ANPD nº 2");
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
