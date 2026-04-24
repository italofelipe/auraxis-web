import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardCashflowTimeline from "../DashboardCashflowTimeline.vue";
import type { DashboardTimeseriesPoint } from "~/features/dashboard/model/dashboard-overview";

const UiChartStub = defineComponent({
  name: "UiChart",
  props: ["option", "updateKey", "height"],
  template: "<div class=\"ui-chart-stub\" :data-update-key=\"updateKey\" />",
});

const UiChartPanelStub = defineComponent({
  name: "UiChartPanel",
  props: ["title", "subtitle", "loading", "chartHeight"],
  template: `
    <div class="ui-chart-panel-stub" :data-loading="loading" :data-title="title">
      <slot v-if="!loading" />
    </div>
  `,
});

const UiEmptyStateStub = defineComponent({
  name: "UiEmptyState",
  props: ["icon", "title", "description", "compact"],
  template: "<div class=\"ui-empty-state-stub\" :data-title=\"title\" />",
});

const stubs = {
  UiChart: UiChartStub,
  UiChartPanel: UiChartPanelStub,
  UiEmptyState: UiEmptyStateStub,
};

const mockPoints: DashboardTimeseriesPoint[] = [
  { date: "2026-04-01", income: 1000, expense: 400, balance: 600 },
  { date: "2026-04-02", income: 200, expense: 150, balance: 650 },
  { date: "2026-04-03", income: 0, expense: 300, balance: 350 },
];

/**
 * Mounts DashboardCashflowTimeline with child stubs.
 *
 * @param points Daily timeseries points to render.
 * @param loading Whether the parent query is still loading.
 * @returns VueWrapper around the mounted component.
 */
function mountChart(
  points: DashboardTimeseriesPoint[],
  loading = false,
): ReturnType<typeof mount> {
  return mount(DashboardCashflowTimeline, {
    props: { points, loading },
    global: { stubs },
  });
}

describe("DashboardCashflowTimeline", () => {
  it("passes loading=true to UiChartPanel", () => {
    const wrapper = mountChart([], true);
    expect(wrapper.find(".ui-chart-panel-stub").attributes("data-loading")).toBe("true");
  });

  it("renders empty state when no points and not loading", () => {
    const wrapper = mountChart([], false);
    expect(wrapper.find(".ui-empty-state-stub").exists()).toBe(true);
    expect(wrapper.find(".ui-chart-stub").exists()).toBe(false);
  });

  it("renders UiChart when points are provided", () => {
    const wrapper = mountChart(mockPoints);
    expect(wrapper.find(".ui-chart-stub").exists()).toBe(true);
    expect(wrapper.find(".ui-empty-state-stub").exists()).toBe(false);
  });

  it("uses points length as update key", () => {
    const wrapper = mountChart(mockPoints);
    expect(wrapper.find(".ui-chart-stub").attributes("data-update-key")).toBe("3");
  });

  it("does not render UiChart while loading, even with data", () => {
    const wrapper = mountChart(mockPoints, true);
    expect(wrapper.find(".ui-chart-stub").exists()).toBe(false);
  });
});
