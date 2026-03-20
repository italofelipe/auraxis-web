import { describe, expect, it } from "vitest";

import {
  PERIOD_OPTIONS,
  type DashboardPeriod,
  type PeriodOption,
} from "~/features/dashboard/model/dashboard-period";

describe("dashboard-period model", () => {
  it("exports exactly four non-custom period options", () => {
    expect(PERIOD_OPTIONS).toHaveLength(4);
  });

  it("includes 1m, 3m, 6m and 12m values", () => {
    const values = PERIOD_OPTIONS.map((o) => o.value);
    expect(values).toContain("1m");
    expect(values).toContain("3m");
    expect(values).toContain("6m");
    expect(values).toContain("12m");
  });

  it("does not include custom in the preset list", () => {
    const values = PERIOD_OPTIONS.map((o) => o.value);
    expect(values).not.toContain("custom");
  });

  it("every option has a non-empty label", () => {
    for (const option of PERIOD_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("satisfies the PeriodOption interface shape", () => {
    const sample: PeriodOption = PERIOD_OPTIONS[0] as PeriodOption;
    expect(typeof sample.label).toBe("string");
    expect(typeof sample.value).toBe("string");
  });

  it("DashboardPeriod type covers expected presets", () => {
    const validPeriods: DashboardPeriod[] = ["1m", "3m", "6m", "12m", "custom"];
    expect(validPeriods).toHaveLength(5);
  });
});
