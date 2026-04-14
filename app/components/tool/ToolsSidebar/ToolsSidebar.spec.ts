import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ToolsSidebar from "./ToolsSidebar.vue";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

/** Plain reactive-like object so vi.mock factory can access it before module init. */
const { mockRoutePath } = vi.hoisted(() => ({
  mockRoutePath: { value: "/tools/thirteenth-salary" },
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string) => key,
  }),
}));

vi.mock("#app", () => ({
  useRoute: (): { path: string } => ({
    get path(): string { return mockRoutePath.value; },
  }),
}));

vi.mock("~/features/tools/model/tools-catalog", () => ({
  TOOLS_CATALOG: [
    {
      id: "thirteenth-salary",
      name: "Simulador de 13º Salário",
      description: "Calcule o 13º salário",
      enabled: true,
      accessLevel: "public",
      route: "/tools/thirteenth-salary",
      featureFlag: "web.tools.thirteenth-salary",
    },
    {
      id: "hora-extra",
      name: "Hora Extra CLT",
      description: "Calcule horas extras",
      enabled: true,
      accessLevel: "public",
      route: "/tools/hora-extra",
      featureFlag: "web.tools.hora-extra",
    },
    {
      id: "ferias",
      name: "Simulador de Férias CLT",
      description: "Calcule férias",
      enabled: true,
      accessLevel: "public",
      route: "/tools/ferias",
      featureFlag: "web.tools.ferias",
    },
    {
      id: "rescisao",
      name: "Rescisão Contratual CLT",
      description: "Calcule rescisão",
      enabled: true,
      accessLevel: "public",
      route: "/tools/rescisao",
      featureFlag: "web.tools.rescisao",
    },
    {
      id: "fgts",
      name: "Simulador de FGTS",
      description: "Calcule FGTS",
      enabled: true,
      accessLevel: "public",
      route: "/tools/fgts",
      featureFlag: "web.tools.fgts",
    },
    {
      id: "clt-vs-pj",
      name: "CLT vs PJ",
      description: "Compare CLT e PJ",
      enabled: true,
      accessLevel: "public",
      route: "/tools/clt-vs-pj",
      featureFlag: "web.tools.clt-vs-pj",
    },
    {
      id: "inss-ir-folha",
      name: "INSS + IR na Folha",
      description: "Calcule INSS e IR",
      enabled: true,
      accessLevel: "public",
      route: "/tools/inss-ir-folha",
      featureFlag: "web.tools.inss-ir-folha",
    },
    {
      id: "cdb-lci-lca",
      name: "CDB / LCI / LCA vs Poupança",
      description: "Compare investimentos",
      enabled: true,
      accessLevel: "public",
      route: "/tools/cdb-lci-lca",
      featureFlag: "web.tools.cdb-lci-lca",
    },
    {
      id: "installment-vs-cash",
      name: "Parcelado vs À Vista",
      description: "Compare parcelado e à vista",
      enabled: true,
      accessLevel: "public",
      route: "/tools/installment-vs-cash",
      featureFlag: "web.tools.installment-vs-cash",
    },
    {
      id: "mei",
      name: "Calculadora MEI",
      description: "Calcule MEI",
      enabled: true,
      accessLevel: "public",
      route: "/tools/mei",
      featureFlag: "web.tools.mei",
    },
    {
      id: "juros-compostos",
      name: "Juros Compostos e Taxa Real",
      description: "Simule juros compostos",
      enabled: true,
      accessLevel: "public",
      route: "/tools/juros-compostos",
      featureFlag: "web.tools.juros-compostos",
    },
    {
      id: "aposentadoria",
      name: "Simulador de Aposentadoria",
      description: "Simule aposentadoria",
      enabled: true,
      accessLevel: "public",
      route: "/tools/aposentadoria",
      featureFlag: "web.tools.aposentadoria",
    },
    {
      id: "fire",
      name: "Calculadora FIRE",
      description: "Calcule FIRE",
      enabled: true,
      accessLevel: "public",
      route: "/tools/fire",
      featureFlag: "web.tools.fire",
    },
    {
      id: "financiamento-imobiliario",
      name: "Financiamento Imobiliário",
      description: "Simule financiamento",
      enabled: true,
      accessLevel: "public",
      route: "/tools/financiamento-imobiliario",
      featureFlag: "web.tools.financiamento-imobiliario",
    },
    {
      id: "aluguel-vs-compra",
      name: "Aluguel vs Compra",
      description: "Compare aluguel e compra",
      enabled: true,
      accessLevel: "public",
      route: "/tools/aluguel-vs-compra",
      featureFlag: "web.tools.aluguel-vs-compra",
    },
    {
      id: "dividir-conta",
      name: "Dividir Conta",
      description: "Divida a conta",
      enabled: true,
      accessLevel: "public",
      route: "/tools/dividir-conta",
      featureFlag: "web.tools.dividir-conta",
    },
    {
      id: "desconto-markup",
      name: "Desconto, Markup e Margem",
      description: "Calcule desconto e markup",
      enabled: true,
      accessLevel: "public",
      route: "/tools/desconto-markup",
      featureFlag: "web.tools.desconto-markup",
    },
    {
      id: "conversor-moeda",
      name: "Conversor de Moeda",
      description: "Converta moedas",
      enabled: true,
      accessLevel: "public",
      route: "/tools/conversor-moeda",
      featureFlag: "web.tools.conversor-moeda",
    },
    {
      id: "fii",
      name: "Calculadora de FII",
      description: "Calcule FII",
      enabled: true,
      accessLevel: "public",
      route: "/tools/fii",
      featureFlag: "web.tools.fii",
    },
    {
      id: "tesouro-direto",
      name: "Tesouro Direto",
      description: "Simule Tesouro Direto",
      enabled: true,
      accessLevel: "public",
      route: "/tools/tesouro-direto",
      featureFlag: "web.tools.tesouro-direto",
    },
  ],
}));

