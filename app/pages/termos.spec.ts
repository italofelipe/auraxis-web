import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TermosPage from "./termos.vue";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

describe("TermosPage (/termos)", () => {
  it("renderiza o título da página", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Termos de Uso");
  });

  it("exibe versão e vigência do documento", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("1.0.0");
    expect(wrapper.text()).toContain("07/03/2026");
  });

  it("exibe o email de suporte", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("suporte@auraxis.com.br");
  });

  it("contém link de mailto para o email de suporte", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    const mailLinks = wrapper.findAll("a[href=\"mailto:suporte@auraxis.com.br\"]");
    expect(mailLinks.length).toBeGreaterThan(0);
  });

  it("exibe link de navegação para a Política de Privacidade", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    const privLink = wrapper.find("a[href=\"/privacidade\"]");
    expect(privLink.exists()).toBe(true);
  });

  it("exibe link de voltar para o login", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    const backLink = wrapper.find("a[href=\"/login\"]");
    expect(backLink.exists()).toBe(true);
  });

  it("contém seção sobre quem pode usar", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Quem pode usar");
  });

  it("contém seção sobre uso permitido", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Uso permitido");
  });

  it("contém seção sobre uso proibido", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Uso proibido");
  });

  it("contém seção sobre limitação de responsabilidade", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Limitação de responsabilidade");
  });

  it("contém seção de aceite", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Aceite");
  });

  it("exibe a marca Auraxis no cabeçalho", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    expect(wrapper.text()).toContain("Auraxis");
  });

  it("contém links internos para a Política de Privacidade", () => {
    const wrapper = mount(TermosPage, { global: { stubs } });
    const privLinks = wrapper.findAll("a[href=\"/privacidade\"]");
    expect(privLinks.length).toBeGreaterThanOrEqual(2);
  });
});
