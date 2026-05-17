import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import NetWorthTimeline from "./NetWorthTimeline.vue";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

vi.mock("~/components/ui/UiChart.vue", () => ({
  default: {
    name: "UiChart",
    props: ["option", "height", "updateKey"],
    template: "<div class=\"stub-ui-chart\" />",
  },
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
});
