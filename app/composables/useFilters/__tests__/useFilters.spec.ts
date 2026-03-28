import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useFilters } from "../useFilters";

describe("useFilters", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("exposes initial state from the store", () => {
    const filters = useFilters();
    expect(filters.period.value).toBe("current_month");
    expect(filters.customStart.value).toBe("");
    expect(filters.customEnd.value).toBe("");
    expect(filters.isCustomPeriod.value).toBe(false);
    expect(filters.isCustomRangeComplete.value).toBe(false);
  });

  it("setPeriod updates period", () => {
    const filters = useFilters();
    filters.setPeriod("3m");
    expect(filters.period.value).toBe("3m");
  });

  it("setPeriod clears custom range when not custom", () => {
    const filters = useFilters();
    filters.setCustomRange("2025-01-01", "2025-01-31");
    filters.setPeriod("12m");
    expect(filters.customStart.value).toBe("");
    expect(filters.customEnd.value).toBe("");
  });

  it("setCustomRange sets range and switches to custom period", () => {
    const filters = useFilters();
    filters.setCustomRange("2025-06-01", "2025-06-30");
    expect(filters.period.value).toBe("custom");
    expect(filters.customStart.value).toBe("2025-06-01");
    expect(filters.customEnd.value).toBe("2025-06-30");
    expect(filters.isCustomPeriod.value).toBe(true);
    expect(filters.isCustomRangeComplete.value).toBe(true);
  });

  it("reset restores defaults", () => {
    const filters = useFilters();
    filters.setCustomRange("2025-01-01", "2025-12-31");
    filters.reset();
    expect(filters.period.value).toBe("current_month");
    expect(filters.customStart.value).toBe("");
    expect(filters.isCustomRangeComplete.value).toBe(false);
  });

  it("state is shared between multiple useFilters instances", () => {
    const a = useFilters();
    const b = useFilters();
    a.setPeriod("6m");
    expect(b.period.value).toBe("6m");
  });
});
