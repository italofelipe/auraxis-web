import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useFiltersStore } from "./filters";

describe("useFiltersStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("has correct initial state", () => {
    const store = useFiltersStore();
    expect(store.period).toBe("current_month");
    expect(store.customStart).toBe("");
    expect(store.customEnd).toBe("");
  });

  describe("getters", () => {
    it("isCustomPeriod is false by default", () => {
      expect(useFiltersStore().isCustomPeriod).toBe(false);
    });

    it("isCustomPeriod is true when period is custom", () => {
      const store = useFiltersStore();
      store.setPeriod("custom");
      expect(store.isCustomPeriod).toBe(true);
    });

    it("isCustomRangeComplete is false when not custom period", () => {
      const store = useFiltersStore();
      store.setPeriod("3m");
      expect(store.isCustomRangeComplete).toBe(false);
    });

    it("isCustomRangeComplete is false when custom but dates missing", () => {
      const store = useFiltersStore();
      store.setPeriod("custom");
      expect(store.isCustomRangeComplete).toBe(false);
    });

    it("isCustomRangeComplete is false when only start is set", () => {
      const store = useFiltersStore();
      store.setCustomRange("2025-01-01", "");
      expect(store.isCustomRangeComplete).toBe(false);
    });

    it("isCustomRangeComplete is true when both dates are set", () => {
      const store = useFiltersStore();
      store.setCustomRange("2025-01-01", "2025-01-31");
      expect(store.isCustomRangeComplete).toBe(true);
    });
  });

  describe("setPeriod", () => {
    it("updates the period", () => {
      const store = useFiltersStore();
      store.setPeriod("3m");
      expect(store.period).toBe("3m");
    });

    it("clears custom range when switching away from custom", () => {
      const store = useFiltersStore();
      store.setCustomRange("2025-01-01", "2025-01-31");
      store.setPeriod("6m");
      expect(store.customStart).toBe("");
      expect(store.customEnd).toBe("");
    });

    it("does not clear custom range when setting period to custom", () => {
      const store = useFiltersStore();
      store.setPeriod("custom");
      // Range should remain empty (not cleared)
      expect(store.customStart).toBe("");
      expect(store.customEnd).toBe("");
    });
  });

  describe("setCustomRange", () => {
    it("sets start, end and switches period to custom", () => {
      const store = useFiltersStore();
      store.setCustomRange("2025-03-01", "2025-03-31");
      expect(store.period).toBe("custom");
      expect(store.customStart).toBe("2025-03-01");
      expect(store.customEnd).toBe("2025-03-31");
    });

    it("overwrites an existing custom range", () => {
      const store = useFiltersStore();
      store.setCustomRange("2025-01-01", "2025-01-31");
      store.setCustomRange("2025-06-01", "2025-06-30");
      expect(store.customStart).toBe("2025-06-01");
      expect(store.customEnd).toBe("2025-06-30");
    });
  });

  describe("reset", () => {
    it("restores initial state", () => {
      const store = useFiltersStore();
      store.setCustomRange("2025-01-01", "2025-12-31");
      store.reset();
      expect(store.period).toBe("current_month");
      expect(store.customStart).toBe("");
      expect(store.customEnd).toBe("");
    });
  });
});
