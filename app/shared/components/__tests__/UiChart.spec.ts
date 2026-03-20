import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import UiChart from "../UiChart.vue";
import type { EChartsOption } from "echarts";

// Mock vue-echarts para evitar dependência de DOM/canvas em testes unitários
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

describe("UiChart", () => {
  it("renders without crashing", () => {
    const wrapper = mount(UiChart, {
      props: { option: mockOption },
      global: {
        stubs: { ClientOnly: { template: "<slot />" } },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("applies default height and width", () => {
    const wrapper = mount(UiChart, {
      props: { option: mockOption },
      global: {
        stubs: { ClientOnly: { template: "<slot />" } },
      },
    });
    const chart = wrapper.findComponent({ name: "VChart" });
    expect(chart.props("style")).toMatchObject({ height: "300px", width: "100%" });
  });

  it("accepts custom height and width", () => {
    const wrapper = mount(UiChart, {
      props: { option: mockOption, height: "400px", width: "50%" },
      global: {
        stubs: { ClientOnly: { template: "<slot />" } },
      },
    });
    const chart = wrapper.findComponent({ name: "VChart" });
    expect(chart.props("style")).toMatchObject({ height: "400px", width: "50%" });
  });

  it("passes option to VChart", () => {
    const wrapper = mount(UiChart, {
      props: { option: mockOption },
      global: {
        stubs: { ClientOnly: { template: "<slot />" } },
      },
    });
    const chart = wrapper.findComponent({ name: "VChart" });
    expect(chart.props("option")).toEqual(mockOption);
  });

  it("autoresize is true by default", () => {
    const wrapper = mount(UiChart, {
      props: { option: mockOption },
      global: {
        stubs: { ClientOnly: { template: "<slot />" } },
      },
    });
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
