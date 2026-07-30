import { nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NetWorthTimeline from "./NetWorthTimeline.vue";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";
import type { ResolvedTheme } from "~/theme/tokens/semantic";
import { buildChartThemeTokens } from "~/utils/chart-theme";

vi.mock("~/components/ui/UiChart.vue", () => ({
  default: {
    name: "UiChart",
    props: ["option", "height", "updateKey"],
    template: "<div class=\"stub-ui-chart\" />",
  },
}));

const resolvedTheme = ref<ResolvedTheme>("light");

vi.mock("~/composables/useTheme", () => ({
  useTheme: (): { resolvedTheme: typeof resolvedTheme } => ({ resolvedTheme }),
}));

const goals: GoalDto[] = [
  {
    id: "goal-1",
    name: "Reserva de emergência",
    description: null,
    target_amount: 30000,
    current_amount: 12000,
    target_date: "2026-12-31",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
  },
];

/**
 * Mounts the timeline with deterministic props.
 *
 * @returns Mounted wrapper.
 */
const mountTimeline = (): ReturnType<typeof mount> =>
  mount(NetWorthTimeline, {
    props: {
      currentNetWorth: 100000,
      investedAmount: 86000,
      goals,
      anchorDate: "2026-05-01",
    },
  });

describe("NetWorthTimeline", () => {
  beforeEach(() => {
    resolvedTheme.value = "light";
  });

  it("renders horizon toggles for 12, 24 and 60 months", () => {
    const wrapper = mountTimeline();

    expect(wrapper.get("button[data-horizon='12']").text()).toContain("12m");
    expect(wrapper.get("button[data-horizon='24']").classes()).toContain("is-active");
    expect(wrapper.get("button[data-horizon='60']").text()).toContain("60m");
  });

  it("renders actual series as solid and future projections as dotted lines", () => {
    const wrapper = mountTimeline();
    const chart = wrapper.getComponent({ name: "UiChart" });
    const option = chart.props("option") as {
      series: Array<{ name: string; lineStyle?: { type?: string } }>;
    };

    expect(option.series.find((serie) => serie.name === "Patrimônio real")?.lineStyle?.type).toBe("solid");
    expect(option.series.find((serie) => serie.name === "Cenário base")?.lineStyle?.type).toBe("dashed");
  });

  it("updates the chart when the user selects a longer horizon", async () => {
    const wrapper = mountTimeline();

    await wrapper.get("button[data-horizon='60']").trigger("click");

    expect(wrapper.get("button[data-horizon='60']").classes()).toContain("is-active");
    expect(wrapper.getComponent({ name: "UiChart" }).props("updateKey")).toBe("60");
  });

  it("paints the chart with the light palette when the app is in light mode", () => {
    const tokens = buildChartThemeTokens("light");
    const wrapper = mountTimeline();
    const option = wrapper.getComponent({ name: "UiChart" }).props("option") as {
      color: string[];
      tooltip: { backgroundColor: string };
      series: Array<{ name: string; itemStyle?: { color?: string } }>;
    };

    expect(option.color).toEqual([
      tokens.axis,
      tokens.income,
      tokens.balance,
      tokens.debt,
    ]);
    expect(option.tooltip.backgroundColor).toBe(tokens.tooltipBackground);
    expect(option.series.find((serie) => serie.name === "Cenário base")?.itemStyle?.color)
      .toBe(tokens.balance);
  });

  it("repaints when the theme switches to dark", async () => {
    const wrapper = mountTimeline();
    const chart = wrapper.getComponent({ name: "UiChart" });
    const lightColors = (chart.props("option") as { color: string[] }).color;

    resolvedTheme.value = "dark";
    await nextTick();

    const darkTokens = buildChartThemeTokens("dark");
    const darkColors = (chart.props("option") as { color: string[] }).color;

    expect(darkColors).toEqual([
      darkTokens.axis,
      darkTokens.income,
      darkTokens.balance,
      darkTokens.debt,
    ]);
    expect(darkColors).not.toEqual(lightColors);
  });
});
