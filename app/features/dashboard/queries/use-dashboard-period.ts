import { ref, type Ref } from "vue";

import type { DashboardPeriod } from "~/features/dashboard/model/dashboard-period";

export interface UseDashboardPeriod {
  readonly selectedPeriod: Ref<DashboardPeriod>;
  /** Updates the active period, triggering any reactive dependents. */
  setPeriod: (period: DashboardPeriod) => void;
}

/**
 * Manages the currently selected dashboard period.
 *
 * @returns Reactive period state and setter.
 */
export const useDashboardPeriod = (): UseDashboardPeriod => {
  const selectedPeriod = ref<DashboardPeriod>("1m");

  /**
   * Sets the active dashboard period.
   *
   * @param period The period preset to activate.
   * @returns void
   */
  const setPeriod = (period: DashboardPeriod): void => {
    selectedPeriod.value = period;
  };

  return { selectedPeriod, setPeriod };
};
