import { describe, expect, it } from "vitest";

import type { ChartThemeTokens } from "~/utils/chart-theme";
import {
  buildBarOption,
  buildMultiLineOption,
  formatCompactInt,
  formatGeneratedAt,
  formatLatency,
  formatMetricInt,
  formatMetricPct,
  formatShortDate,
  formatUsd,
  isActiveSourceProxy,
  metricsDateRange,
  percentOf,
  seriesDateLabels,
  seriesValues,
  type AdminMetricsTimeseries,
} from "./admin-metrics";

const tokens: ChartThemeTokens = {
  axis: "#5D6F89",
  background: "transparent",
  balance: "#087FA7",
  border: "#D8E3EF",
  debt: "#B7791F",
  expense: "#C2414D",
  grid: "#D8E3EF",
  income: "#087F5B",
  investment: "#6F62E2",
  mutedText: "#5D6F89",
  pieBorder: "#FFFFFF",
  primaryText: "#0A1628",
  series: ["#087FA7", "#087F5B", "#6F62E2", "#C2414D", "#B7791F", "#0A94BF"],
  tooltipBackground: "#FFFFFF",
  tooltipBorder: "#087FA7",
  tooltipText: "#0A1628",
};

const usersSeries: AdminMetricsTimeseries = {
  block: "users",
  interval: "day",
  points: [
    { date: "2026-07-01", values: { signups: 2, active_users: 4 } },
    { date: "2026-07-02", values: { signups: 0, active_users: 5 } },
    { date: "2026-07-03", values: { active_users: 6 } },
  ],
};

describe("isActiveSourceProxy", () => {
  it("detects the refresh-tokens proxy source", () => {
    expect(isActiveSourceProxy("refresh_tokens_proxy")).toBe(true);
  });

  it("returns false for a first-party events source", () => {
    expect(isActiveSourceProxy("analytics_events")).toBe(false);
  });
});

describe("metricsDateRange", () => {
  it("builds an inclusive UTC window ending at the reference date", () => {
    const reference = new Date("2026-07-24T15:30:00Z");

    expect(metricsDateRange(reference, 30)).toEqual({
      from: "2026-06-25",
      to: "2026-07-24",
    });
  });

  it("crosses month boundaries backwards", () => {
    const reference = new Date("2026-03-02T00:00:00Z");

    expect(metricsDateRange(reference, 7)).toEqual({
      from: "2026-02-24",
      to: "2026-03-02",
    });
  });
});

describe("percentOf", () => {
  it("computes the percentage share of a total", () => {
    expect(percentOf(30, 42)).toBeCloseTo(71.4, 1);
  });

  it("returns null when the total is zero", () => {
    expect(percentOf(5, 0)).toBeNull();
  });
});

describe("series helpers", () => {
  it("formats ISO dates as dd/mm labels", () => {
    expect(formatShortDate("2026-07-01")).toBe("01/07");
  });

  it("maps timeseries points to dd/mm labels", () => {
    expect(seriesDateLabels(usersSeries)).toEqual(["01/07", "02/07", "03/07"]);
  });

  it("extracts one metric across points, defaulting missing keys to zero", () => {
    expect(seriesValues(usersSeries, "signups")).toEqual([2, 0, 0]);
    expect(seriesValues(usersSeries, "active_users")).toEqual([4, 5, 6]);
  });
});

describe("formatters", () => {
  it("formats integers with pt-BR grouping", () => {
    expect(formatMetricInt(45000)).toBe("45.000");
  });

  it("formats large counters compactly in pt-BR", () => {
    // Intl separates value and unit with a non-breaking space.
    expect(formatCompactInt(45000)).toBe("45\u00A0mil");
  });

  it("formats USD amounts with the pt-BR locale", () => {
    expect(formatUsd(1.23)).toBe("US$\u00A01,23");
  });

  it("formats percentage points with one decimal", () => {
    expect(formatMetricPct(13.3)).toBe("13,3%");
  });

  it("formats latency in milliseconds", () => {
    expect(formatLatency(900)).toBe("900 ms");
  });

  it("formats the overview generation timestamp as a pt-BR time", () => {
    expect(formatGeneratedAt("2026-07-24T18:04:00Z")).toMatch(/\d{2}:\d{2}/);
  });

  it("returns an empty string for an invalid generation timestamp", () => {
    expect(formatGeneratedAt("not-a-date")).toBe("");
  });
});

