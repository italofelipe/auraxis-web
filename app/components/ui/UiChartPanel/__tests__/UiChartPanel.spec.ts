import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiChartPanel from "../UiChartPanel.vue";
import type { UiChartPanelProps } from "../UiChartPanel.types";

/** Stub for UiSurfaceCard — renders a plain div with slot. */
const UiSurfaceCardStub = {
  name: "UiSurfaceCard",
  props: ["padding", "shadow", "bordered"],
  template: "<div class=\"ui-surface-card\"><slot /></div>",
};

/** Stub for UiInfoTooltip — renders a span with content. */
const UiInfoTooltipStub = {
  name: "UiInfoTooltip",
  props: ["content", "label"],
  template: "<span class=\"ui-info-tooltip\" :data-content=\"content\">ℹ</span>",
};

const globalStubs = {
  UiSurfaceCard: UiSurfaceCardStub,
  UiInfoTooltip: UiInfoTooltipStub,
};

/**
 * Mounts UiChartPanel with the given props and optional slots.
 *
 * @param props Component props.
 * @param slots Optional named slot content map.
 * @returns The mounted wrapper.
 */
function mountPanel(
  props: UiChartPanelProps = {},
  slots: Record<string, string> = {},
): ReturnType<typeof mount> {
  return mount(UiChartPanel, {
    props,
    slots,
    global: { stubs: globalStubs },
  });
}

describe("UiChartPanel", () => {
  it("renders without crashing", () => {
    const wrapper = mountPanel();
    expect(wrapper.exists()).toBe(true);
  });

  it("does not render header when neither title nor actions slot is provided", () => {
    const wrapper = mountPanel();
    expect(wrapper.find(".ui-chart-panel__header").exists()).toBe(false);
  });

  it("renders header with title when title prop is provided", () => {
    const wrapper = mountPanel({ title: "Evolução do saldo" });
    expect(wrapper.find(".ui-chart-panel__header").exists()).toBe(true);
    expect(wrapper.find(".ui-chart-panel__title").text()).toBe("Evolução do saldo");
  });

  it("renders subtitle when subtitle prop is provided", () => {
    const wrapper = mountPanel({ title: "Evolução", subtitle: "Últimos 6 meses" });
    expect(wrapper.find(".ui-chart-panel__subtitle").text()).toBe("Últimos 6 meses");
  });

  it("does not render subtitle element when subtitle is not provided", () => {
    const wrapper = mountPanel({ title: "Evolução" });
    expect(wrapper.find(".ui-chart-panel__subtitle").exists()).toBe(false);
  });

  it("renders UiInfoTooltip when helper prop is provided", () => {
    const wrapper = mountPanel({ title: "Saldo", helper: "Saldo líquido do período" });
    const tooltip = wrapper.find(".ui-info-tooltip");
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.attributes("data-content")).toBe("Saldo líquido do período");
  });

  it("does not render UiInfoTooltip when helper is not provided", () => {
    const wrapper = mountPanel({ title: "Saldo" });
    expect(wrapper.find(".ui-info-tooltip").exists()).toBe(false);
  });

  it("renders actions slot inside the header", () => {
    const wrapper = mountPanel(
      { title: "Receitas" },
      { actions: "<button class=\"period-btn\">Mês</button>" },
    );
    expect(wrapper.find(".ui-chart-panel__actions").exists()).toBe(true);
    expect(wrapper.find(".period-btn").exists()).toBe(true);
  });

  it("renders header when only actions slot is provided (no title)", () => {
    const wrapper = mountPanel(
      {},
      { actions: "<button>Ver tudo</button>" },
    );
    expect(wrapper.find(".ui-chart-panel__header").exists()).toBe(true);
    expect(wrapper.find(".ui-chart-panel__title").exists()).toBe(false);
  });

  it("shows skeleton when loading is true", () => {
    const wrapper = mountPanel({ loading: true, chartHeight: "300px" });
    expect(wrapper.find(".ui-chart-panel__skeleton").exists()).toBe(true);
    expect(wrapper.find(".ui-chart-panel__skeleton").attributes("aria-hidden")).toBe("true");
  });

  it("hides skeleton and renders default slot when loading is false", () => {
    const wrapper = mountPanel(
      { loading: false },
      { default: "<div class=\"my-chart\">chart</div>" },
    );
    expect(wrapper.find(".ui-chart-panel__skeleton").exists()).toBe(false);
    expect(wrapper.find(".my-chart").exists()).toBe(true);
  });

  it("applies chartHeight to the skeleton element", () => {
    const wrapper = mountPanel({ loading: true, chartHeight: "350px" });
    const skeleton = wrapper.find(".ui-chart-panel__skeleton");
    expect(skeleton.attributes("style")).toContain("height: 350px");
  });

  it("does not render legend area when legend slot is empty", () => {
    const wrapper = mountPanel({ title: "Test" });
    expect(wrapper.find(".ui-chart-panel__legend").exists()).toBe(false);
  });

  it("renders legend slot when provided", () => {
    const wrapper = mountPanel(
      { title: "Carteira" },
      { legend: "<div class=\"legend-item\">Renda Fixa</div>" },
    );
    expect(wrapper.find(".ui-chart-panel__legend").exists()).toBe(true);
    expect(wrapper.find(".legend-item").exists()).toBe(true);
  });
});
