import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PrivacyPolicyPage from "./privacy-policy.vue";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

describe("PrivacyPolicyPage (/privacy-policy)", () => {
  it("renders the page title", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Política de Privacidade");
  });

  it("displays document version and effective date", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("1.0.0");
    expect(wrapper.text()).toContain("07/03/2026");
  });

  it("displays the support email", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("suporte@auraxis.com.br");
  });

  it("contains a mailto link for the support email", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    const mailLinks = wrapper.findAll("a[href=\"mailto:suporte@auraxis.com.br\"]");
    expect(mailLinks.length).toBeGreaterThan(0);
  });

  it("displays navigation link to Terms of Service", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    const termsLink = wrapper.find("a[href=\"/terms-of-service\"]");
    expect(termsLink.exists()).toBe(true);
  });

  it("displays back link to login", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    const backLink = wrapper.find("a[href=\"/login\"]");
    expect(backLink.exists()).toBe(true);
  });

  it("contains section about the policy objective", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Objetivo");
  });

  it("contains section about data processed", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Dados tratados");
  });

  it("contains section about purposes", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Finalidades");
  });

  it("contains section about legal bases", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Bases legais");
  });

  it("contains section about data subject rights", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Direitos do titular");
  });

  it("contains section about third-party sharing", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Compartilhamento com terceiros");
  });

  it("mentions LGPD in the content", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("LGPD");
  });

  it("displays the Auraxis brand in the header", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Auraxis");
  });

  it("contains internal links to Terms of Service", () => {
    const wrapper = mount(PrivacyPolicyPage, { global: { stubs } });
    const termsLinks = wrapper.findAll("a[href=\"/terms-of-service\"]");
    expect(termsLinks.length).toBeGreaterThanOrEqual(2);
  });
});
