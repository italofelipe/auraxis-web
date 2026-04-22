import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import UiEmptyState from "../UiEmptyState.vue";

const MockIcon = defineComponent({
  name: "MockIcon",
  props: ["size"],
  render() { return h("svg", { class: "mock-icon" }); },
});

describe("UiEmptyState", () => {
  describe("core rendering", () => {
    it("renders title", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Nenhum item encontrado" },
      });
      expect(wrapper.text()).toContain("Nenhum item encontrado");
    });

    it("renders description when provided", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", description: "Adicione itens aqui." },
      });
      expect(wrapper.find(".ui-empty-state__description").exists()).toBe(true);
      expect(wrapper.text()).toContain("Adicione itens aqui.");
    });

    it("does not render description when not provided", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio" } });
      expect(wrapper.find(".ui-empty-state__description").exists()).toBe(false);
    });

    it("has role=\"status\" attribute", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio" } });
      expect(wrapper.attributes("role")).toBe("status");
    });

    it("applies compact class when compact=true", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", compact: true } });
      expect(wrapper.classes()).toContain("ui-empty-state--compact");
    });

    it("does not apply compact class by default", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio" } });
      expect(wrapper.classes()).not.toContain("ui-empty-state--compact");
    });
  });

  describe("icon", () => {
    it("renders icon when icon prop is provided as Component", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", icon: MockIcon } });
      expect(wrapper.find(".ui-empty-state__icon-wrap").exists()).toBe(true);
      expect(wrapper.find(".mock-icon").exists()).toBe(true);
    });

    it("renders icon when icon prop is provided as canonical string name", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", icon: "calendar" } });
      expect(wrapper.find(".ui-empty-state__icon-wrap").exists()).toBe(true);
    });

    it("does not render icon wrap when icon prop is not provided", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio" } });
      expect(wrapper.find(".ui-empty-state__icon-wrap").exists()).toBe(false);
    });

    it("renders icon with smaller size in compact mode", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", icon: MockIcon, compact: true } });
      expect(wrapper.findComponent(MockIcon).props("size")).toBe(24);
    });

    it("renders icon with full size in default mode", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", icon: MockIcon } });
      expect(wrapper.findComponent(MockIcon).props("size")).toBe(40);
    });
  });

  describe("primary action", () => {
    it("renders action button when actionLabel is provided", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", actionLabel: "Adicionar" } });
      const button = wrapper.find(".ui-empty-state__action");
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe("Adicionar");
    });

    it("does not render action button when actionLabel is not provided", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio" } });
      expect(wrapper.find(".ui-empty-state__action").exists()).toBe(false);
    });

    it("emits action event when button is clicked", async () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", actionLabel: "Clique aqui" } });
      await wrapper.find(".ui-empty-state__action").trigger("click");
      expect(wrapper.emitted("action")).toBeTruthy();
      expect(wrapper.emitted("action")).toHaveLength(1);
    });

    it("emits action multiple times on multiple clicks", async () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", actionLabel: "Clique" } });
      await wrapper.find(".ui-empty-state__action").trigger("click");
      await wrapper.find(".ui-empty-state__action").trigger("click");
      expect(wrapper.emitted("action")).toHaveLength(2);
    });

    it("does not render actions wrap when no labels are provided", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio" } });
      expect(wrapper.find(".ui-empty-state__actions").exists()).toBe(false);
    });
  });

  describe("secondary action", () => {
    it("does not render secondary control when secondaryLabel is not provided", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", actionLabel: "Ação" } });
      expect(wrapper.find(".ui-empty-state__secondary").exists()).toBe(false);
    });

    it("renders secondary as button when secondaryLabel is provided without href", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", actionLabel: "Primário", secondaryLabel: "Secundário" },
      });
      const secondary = wrapper.find("button.ui-empty-state__secondary");
      expect(secondary.exists()).toBe(true);
      expect(secondary.text()).toBe("Secundário");
    });

    it("renders secondary as anchor when secondaryHref is provided", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", secondaryLabel: "Saiba mais", secondaryHref: "/sobre" },
      });
      const link = wrapper.find("a.ui-empty-state__secondary");
      expect(link.exists()).toBe(true);
      expect(link.attributes("href")).toBe("/sobre");
      expect(link.text()).toBe("Saiba mais");
    });

    it("emits secondary-action when secondary button is clicked", async () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", secondaryLabel: "Ajuda" } });
      await wrapper.find("button.ui-empty-state__secondary").trigger("click");
      expect(wrapper.emitted("secondary-action")).toBeTruthy();
      expect(wrapper.emitted("secondary-action")).toHaveLength(1);
    });

    it("emits secondary-action when secondary anchor is clicked", async () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", secondaryLabel: "Saiba mais", secondaryHref: "/sobre" },
      });
      await wrapper.find("a.ui-empty-state__secondary").trigger("click");
      expect(wrapper.emitted("secondary-action")).toBeTruthy();
    });

    it("renders secondary without primary (secondary alone is valid)", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio", secondaryLabel: "Saiba mais" } });
      expect(wrapper.find(".ui-empty-state__action").exists()).toBe(false);
      expect(wrapper.find(".ui-empty-state__secondary").exists()).toBe(true);
    });
  });

  describe("slots", () => {
    it("slot #icon replaces default icon rendering", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", icon: MockIcon },
        slots: { icon: "<div class=\"custom-icon\">★</div>" },
      });
      expect(wrapper.find(".custom-icon").exists()).toBe(true);
      expect(wrapper.find(".ui-empty-state__icon-wrap").exists()).toBe(false);
    });

    it("slot #title replaces default title rendering", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Fallback" },
        slots: { title: "<h2 class=\"custom-title\">Título customizado</h2>" },
      });
      expect(wrapper.find(".custom-title").exists()).toBe(true);
      expect(wrapper.find(".ui-empty-state__title").exists()).toBe(false);
    });

    it("slot #description replaces default description rendering", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", description: "default" },
        slots: { description: "<p class=\"custom-desc\">Custom description</p>" },
      });
      expect(wrapper.find(".custom-desc").exists()).toBe(true);
      expect(wrapper.find(".ui-empty-state__description").exists()).toBe(false);
    });

    it("slot #actions replaces default actions rendering", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", actionLabel: "Default" },
        slots: { actions: "<div class=\"custom-actions\">Custom CTA</div>" },
      });
      expect(wrapper.find(".custom-actions").exists()).toBe(true);
      expect(wrapper.find(".ui-empty-state__action").exists()).toBe(false);
    });

    it("renders illustration slot when provided and not compact", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio" },
        slots: { illustration: "<svg data-testid=\"illus\" />" },
      });
      expect(wrapper.find(".ui-empty-state__illustration").exists()).toBe(true);
      expect(wrapper.find("[data-testid='illus']").exists()).toBe(true);
    });

    it("does not render illustration slot when compact=true", () => {
      const wrapper = mount(UiEmptyState, {
        props: { title: "Vazio", compact: true },
        slots: { illustration: "<svg data-testid=\"illus\" />" },
      });
      expect(wrapper.find(".ui-empty-state__illustration").exists()).toBe(false);
    });

    it("does not render illustration wrap when slot not provided", () => {
      const wrapper = mount(UiEmptyState, { props: { title: "Vazio" } });
      expect(wrapper.find(".ui-empty-state__illustration").exists()).toBe(false);
    });
  });

  describe("snapshots", () => {
    it("matches snapshot with all props", () => {
      const wrapper = mount(UiEmptyState, {
        props: {
          title: "Nenhum item",
          description: "Adicione itens para ver aqui.",
          actionLabel: "Adicionar",
          secondaryLabel: "Saiba mais",
          secondaryHref: "/docs",
          icon: MockIcon,
        },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it("matches snapshot in compact mode", () => {
      const wrapper = mount(UiEmptyState, {
        props: {
          title: "Sem dados",
          description: "Nenhuma entrada disponível.",
          icon: MockIcon,
          compact: true,
        },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
