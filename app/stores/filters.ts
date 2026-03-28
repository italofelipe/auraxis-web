import { defineStore } from "pinia";

/** Supported quick-select period keys. */
export type FilterPeriod =
  | "current_month"
  | "last_month"
  | "1m"
  | "3m"
  | "6m"
  | "12m"
  | "custom";

interface FiltersState {
  /** Active period selection. */
  period: FilterPeriod;
  /** Start date for the custom range (ISO date string YYYY-MM-DD or empty string). */
  customStart: string;
  /** End date for the custom range (ISO date string YYYY-MM-DD or empty string). */
  customEnd: string;
}

/**
 * Store for global filter state shared across dashboard and feature pages.
 *
 * Centralises period and custom-range selection so that navigating between
 * pages preserves the last used filter without prop-drilling or URL sync.
 */
export const useFiltersStore = defineStore("filters", {
  state: (): FiltersState => ({
    period: "current_month",
    customStart: "",
    customEnd: "",
  }),

  getters: {
    /**
     * Whether the currently selected period is the free-form custom range.
     * @param state - Current filters state.
     * @returns True when period is "custom".
     */
    isCustomPeriod: (state): boolean => state.period === "custom",

    /**
     * Whether the custom range has both start and end dates filled in.
     * Always false when the period is not "custom".
     * @param state - Current filters state.
     * @returns True when both customStart and customEnd are non-empty strings.
     */
    isCustomRangeComplete: (state): boolean =>
      state.period === "custom" &&
      state.customStart.length > 0 &&
      state.customEnd.length > 0,
  },

  actions: {
    /**
     * Sets the active period.
     * Clears the custom range when switching away from "custom".
     * @param period - New period key.
     */
    setPeriod(period: FilterPeriod): void {
      this.period = period;
      if (period !== "custom") {
        this.customStart = "";
        this.customEnd = "";
      }
    },

    /**
     * Sets the custom date range and switches the period to "custom".
     * @param start - ISO date string for the start date.
     * @param end - ISO date string for the end date.
     */
    setCustomRange(start: string, end: string): void {
      this.period = "custom";
      this.customStart = start;
      this.customEnd = end;
    },

    /** Resets all filters to their initial values. */
    reset(): void {
      this.period = "current_month";
      this.customStart = "";
      this.customEnd = "";
    },
  },
});
