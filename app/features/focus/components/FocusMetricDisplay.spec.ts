import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import FocusMetricDisplay from "./FocusMetricDisplay.vue";
import type { FocusMetric } from "../model/focus-metric";

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string) => string; n: (v: number, opts?: unknown) => string } => ({
    t: (k) => k,
    n: (v: number, opts?: unknown): string => {
      if (opts && typeof opts === "object" && "style" in opts && (opts as { style: string }).style === "currency") {
        return `R$ ${Math.round(v)}`;
      }
      return String(v);
    },
  }),
}));

/**
 * Builds a FocusMetric fixture with sensible defaults, overridable per test.
 *
 * @param overrides Partial overrides applied on top of the default fixture.
 * @returns A fully-populated FocusMetric for mounting the display component.
 */
function makeMetric(overrides: Partial<FocusMetric> = {}): FocusMetric {
  return {
    id: "monthlyBurnRate",
    value: 3200,
    unit: "currency",
    labelKey: "focus.metrics.monthlyBurnRate.label",
    captionKey: "focus.metrics.monthlyBurnRate.caption",
    trend: { delta: -8, percent: -8, direction: "down" },
    unavailable: false,
    ...overrides,
  };
}

describe("FocusMetricDisplay", () => {
  it("renders a loading label when isLoading is true", () => {
    const wrapper = mount(FocusMetricDisplay, {
      props: { metric: makeMetric(), isLoading: true },
    });
    expect(wrapper.find(".focus-metric__loading").exists()).toBe(true);
    expect(wrapper.find("[data-testid='focus-metric-value']").exists()).toBe(false);
  });

  it("formats currency values via useI18n n()", () => {
    const wrapper = mount(FocusMetricDisplay, {
      props: { metric: makeMetric() },
    });
    const value = wrapper.get("[data-testid='focus-metric-value']");
    expect(value.text()).toContain("R$");
    expect(value.text()).toContain("3200");
  });

  it("renders em dash for unavailable metrics", () => {
    const wrapper = mount(FocusMetricDisplay, {
      props: { metric: makeMetric({ unavailable: true, trend: null }) },
    });
    expect(wrapper.get("[data-testid='focus-metric-value']").text()).toBe("—");
    expect(wrapper.find(".focus-metric__unavailable").exists()).toBe(true);
  });

  it("formats percent values with % suffix", () => {
    const wrapper = mount(FocusMetricDisplay, {
      props: { metric: makeMetric({ unit: "percent", value: 42 }) },
    });
    expect(wrapper.get("[data-testid='focus-metric-value']").text()).toBe("42%");
  });

  it("renders days suffix when unit is days", () => {
    const wrapper = mount(FocusMetricDisplay, {
      props: { metric: makeMetric({ unit: "days", value: 10, trend: null }) },
    });
    expect(wrapper.find(".focus-metric__suffix").exists()).toBe(true);
  });

  it("shows a trend chip with the percentage when a trend is present", () => {
    const wrapper = mount(FocusMetricDisplay, {
      props: { metric: makeMetric() },
    });
    const trend = wrapper.get("[data-testid='focus-metric-trend']");
    expect(trend.text()).toContain("8%");
    expect(trend.classes()).toContain("focus-metric__trend--down");
  });

  it("hides the trend chip when trend is null", () => {
    const wrapper = mount(FocusMetricDisplay, {
      props: { metric: makeMetric({ trend: null }) },
    });
    expect(wrapper.find("[data-testid='focus-metric-trend']").exists()).toBe(false);
  });
});
