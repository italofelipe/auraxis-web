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

  it("renders the tool name and description", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Pedir aumento");
    expect(wrapper.text()).toContain("Cálculo de inflação + ganho real desejado.");
  });

  it("displays the 'Público' badge for public tools", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Público");
  });

  it("displays the 'Login necessário' badge for authenticated tools", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: authTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Login necessário");
  });

  it("displays the 'Premium' badge for premium tools", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: premiumTool, isAuthenticated: false, isPremium: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Premium");
  });

  it("displays the 'Usar ferramenta' CTA for an enabled public tool", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Usar ferramenta");
  });

  it("displays the 'Fazer login para usar' CTA when unauthenticated and tool requires auth", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: authTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Fazer login para usar");
  });

  it("displays the 'Ver planos' CTA for a premium tool when the user is not premium", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: premiumTool, isAuthenticated: true, isPremium: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Ver planos");
  });

  it("displays the 'Em breve' CTA for a disabled tool", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: disabledTool, isAuthenticated: false },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Em breve");
  });

  it("button is disabled for disabled tools", () => {
    const wrapper = mount(ToolCard, {
      props: { tool: disabledTool, isAuthenticated: false },
      global: { stubs },
    });

    const button = wrapper.find(".n-button");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("navigates to /login with redirect when clicking an authenticated tool without login", async () => {
    const wrapper = mount(ToolCard, {
      props: { tool: authTool, isAuthenticated: false },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    expect(mockPush).toHaveBeenCalledWith(
      `/login?redirect=/tools&tool=${authTool.id}`,
    );
  });

  it("does not navigate when clicking a public tool (no redirect required)", async () => {
    const wrapper = mount(ToolCard, {
      props: { tool: publicTool, isAuthenticated: false },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
