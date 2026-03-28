import type { ComputedRef } from "vue";
import type { FilterPeriod } from "~/stores/filters";

/** Return type of the useFilters composable. */
export interface UseFiltersReturn {
  /** Currently active period key. */
  period: ComputedRef<FilterPeriod>;
  /** Start date for the custom range (empty string when unset). */
  customStart: ComputedRef<string>;
  /** End date for the custom range (empty string when unset). */
  customEnd: ComputedRef<string>;
  /** Whether the current period is the free-form custom range. */
  isCustomPeriod: ComputedRef<boolean>;
  /** Whether both custom range dates are set. */
  isCustomRangeComplete: ComputedRef<boolean>;
  /** Updates the active period. Clears custom dates when not "custom". */
  setPeriod: (period: FilterPeriod) => void;
  /** Sets a custom range and switches period to "custom". */
  setCustomRange: (start: string, end: string) => void;
  /** Resets all filters to defaults. */
  reset: () => void;
}