vi.mock("lucide-vue-next", () => ({
  Menu: { template: "<span class='icon-menu' />" },
  X: { template: "<span class='icon-x' />" },
  ChevronDown: { template: "<span class='icon-chevron' />" },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const globalStubs = {
  NuxtLink: {
    props: ["to", "ariaCurrent", "ariaDisabled"],
    template: "<a :href=\"to\" :aria-current=\"ariaCurrent\" :class=\"$attrs.class\"><slot /></a>",
    inheritAttrs: false,
  },
};

/**
 * Mounts ToolsSidebar with global NuxtLink stub.
 * @returns The mounted wrapper instance.
 */
function mountSidebar(): ReturnType<typeof mount> {
  return mount(ToolsSidebar, {
    global: {
      stubs: globalStubs,
    },
  });
}

/** Resets pinia and route path to their default test values. */
function resetState(): void {
  setActivePinia(createPinia());
  mockRoutePath.value = "/tools/thirteenth-salary";
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ToolsSidebar", () => {
  beforeEach(() => {
    resetState();
  });

  describe("rendering", () => {
    it("renders the sidebar navigation element", () => {
      const wrapper = mountSidebar();

      expect(wrapper.find("nav.tools-sidebar").exists()).toBe(true);
    });

    it("renders tool group headings", () => {
      const wrapper = mountSidebar();

      const headings = wrapper.findAll(".tools-sidebar__group-heading");

      // At least one group (labor group) should be present
      expect(headings.length).toBeGreaterThan(0);
    });

    it("renders tool links inside groups", () => {
      const wrapper = mountSidebar();

      const links = wrapper.findAll(".tools-sidebar__tool-link");

      // At least some tools should be rendered
      expect(links.length).toBeGreaterThan(0);
    });

    it("renders the mobile toggle button", () => {
      const wrapper = mountSidebar();

      expect(wrapper.find(".tools-sidebar__mobile-toggle").exists()).toBe(true);
    });

    it("shows all major tool names", () => {
      const wrapper = mountSidebar();
      const text = wrapper.text();

      expect(text).toContain("Simulador de 13º Salário");
      expect(text).toContain("Hora Extra CLT");
      expect(text).toContain("Parcelado vs À Vista");
    });
  });

  describe("active state", () => {
    it("marks the current tool link as active", () => {
      mockRoutePath.value = "/tools/thirteenth-salary";
      const wrapper = mountSidebar();

      const activeLinks = wrapper.findAll(".tools-sidebar__tool-link--active");

      expect(activeLinks.length).toBe(1);
      expect(activeLinks[0]!.attributes("href")).toBe("/tools/thirteenth-salary");
    });

    it("sets aria-current='page' on the active link", () => {
      mockRoutePath.value = "/tools/hora-extra";
      const wrapper = mountSidebar();

      const activeLink = wrapper.find("[aria-current='page']");

      expect(activeLink.exists()).toBe(true);
      expect(activeLink.attributes("href")).toBe("/tools/hora-extra");
    });

    it("does not mark any link as active when path does not match", () => {
      mockRoutePath.value = "/tools";
      const wrapper = mountSidebar();

      const activeLinks = wrapper.findAll(".tools-sidebar__tool-link--active");

      expect(activeLinks.length).toBe(0);
    });
  });

  describe("accordion behavior", () => {
    it("groups are expanded by default", () => {
      const wrapper = mountSidebar();

      // Tool lists should be visible
      const toolLinks = wrapper.findAll(".tools-sidebar__tool-link");

      expect(toolLinks.length).toBeGreaterThan(0);
    });

    it("toggles a group when its heading is clicked", async () => {
      const wrapper = mountSidebar();

      // Click the first group heading to collapse it
      const firstHeading = wrapper.findAll(".tools-sidebar__group-heading")[0]!;
      await firstHeading.trigger("click");

      // The first heading button should now have aria-expanded false
      expect(firstHeading.attributes("aria-expanded")).toBe("false");
    });

    it("expands a collapsed group when its heading is clicked again", async () => {
      const wrapper = mountSidebar();

      const firstHeading = wrapper.findAll(".tools-sidebar__group-heading")[0]!;
      // Collapse
      await firstHeading.trigger("click");
      expect(firstHeading.attributes("aria-expanded")).toBe("false");

      // Expand again
      await firstHeading.trigger("click");
      expect(firstHeading.attributes("aria-expanded")).toBe("true");
    });
  });

  describe("mobile drawer", () => {
    it("sidebar is closed by default on mobile (no open class)", () => {
      const wrapper = mountSidebar();

      expect(wrapper.find("nav.tools-sidebar").classes()).not.toContain("tools-sidebar--open");
    });

    it("opens mobile drawer when toggle is clicked", async () => {
      const wrapper = mountSidebar();

      await wrapper.find(".tools-sidebar__mobile-toggle").trigger("click");

      expect(wrapper.find("nav.tools-sidebar").classes()).toContain("tools-sidebar--open");
    });

    it("closes mobile drawer when toggle is clicked again", async () => {
      const wrapper = mountSidebar();

      await wrapper.find(".tools-sidebar__mobile-toggle").trigger("click");
      expect(wrapper.find("nav.tools-sidebar").classes()).toContain("tools-sidebar--open");

      await wrapper.find(".tools-sidebar__mobile-toggle").trigger("click");
      expect(wrapper.find("nav.tools-sidebar").classes()).not.toContain("tools-sidebar--open");
    });

    it("shows backdrop when mobile drawer is open", async () => {
      const wrapper = mountSidebar();

      await wrapper.find(".tools-sidebar__mobile-toggle").trigger("click");

      expect(wrapper.find(".tools-sidebar__backdrop").exists()).toBe(true);
    });

    it("closes mobile drawer when backdrop is clicked", async () => {
      const wrapper = mountSidebar();

      await wrapper.find(".tools-sidebar__mobile-toggle").trigger("click");
      expect(wrapper.find("nav.tools-sidebar").classes()).toContain("tools-sidebar--open");

      await wrapper.find(".tools-sidebar__backdrop").trigger("click");
      expect(wrapper.find("nav.tools-sidebar").classes()).not.toContain("tools-sidebar--open");
    });
  });

  describe("accessibility", () => {
    it("nav has aria-label", () => {
      const wrapper = mountSidebar();

      const nav = wrapper.find("nav.tools-sidebar");
      expect(nav.attributes("aria-label")).toBeTruthy();
    });

    it("mobile toggle has aria-expanded attribute", () => {
      const wrapper = mountSidebar();

      const toggle = wrapper.find(".tools-sidebar__mobile-toggle");
      expect(toggle.attributes("aria-expanded")).toBeDefined();
    });

    it("group headings have aria-expanded attribute", () => {
      const wrapper = mountSidebar();

      const headings = wrapper.findAll(".tools-sidebar__group-heading");
      for (const heading of headings) {
        expect(heading.attributes("aria-expanded")).toBeDefined();
      }
    });
  });
});
