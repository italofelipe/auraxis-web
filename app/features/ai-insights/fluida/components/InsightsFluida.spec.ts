import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import InsightsFluida from "./InsightsFluida.vue";

// useTheme is a Nuxt auto-import resolved via the ~/composables alias; provide a
// light-mode stub so the editorial scope starts in light without app state.
vi.mock("~/composables/useTheme", () => ({
  useTheme: (): { resolvedTheme: { value: string } } => ({
    resolvedTheme: { value: "light" },
  }),
}));

const stubs = {
  // UiChart is a global Nuxt component (ECharts). Stub it to a marker element so
  // the editorial layout renders without pulling the echarts bundle into jsdom.
  UiChart: { template: "<div class='ui-chart-stub' />" },
};

/**
 * Mounts the Fluida screen with the chart stub installed.
 *
 * @returns The mounted wrapper.
 */
const mountFluida = (): ReturnType<typeof mount> =>
  mount(InsightsFluida, { global: { stubs } });

describe("InsightsFluida", () => {
  it("renders the masthead, lead and general comparison beat by default", () => {
    const wrapper = mountFluida();

    // masthead brand + cadence options
    expect(wrapper.text()).toContain("Insights de IA");
    expect(wrapper.text()).toContain("Diário");
    expect(wrapper.text()).toContain("Semanal");

    // lead headline (general daily) + opening summary
    expect(wrapper.text()).toContain("Ontem em foco: muita saída, nenhuma entrada");
    expect(wrapper.text()).toContain("Atenção");
    expect(wrapper.text()).toContain("15 min de leitura");

    // comparison cards from retro
    expect(wrapper.text()).toContain("Ontem · 20 jun");
    expect(wrapper.text()).toContain("Anteontem · 19 jun");
    expect(wrapper.text()).toContain("vs. semana passada");

    // chart beat is present (stubbed)
    expect(wrapper.find(".ui-chart-stub").exists()).toBe(true);

    // closing block + provenance
    expect(wrapper.text()).toContain("Para onde seguir agora");
    expect(wrapper.text()).toContain("GPT-4o");
  });

  it("starts in the light editorial scope", () => {
    const wrapper = mountFluida();
    expect(wrapper.find(".fluida").attributes("data-fluida-scheme")).toBe("light");
  });

  it("flips the editorial scope when the theme button is pressed", async () => {
    const wrapper = mountFluida();
    await wrapper.find(".fluida-masthead__scheme").trigger("click");
    expect(wrapper.find(".fluida").attributes("data-fluida-scheme")).toBe("dark");
  });

  it("switches to a theme reading with highlight tiles when a tab is selected", async () => {
    const wrapper = mountFluida();

    const cardsTab = wrapper
      .findAll(".fluida-tabs__tab")
      .find((tab) => tab.text() === "Cartões");
    expect(cardsTab).toBeDefined();
    await cardsTab!.trigger("click");

    // theme lead kicker + a highlight tile value, no comparison cards
    expect(wrapper.text()).toContain("Cartões");
    expect(wrapper.text()).toContain("Fatura em atraso");
    expect(wrapper.text()).not.toContain("Ontem · 20 jun");
  });

  it("updates the reading time and chart when cadence flips to weekly", async () => {
    const wrapper = mountFluida();

    const weeklyButton = wrapper
      .findAll(".fluida-cadence__option")
      .find((button) => button.text() === "Semanal");
    await weeklyButton!.trigger("click");

    expect(wrapper.text()).toContain("30 min de leitura");
    expect(wrapper.text()).toContain("A semana de 15 a 21: o mês inteiro decidido em dois dias");
  });
});