describe("buildMultiLineOption", () => {
  const option = buildMultiLineOption({
    labels: ["01/07", "02/07"],
    series: [
      { name: "Cadastros", values: [2, 0], color: "#087FA7" },
      { name: "Ativos", values: [4, 5], color: "#6F62E2" },
    ],
    tokens,
  });

  it("renders every series as a 2px line with surface-ringed markers", () => {
    const series = option.series as Array<Record<string, unknown>>;

    expect(series).toHaveLength(2);
    for (const line of series) {
      expect(line.type).toBe("line");
      expect((line.lineStyle as { width: number }).width).toBe(2);
      expect(line.symbolSize).toBeGreaterThanOrEqual(8);
      const itemStyle = line.itemStyle as { borderColor: string; borderWidth: number };
      expect(itemStyle.borderColor).toBe(tokens.pieBorder);
      expect(itemStyle.borderWidth).toBe(2);
    }
  });

  it("keeps the legend visible for two series", () => {
    expect((option.legend as { show: boolean }).show).toBe(true);
  });

  it("uses solid hairline gridlines from the theme", () => {
    const yAxis = option.yAxis as { splitLine: { lineStyle: { type: string; color: string } } };

    expect(yAxis.splitLine.lineStyle.type).toBe("solid");
    expect(yAxis.splitLine.lineStyle.color).toBe(tokens.grid);
  });

  it("assigns the provided category labels", () => {
    expect((option.xAxis as { data: string[] }).data).toEqual(["01/07", "02/07"]);
  });

  it("locks the value axis to integer steps for count series", () => {
    const counts = buildMultiLineOption({
      labels: ["01/07"],
      series: [{ name: "Cadastros", values: [1], color: "#087FA7" }],
      tokens,
      integerAxis: true,
    });

    expect((counts.yAxis as { minInterval?: number }).minInterval).toBe(1);
    expect((option.yAxis as { minInterval?: number }).minInterval).toBeUndefined();
  });
});

describe("buildBarOption", () => {
  const option = buildBarOption({
    labels: ["01/07", "02/07"],
    name: "Transações",
    values: [10, 12],
    color: "#087FA7",
    tokens,
    valueFormatter: (value: number) => `${value}`,
  });

  it("renders a single thin bar series with rounded data ends", () => {
    const series = option.series as Array<Record<string, unknown>>;

    expect(series).toHaveLength(1);
    expect(series[0]?.type).toBe("bar");
    expect(series[0]?.barMaxWidth).toBeLessThanOrEqual(24);
    const itemStyle = series[0]?.itemStyle as { borderRadius: number[]; color: string };
    expect(itemStyle.borderRadius).toEqual([4, 4, 0, 0]);
    expect(itemStyle.color).toBe("#087FA7");
  });

  it("omits the legend for a single series", () => {
    expect(option.legend).toBeUndefined();
  });

  it("uses solid hairline gridlines from the theme", () => {
    const yAxis = option.yAxis as { splitLine: { lineStyle: { type: string } } };

    expect(yAxis.splitLine.lineStyle.type).toBe("solid");
  });

  it("locks the value axis to integer steps for count series", () => {
    const counts = buildBarOption({
      labels: ["01/07"],
      name: "Transações",
      values: [3],
      color: "#087FA7",
      tokens,
      integerAxis: true,
    });

    expect((counts.yAxis as { minInterval?: number }).minInterval).toBe(1);
    expect((option.yAxis as { minInterval?: number }).minInterval).toBeUndefined();
  });
});
