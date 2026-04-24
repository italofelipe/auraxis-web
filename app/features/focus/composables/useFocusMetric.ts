import { computed, ref, watch, type ComputedRef, type Ref } from "vue";
import { useDashboardOverviewQuery } from "~/features/dashboard/queries/use-dashboard-overview-query";
import type { DashboardOverview, DashboardGoalSummary } from "~/features/dashboard/model/dashboard-overview";
import {
  DEFAULT_FOCUS_METRIC_ID,
  FOCUS_METRIC_IDS,
  FOCUS_SELECTED_METRIC_STORAGE_KEY,
  type FocusMetric,
  type FocusMetricId,
  type FocusMetricTrend,
  type FocusMetricUnit,
} from "../model/focus-metric";

const MS_PER_DAY = 86_400_000;

/**
 * Reads the persisted metric id, guarding against SSR and storage being unavailable.
 *
 * Returning the default when the storage read throws is deliberate: the UI must
 * always pick *some* metric, and a broken preference should never propagate to
 * a crash on a page that has no other fallback state.
 *
 * @returns The persisted metric id or the canonical default.
 */
function readPersistedMetricId(): FocusMetricId {
  if (typeof localStorage === "undefined") { return DEFAULT_FOCUS_METRIC_ID; }
  try {
    const stored = localStorage.getItem(FOCUS_SELECTED_METRIC_STORAGE_KEY);
    if (stored && (FOCUS_METRIC_IDS as readonly string[]).includes(stored)) {
      return stored as FocusMetricId;
    }
  } catch {
    return DEFAULT_FOCUS_METRIC_ID;
  }
  return DEFAULT_FOCUS_METRIC_ID;
}

/**
 * Persists the selected metric id to localStorage when available.
 *
 * @param id The metric id to persist.
 */
function persistMetricId(id: FocusMetricId): void {
  if (typeof localStorage === "undefined") { return; }
  try {
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, id);
  } catch {
    // Storage quota or privacy mode — selection simply won't persist this turn.
  }
}

/**
 * Picks the primary goal — the active one with the earliest target date.
 *
 * @param goals Dashboard goal summaries.
 * @returns The primary goal or null when none exists.
 */
function pickPrimaryGoal(goals: readonly DashboardGoalSummary[]): DashboardGoalSummary | null {
  if (goals.length === 0) { return null; }
  const active = goals.filter((g) => g.progressPercent < 100 && g.targetDate);
  if (active.length === 0) { return goals[0] ?? null; }
  active.sort((a, b) => {
    const aDate = a.targetDate ? new Date(a.targetDate).getTime() : Number.POSITIVE_INFINITY;
    const bDate = b.targetDate ? new Date(b.targetDate).getTime() : Number.POSITIVE_INFINITY;
    return aDate - bDate;
  });
  return active[0] ?? null;
}

/**
 * Computes whole-day distance between now and an ISO target date, floored at 0.
 *
 * @param targetIso Target date in ISO-8601 format.
 * @returns Non-negative integer of days until the target.
 */
function daysBetween(targetIso: string): number {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / MS_PER_DAY));
}

/**
 * Resolves the trend direction for a signed numeric value.
 *
 * @param signed Positive, negative or zero signal.
 * @returns Direction enum matching the sign.
 */
function resolveDirection(signed: number): FocusMetricTrend["direction"] {
  if (signed > 0) { return "up"; }
  if (signed < 0) { return "down"; }
  return "flat";
}

/**
 * Builds a trend from a percent delta or null when the comparison is not meaningful.
 *
 * @param percent Signed percentage change.
 * @returns Trend object or null when percent is null.
 */
function trendFromPercent(percent: number | null): FocusMetricTrend | null {
  if (percent === null) { return null; }
  return { delta: percent, percent, direction: resolveDirection(percent) };
}

/**
 * Builds a trend from a raw signed delta, without a percent counterpart.
 *
 * @param delta Signed delta value.
 * @returns Trend object describing the delta direction.
 */
function trendFromDelta(delta: number): FocusMetricTrend {
  return { delta, percent: null, direction: resolveDirection(delta) };
}

interface ComputedFocusMetric {
  readonly value: number;
  readonly unit: FocusMetricUnit;
  readonly trend: FocusMetricTrend | null;
  readonly unavailable: boolean;
}

/**
 * Computes the numeric + trend payload for the selected metric from the overview.
 *
 * @param id The selected focus metric id.
 * @param overview Dashboard overview to derive values from.
 * @returns Computed value + trend + availability flag.
 */
