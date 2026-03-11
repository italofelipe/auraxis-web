import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PrivacidadePage from "./privacidade.vue";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

describe("PrivacidadePage (/privacidade)", () => {
  it("renderiza o título da página", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Política de Privacidade");
  });

  it("exibe versão e vigência do documento", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("1.0.0");
    expect(wrapper.text()).toContain("07/03/2026");
  });

  it("exibe o email de suporte", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("suporte@auraxis.com.br");
  });

  it("contém link de mailto para o email de suporte", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    const mailLinks = wrapper.findAll("a[href=\"mailto:suporte@auraxis.com.br\"]");
    expect(mailLinks.length).toBeGreaterThan(0);
  });

  it("exibe link de navegação para os Termos de Uso", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    const termosLink = wrapper.find("a[href=\"/termos\"]");
    expect(termosLink.exists()).toBe(true);
  });

  it("exibe link de voltar para o login", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    const backLink = wrapper.find("a[href=\"/login\"]");
    expect(backLink.exists()).toBe(true);
  });

  it("contém seção sobre objetivo da política", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Objetivo");
  });

  it("contém seção sobre dados tratados", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Dados tratados");
  });

  it("contém seção sobre finalidades", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Finalidades");
  });

  it("contém seção sobre bases legais", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Bases legais");
  });

  it("contém seção sobre direitos do titular", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Direitos do titular");
  });

  it("contém seção de compartilhamento com terceiros", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Compartilhamento com terceiros");
  });

  it("menciona a LGPD no conteúdo", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("LGPD");
  });

  it("exibe a marca Auraxis no cabeçalho", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    expect(wrapper.text()).toContain("Auraxis");
  });

  it("contém links internos para os Termos de Uso", () => {
    const wrapper = mount(PrivacidadePage, { global: { stubs } });
    const termosLinks = wrapper.findAll("a[href=\"/termos\"]");
    expect(termosLinks.length).toBeGreaterThanOrEqual(2);
  });
});
