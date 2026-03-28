import { computed } from "vue";
import { useFiltersStore, type FilterPeriod } from "~/stores/filters";
import type { UseFiltersReturn } from "./useFilters.types";

/**
 * Composable facade over the global filters Pinia store.
 *
 * Provides a computed-only view of the current filter state alongside
 * action helpers. Components should use this composable rather than
 * calling the store directly, keeping store coupling at the composable layer.
 *
 * @returns Reactive filter state and mutation helpers.
 */
export function useFilters(): UseFiltersReturn {
  const store = useFiltersStore();

  return {
    period: computed(() => store.period),
    customStart: computed(() => store.customStart),
    customEnd: computed(() => store.customEnd),
    isCustomPeriod: computed(() => store.isCustomPeriod),
    isCustomRangeComplete: computed(() => store.isCustomRangeComplete),

    setPeriod(period: FilterPeriod): void {
      store.setPeriod(period);
    },

    setCustomRange(start: string, end: string): void {
      store.setCustomRange(start, end);
    },

    reset(): void {
      store.reset();
    },
  };
}
