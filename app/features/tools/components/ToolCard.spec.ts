import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ToolCard from "./ToolCard.vue";
import type { Tool } from "~/features/tools/model/tools";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("#app", () => ({
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

const stubs = {
  NCard: {
    template: "<div class='n-card'><slot /></div>",
  },
  NTag: {
    props: ["type", "size", "round"],
    template: "<span class='n-tag' :data-type='type'><slot /></span>",
  },
  NButton: {
    props: ["type", "size", "disabled"],
    template: "<button class='n-button' :data-type='type' :disabled='disabled' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
};

const publicTool: Tool = {
  id: "raise-calculator",
  name: "Pedir aumento",
  description: "Cálculo de inflação + ganho real desejado.",
  enabled: true,
  accessLevel: "public",
};

const authTool: Tool = {
  id: "bill-forecast",
  name: "Simulador de contas",
  description: "Previsão de saldo após contas recorrentes.",
  enabled: true,
  accessLevel: "authenticated",
};

const premiumTool: Tool = {
  id: "premium-tool",
  name: "Ferramenta Premium",
  description: "Exclusiva para assinantes.",
  enabled: true,
  accessLevel: "premium",
};

const disabledTool: Tool = {
  id: "coming-soon",
  name: "Em desenvolvimento",
  description: "Disponível em breve.",
  enabled: false,
  accessLevel: "public",
};

describe("ToolCard", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renderiza o nome e a descrição da ferramenta", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Pedir aumento");
    expect(wrapper.text()).toContain("Cálculo de inflação + ganho real desejado.");
  });

  it("exibe badge 'Público' para ferramentas públicas", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Público");
  });

  it("exibe badge 'Login necessário' para ferramentas autenticadas", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: authTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Login necessário");
  });

  it("exibe badge 'Premium' para ferramentas premium", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: premiumTool, isAuthenticated: false, isPremium: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Premium");
  });

  it("exibe CTA 'Usar ferramenta' para ferramenta pública habilitada", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Usar ferramenta");
  });

  it("exibe CTA 'Fazer login para usar' quando não autenticado e ferramenta requer auth", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: authTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Fazer login para usar");
  });

  it("exibe CTA 'Ver planos' para ferramenta premium quando usuário não é premium", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: premiumTool, isAuthenticated: true, isPremium: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Ver planos");
  });

  it("exibe CTA 'Em breve' para ferramenta desabilitada", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: disabledTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Em breve");
  });

  it("botão está desabilitado para ferramentas desabilitadas", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: disabledTool, isAuthenticated: false },
      global: { stubs },
    });

    const button = wrapper.find(".n-button");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("navega para /login com redirect ao clicar em ferramenta autenticada sem login", async () => {
    const wrapper = mount(ToolCard, {
      props: { tool: authTool, isAuthenticated: false },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    expect(mockPush).toHaveBeenCalledWith(
      `/login?redirect=/tools&tool=${authTool.id}`,
    );
  });

  it("não navega ao clicar em ferramenta pública (não requer redirect)", async () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
