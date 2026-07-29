import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { LayoutDashboard } from "lucide-vue-next";
import { NTooltip } from "naive-ui";
import UiSidebarNavItem from "../UiSidebarNavItem.vue";

const NuxtLinkStub = {
  template: "<a :href=\"to\" :data-prefetch=\"String(prefetch)\" v-bind=\"$attrs\"><slot /></a>",
  props: ["to", "prefetch"],
};

const globalConfig = {
  stubs: { NuxtLink: NuxtLinkStub },
};

describe("UiSidebarNavItem", () => {
  it("renders label when not collapsed", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard" },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__label").text()).toBe("Dashboard");
  });

  it("hides label when collapsed=true", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", collapsed: true },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__label").exists()).toBe(false);
  });

  it("applies active class when active=true", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: true },
      global: globalConfig,
    });
    expect(wrapper.find("a").classes()).toContain("ui-sidebar-nav-item--active");
  });

  it("does not apply active class when active=false", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: false },
      global: globalConfig,
    });
    expect(wrapper.find("a").classes()).not.toContain("ui-sidebar-nav-item--active");
  });

  it("applies aria-current=\"page\" when active", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: true },
      global: globalConfig,
    });
    expect(wrapper.find("a").attributes("aria-current")).toBe("page");
  });

  it("does not set aria-current when inactive", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", active: false },
      global: globalConfig,
    });
    expect(wrapper.find("a").attributes("aria-current")).toBeUndefined();
  });

  it("renders icon when passed", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__icon").exists()).toBe(true);
  });

  it("does not render icon container when icon is not passed", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard" },
      global: globalConfig,
    });
    expect(wrapper.find(".ui-sidebar-nav-item__icon").exists()).toBe(false);
  });

  it("renders as NuxtLink with correct to prop", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Carteira", to: "/carteira" },
      global: globalConfig,
    });
    expect(wrapper.find("a").attributes("href")).toBe("/carteira");
  });

  it("disables route prefetch to avoid eager dashboard chunk requests", () => {
    const wrapper = mount(UiSidebarNavItem, {
      props: { label: "Dashboard", to: "/dashboard" },
      global: globalConfig,
    });
    expect(wrapper.find("a").attributes("data-prefetch")).toBe("false");
  });

  describe("modo recolhido", () => {
    it("dá ao link um nome acessível, já que o rótulo visível some", () => {
      const wrapper = mount(UiSidebarNavItem, {
        props: { label: "Lançamentos Compartilhados", to: "/shared-entries", collapsed: true },
        global: globalConfig,
      });

      // Sem isto o link fica anônimo: o rótulo é removido e o ícone é
      // aria-hidden, então leitor de tela anunciaria apenas "link".
      expect(wrapper.find("a").attributes("aria-label")).toBe("Lançamentos Compartilhados");
    });

    it("não repete o nome acessível quando o rótulo já está visível", () => {
      const wrapper = mount(UiSidebarNavItem, {
        props: { label: "Dashboard", to: "/dashboard" },
        global: globalConfig,
      });

      expect(wrapper.find("a").attributes("aria-label")).toBeUndefined();
    });

    it("liga o tooltip apenas quando recolhido", () => {
      const collapsed = mount(UiSidebarNavItem, {
        props: { label: "Metas", to: "/goals", collapsed: true },
        global: globalConfig,
      });
      const expanded = mount(UiSidebarNavItem, {
        props: { label: "Metas", to: "/goals" },
        global: globalConfig,
      });

      /**
       * Reads whether the tooltip wrapping a mounted item is disabled.
       *
       * @param wrapper - Mounted UiSidebarNavItem.
       * @returns The tooltip's `disabled` prop.
       */
      const tooltipOf = (wrapper: ReturnType<typeof mount>): unknown =>
        wrapper.findComponent(NTooltip).props("disabled");

      expect(tooltipOf(collapsed)).toBe(false);
      // Expandido o nome já está na tela; um tooltip repetindo o texto visível
      // seria só ruído.
      expect(tooltipOf(expanded)).toBe(true);
    });

    it("anuncia o destino no conteúdo do tooltip", () => {
      const wrapper = mount(UiSidebarNavItem, {
        props: { label: "Orçamentos", to: "/budgets", collapsed: true },
        global: globalConfig,
      });

      // O popover só entra no DOM quando abre, então a asserção é sobre o slot
      // que o alimenta — é ali que o rótulo precisa chegar.
      const content = wrapper.findComponent(NTooltip).vm.$slots.default?.() ?? [];
      const text = content.map((node) => String(node.children ?? "")).join("");

      expect(text).toContain("Orçamentos");
    });
  });
});