function computeMetric(id: FocusMetricId, overview: DashboardOverview): ComputedFocusMetric {
  switch (id) {
    case "daysUntilPrimaryGoal": {
      const primary = pickPrimaryGoal(overview.goals);
      if (!primary?.targetDate) {
        return { value: 0, unit: "days", trend: null, unavailable: true };
      }
      return { value: daysBetween(primary.targetDate), unit: "days", trend: null, unavailable: false };
    }
    case "monthlyBurnRate":
      return {
        value: overview.summary.expense,
        unit: "currency",
        trend: trendFromPercent(overview.comparison.expenseVsPreviousMonthPercent),
        unavailable: false,
      };
    case "freeBalanceAfterFixed": {
      const free = overview.summary.balance - overview.summary.upcomingDueTotal;
      return {
        value: free,
        unit: "currency",
        trend: trendFromPercent(overview.comparison.balanceVsPreviousMonthPercent),
        unavailable: false,
      };
    }
    case "primaryGoalProgress": {
      const primary = pickPrimaryGoal(overview.goals);
      if (!primary) {
        return { value: 0, unit: "percent", trend: null, unavailable: true };
      }
      return { value: primary.progressPercent, unit: "percent", trend: null, unavailable: false };
    }
    case "savingsVsPreviousMonth": {
      const percent = overview.comparison.balanceVsPreviousMonthPercent;
      if (percent === null) {
        return { value: 0, unit: "percent", trend: null, unavailable: true };
      }
      return {
        value: percent,
        unit: "percent",
        trend: trendFromDelta(percent),
        unavailable: false,
      };
    }
    default:
      return { value: 0, unit: "currency", trend: null, unavailable: true };
  }
}

export interface UseFocusMetricReturn {
  readonly selectedId: Ref<FocusMetricId>;
  readonly metric: ComputedRef<FocusMetric>;
  readonly availableIds: ComputedRef<readonly FocusMetricId[]>;
  readonly isLoading: Ref<boolean>;
  readonly isError: Ref<boolean>;
  readonly selectMetric: (id: FocusMetricId) => void;
}

const PERCENT_METRIC_IDS: ReadonlySet<FocusMetricId> = new Set([
  "primaryGoalProgress",
  "savingsVsPreviousMonth",
]);

/**
 * Resolves the unit to display before the overview query resolves.
 *
 * @param id The currently selected metric id.
 * @returns Unit to use for the placeholder (unavailable) metric payload.
 */
function placeholderUnit(id: FocusMetricId): FocusMetricUnit {
  if (id === "daysUntilPrimaryGoal") { return "days"; }
  if (PERCENT_METRIC_IDS.has(id)) { return "percent"; }
  return "currency";
}

/**
 * Builds the i18n label key for a metric id.
 *
 * @param id Focus metric id.
 * @returns Canonical label i18n key.
 */
const labelKeyFor = (id: FocusMetricId): string => `focus.metrics.${id}.label`;

/**
 * Builds the i18n caption key for a metric id.
 *
 * @param id Focus metric id.
 * @returns Canonical caption i18n key.
 */
const captionKeyFor = (id: FocusMetricId): string => `focus.metrics.${id}.caption`;

/**
 * Focus Mode composable. Wraps the dashboard overview query and exposes the
 * currently-selected "one number that matters" plus the helpers the Focus
 * page needs (select, list available metrics).
 *
 * The selection is persisted per browser (not per user — the storage key is
 * global). This matches the issue spec #551, which says "persistência da
 * métrica escolhida em localStorage" without scoping to uid; revisit if we
 * hear the opposite from product.
 *
 * @returns Reactive state and helpers for the Focus Mode page.
 */
export function useFocusMetric(): UseFocusMetricReturn {
  const selectedId = ref<FocusMetricId>(readPersistedMetricId());
  const overviewQuery = useDashboardOverviewQuery();

  const overview = computed<DashboardOverview | undefined>(() => overviewQuery.data.value);

  const metric = computed<FocusMetric>(() => {
    const id = selectedId.value;
    if (!overview.value) {
      return {
        id,
        value: 0,
        unit: placeholderUnit(id),
        labelKey: labelKeyFor(id),
        captionKey: captionKeyFor(id),
        trend: null,
        unavailable: true,
      };
    }
    const computed_ = computeMetric(id, overview.value);
    return {
      id,
      value: computed_.value,
      unit: computed_.unit,
      labelKey: labelKeyFor(id),
      captionKey: captionKeyFor(id),
      trend: computed_.trend,
      unavailable: computed_.unavailable,
    };
  });

  /**
   * Commits a new selection and persists it to localStorage.
   *
   * @param id The metric id to select.
   */
  const selectMetric = (id: FocusMetricId): void => {
    selectedId.value = id;
    persistMetricId(id);
  };

  watch(selectedId, (id) => persistMetricId(id));

  return {
    selectedId,
    metric,
    availableIds: computed(() => FOCUS_METRIC_IDS),
    isLoading: overviewQuery.isLoading,
    isError: overviewQuery.isError,
    selectMetric,
  };
}
