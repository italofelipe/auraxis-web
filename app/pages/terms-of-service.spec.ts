import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TermsOfServicePage from "./terms-of-service.vue";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

describe("TermsOfServicePage (/terms-of-service)", () => {
  it("renders the page title", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Termos de Uso");
  });

  it("displays document version and effective date", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("1.0.0");
    expect(wrapper.text()).toContain("07/03/2026");
  });

  it("displays the support email", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("suporte@auraxis.com.br");
  });

  it("contains a mailto link for the support email", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    const mailLinks = wrapper.findAll("a[href=\"mailto:suporte@auraxis.com.br\"]");
    expect(mailLinks.length).toBeGreaterThan(0);
  });

  it("displays navigation link to Privacy Policy", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    const privLink = wrapper.find("a[href=\"/privacy-policy\"]");
    expect(privLink.exists()).toBe(true);
  });

  it("displays back link to login", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    const backLink = wrapper.find("a[href=\"/login\"]");
    expect(backLink.exists()).toBe(true);
  });

  it("contains section about who can use the service", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Quem pode usar");
  });

  it("contains section about permitted use", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Uso permitido");
  });

  it("contains section about prohibited use", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Uso proibido");
  });

  it("contains section about limitation of liability", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Limitação de responsabilidade");
  });

  it("contains section about acceptance", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Aceite");
  });

  it("displays the Auraxis brand in the header", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Auraxis");
  });

  it("contains internal links to Privacy Policy", () => {
    const wrapper = mount(TermsOfServicePage, { global: { stubs } });
    const privLinks = wrapper.findAll("a[href=\"/privacy-policy\"]");
    expect(privLinks.length).toBeGreaterThanOrEqual(2);
  });
});
