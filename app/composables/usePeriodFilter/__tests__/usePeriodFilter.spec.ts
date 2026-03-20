import { describe, it, expect } from "vitest";
import { usePeriodFilter, PERIOD_OPTIONS } from "../usePeriodFilter";

describe("usePeriodFilter", () => {
  it("default period is \"month\"", () => {
    const { selectedPeriod } = usePeriodFilter();
    expect(selectedPeriod.value).toBe("month");
  });

  it("setPeriod changes selectedPeriod", () => {
    const { selectedPeriod, setPeriod } = usePeriodFilter();
    setPeriod("year");
    expect(selectedPeriod.value).toBe("year");
  });

  it("isSelected returns true for current period", () => {
    const { isSelected } = usePeriodFilter("week");
    expect(isSelected("week")).toBe(true);
  });

  it("isSelected returns false for other periods", () => {
    const { isSelected } = usePeriodFilter("week");
    expect(isSelected("month")).toBe(false);
  });

  it("PERIOD_OPTIONS has 5 entries", () => {
    expect(PERIOD_OPTIONS).toHaveLength(5);
  });

  it("custom initial period respected", () => {
    const { selectedPeriod } = usePeriodFilter("quarter");
    expect(selectedPeriod.value).toBe("quarter");
  });
});
