import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import UiChart from "../UiChart.vue";
import type { EChartsOption } from "echarts";

// Mock all echarts dynamic imports so defineAsyncComponent resolves synchronously
vi.mock("echarts/core", () => ({
  use: vi.fn(),
}));
vi.mock("echarts/renderers", () => ({
  CanvasRenderer: {},
}));
vi.mock("echarts/charts", () => ({
  LineChart: {},
  BarChart: {},
  PieChart: {},
  GaugeChart: {},
}));
vi.mock("echarts/components", () => ({
  GridComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
  TitleComponent: {},
  DataZoomComponent: {},
}));
vi.mock("vue-echarts", () => ({
  default: {
    name: "VChart",
    props: ["option", "theme", "autoresize", "style"],
    template: "<div class=\"mock-vchart\" />",
  },
}));

const mockOption: EChartsOption = {
  xAxis: { type: "category", data: ["Jan", "Fev", "Mar"] },
  yAxis: { type: "value" },
  series: [{ type: "line", data: [100, 200, 150] }],
};

/**
 * Helper: mount UiChart and wait for the async VChart to resolve.
 *
 * @param props - Additional props to pass to UiChart.
 * @returns Mounted wrapper after promises flush.
 */
async function mountChart(props: Record<string, unknown> = {}): Promise<VueWrapper> {
  const wrapper = mount(UiChart, {
    props: { option: mockOption, ...props },
    global: {
      stubs: { ClientOnly: { template: "<slot />" } },
    },
  });
  await flushPromises();
  return wrapper;
}

describe("UiChart", () => {
  it("renders without crashing", async () => {
    const wrapper = await mountChart();
    expect(wrapper.exists()).toBe(true);
  });

  it("applies default height and width", async () => {
    const wrapper = await mountChart();
    const chart = wrapper.findComponent({ name: "VChart" });
    expect(chart.props("style")).toMatchObject({ height: "300px", width: "100%" });
  });

  it("accepts custom height and width", async () => {
    const wrapper = await mountChart({ height: "400px", width: "50%" });
    const chart = wrapper.findComponent({ name: "VChart" });
    expect(chart.props("style")).toMatchObject({ height: "400px", width: "50%" });
  });

  it("passes option to VChart", async () => {
    const wrapper = await mountChart();
    const chart = wrapper.findComponent({ name: "VChart" });
    expect(chart.props("option")).toEqual(mockOption);
  });

  it("autoresize is true by default", async () => {
    const wrapper = await mountChart();
    const chart = wrapper.findComponent({ name: "VChart" });
    expect(chart.props("autoresize")).toBe(true);
  });

  it("renders skeleton fallback via ClientOnly slot", () => {
    const wrapper = mount(UiChart, {
      props: { option: mockOption },
      global: {
        stubs: {
          ClientOnly: { template: "<slot name='fallback' />" },
        },
      },
    });
    expect(wrapper.find(".ui-chart--skeleton").exists()).toBe(true);
  });
});
