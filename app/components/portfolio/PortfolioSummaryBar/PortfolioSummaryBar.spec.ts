import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NStatistic } from "naive-ui";

import PortfolioSummaryBar from "./PortfolioSummaryBar.vue";
import type { PortfolioSummaryDto } from "~/features/portfolio/contracts/portfolio.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockSummary: PortfolioSummaryDto = {
  total_value: 100290,
  total_cost: 86600,
  day_change_percent: 0.84,
  total_return_percent: 15.81,
  asset_count: 7,
};

/**
 * Mounts PortfolioSummaryBar with Naive UI components rendered in happy-dom.
 *
 * @param summary - Portfolio summary data or null.
 * @param loading - Optional loading state.
 * @returns VueWrapper around the mounted component.
 */
function mountBar(
  summary: PortfolioSummaryDto | null,
  loading = false,
): ReturnType<typeof mount> {
  return mount(PortfolioSummaryBar, { props: { summary, loading } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PortfolioSummaryBar", () => {
  it("renders 4 statistics when data is provided", () => {
    const wrapper = mountBar(mockSummary);
    expect(wrapper.findAllComponents(NStatistic)).toHaveLength(4);
  });

  it("shows 4 skeleton elements when loading is true", () => {
    const wrapper = mountBar(mockSummary, true);
    expect(wrapper.findAll("[data-testid='base-skeleton']")).toHaveLength(4);
    expect(wrapper.findAllComponents(NStatistic)).toHaveLength(0);
  });

  it("shows N/A for all values when summary is null", () => {
    const wrapper = mountBar(null);
    expect(wrapper.text()).toContain("N/A");
    const statistics = wrapper.findAllComponents(NStatistic);
    expect(statistics.length).toBeGreaterThan(0);
    statistics.forEach((stat) => {
      expect(stat.props("value")).toBe("N/A");
    });
  });

  it("shows N/A for percent values when they are null", () => {
    const wrapper = mountBar({
      ...mockSummary,
      day_change_percent: null,
      total_return_percent: null,
    });
    const statistics = wrapper.findAllComponents(NStatistic);
    const naStats = statistics.filter((s) => s.props("value") === "N/A");
    expect(naStats).toHaveLength(2);
  });

  it("renders formatted currency for total_value", () => {
    const wrapper = mountBar(mockSummary);
    expect(wrapper.text()).toContain("R$");
  });

  it("renders positive percentage with + sign", () => {
    const wrapper = mountBar({ ...mockSummary, total_return_percent: 15.81 });
    expect(wrapper.text()).toContain("+15.81%");
  });
});
