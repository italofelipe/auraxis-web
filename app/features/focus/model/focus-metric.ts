/**
 * Focus Mode metric catalog.
 *
 * Each metric represents one "number that matters" the user can pin as the
 * single focus of the dedicated `/focus` page. The UI shows one at a time;
 * the selection persists in localStorage.
 */

export const FOCUS_METRIC_IDS = [
  "daysUntilPrimaryGoal",
  "monthlyBurnRate",
  "freeBalanceAfterFixed",
  "primaryGoalProgress",
  "savingsVsPreviousMonth",
] as const;

export type FocusMetricId = (typeof FOCUS_METRIC_IDS)[number];

export type FocusMetricUnit = "days" | "currency" | "percent";

export type FocusMetricTrendDirection = "up" | "down" | "flat";

export interface FocusMetricTrend {
  /** Signed change vs. the previous reference point, in the metric's native unit. */
  readonly delta: number;
  /** Percentage change vs. the previous reference point, when meaningful. */
  readonly percent: number | null;
  readonly direction: FocusMetricTrendDirection;
}

export interface FocusMetric {
  readonly id: FocusMetricId;
  readonly value: number;
  readonly unit: FocusMetricUnit;
  /** Stable i18n key under `focus.metrics.<id>`. */
  readonly labelKey: string;
  /** Subtitle / hint i18n key, optional. */
  readonly captionKey?: string;
  readonly trend: FocusMetricTrend | null;
  /**
   * `true` when the metric cannot be computed with the current data
   * (e.g. no primary goal set). UI renders a helper instead of the number.
   */
  readonly unavailable: boolean;
}

/** localStorage key that stores the currently selected metric id per user. */
export const FOCUS_SELECTED_METRIC_STORAGE_KEY = "auraxis:focus:selected-metric";

export const DEFAULT_FOCUS_METRIC_ID: FocusMetricId = "freeBalanceAfterFixed";
