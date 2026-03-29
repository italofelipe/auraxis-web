import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NTag, NButton } from "naive-ui";

import ToolCatalogCard from "./ToolCatalogCard.vue";
import type { Tool } from "~/features/tools/model/tools";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("#app", () => ({
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const map: Record<string, string> = {
        "pages.tools.accessLevel.public": "Público",
        "pages.tools.accessLevel.authenticated": "Gratuito",
        "pages.tools.accessLevel.premium": "Premium",
        "pages.tools.card.open": "Abrir ferramenta",
        "pages.tools.card.disabled": "Em breve",
      };
      return map[key] ?? key;
    },
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const publicTool: Tool = {
  id: "installment-vs-cash",
  name: "Parcelado vs À Vista",
  description: "Compare se vale mais a pena pagar à vista ou parcelado.",
  enabled: true,
  accessLevel: "public",
  route: "/tools/installment-vs-cash",
};

const authTool: Tool = {
  id: "budget-planner",
  name: "Planejamento de Orçamento",
  description: "Organize suas finanças mensais.",
  enabled: true,
  accessLevel: "authenticated",
  route: "/tools/budget-planner",
};

const premiumTool: Tool = {
  id: "advanced-simulator",
  name: "Simulador Avançado",
  description: "Simulações avançadas exclusivas para assinantes.",
  enabled: true,
  accessLevel: "premium",
  route: "/tools/advanced-simulator",
};

const disabledTool: Tool = {
  id: "coming-soon",
  name: "Em Desenvolvimento",
  description: "Disponível em breve.",
  enabled: false,
  accessLevel: "public",
  route: "/tools/coming-soon",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Mounts ToolCatalogCard without component stubs.
 * The real Naive UI components are used so we can inspect their props directly.
 *
 * @param tool - Tool data to render.
 * @returns VueWrapper around the mounted component.
 */
function mountCard(tool: Tool): ReturnType<typeof mount> {
  return mount(ToolCatalogCard, {
    props: { tool },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ToolCatalogCard", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the tool name and description", () => {
    const wrapper = mountCard(publicTool);
    expect(wrapper.text()).toContain("Parcelado vs À Vista");
    expect(wrapper.text()).toContain("Compare se vale mais a pena pagar à vista ou parcelado");
  });

  describe("access badge", () => {
    it("shows 'Público' badge for public access level", () => {
      const wrapper = mountCard(publicTool);
      const tag = wrapper.findComponent(NTag);
      expect(tag.exists()).toBe(true);
      expect(tag.text()).toContain("Público");
      expect(tag.props("type")).toBe("success");
    });

    it("shows 'Gratuito' badge for authenticated access level", () => {
      const wrapper = mountCard(authTool);
      const tag = wrapper.findComponent(NTag);
      expect(tag.exists()).toBe(true);
      expect(tag.text()).toContain("Gratuito");
      expect(tag.props("type")).toBe("info");
    });

    it("shows 'Premium' badge for premium access level", () => {
      const wrapper = mountCard(premiumTool);
      const tag = wrapper.findComponent(NTag);
      expect(tag.exists()).toBe(true);
      expect(tag.text()).toContain("Premium");
      expect(tag.props("type")).toBe("warning");
    });
  });

  describe("CTA button", () => {
    it("shows 'Abrir ferramenta' label when tool is enabled", () => {
      const wrapper = mountCard(publicTool);
      const button = wrapper.findComponent(NButton);
      expect(button.text()).toContain("Abrir ferramenta");
    });

    it("shows 'Em breve' label when tool is disabled", () => {
      const wrapper = mountCard(disabledTool);
      const button = wrapper.findComponent(NButton);
      expect(button.text()).toContain("Em breve");
    });

    it("button is disabled when tool is not enabled", () => {
      const wrapper = mountCard(disabledTool);
      const button = wrapper.findComponent(NButton);
      expect(button.props("disabled")).toBe(true);
    });

    it("button is not disabled when tool is enabled", () => {
      const wrapper = mountCard(publicTool);
      const button = wrapper.findComponent(NButton);
      expect(button.props("disabled")).toBe(false);
    });
  });

  describe("navigation", () => {
    it("navigates to the tool route when button is clicked on enabled tool", async () => {
      const wrapper = mountCard(publicTool);
      await wrapper.findComponent(NButton).trigger("click");
      expect(mockPush).toHaveBeenCalledWith("/tools/installment-vs-cash");
    });

    it("does not navigate when button is clicked on disabled tool", async () => {
      const wrapper = mountCard(disabledTool);
      await wrapper.findComponent(NButton).trigger("click");
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("navigates to the correct route for authenticated tools", async () => {
      const wrapper = mountCard(authTool);
      await wrapper.findComponent(NButton).trigger("click");
      expect(mockPush).toHaveBeenCalledWith("/tools/budget-planner");
    });

    it("navigates to the correct route for premium tools", async () => {
      const wrapper = mountCard(premiumTool);
      await wrapper.findComponent(NButton).trigger("click");
      expect(mockPush).toHaveBeenCalledWith("/tools/advanced-simulator");
    });
  });
});
