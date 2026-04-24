import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref, nextTick } from "vue";
import { useFocusMetric } from "./useFocusMetric";
import {
  FOCUS_SELECTED_METRIC_STORAGE_KEY,
  DEFAULT_FOCUS_METRIC_ID,
  type FocusMetricId,
} from "../model/focus-metric";
import type { DashboardOverview } from "~/features/dashboard/model/dashboard-overview";

type OverviewRef = { value: DashboardOverview | undefined };

const overviewRef: OverviewRef = { value: undefined };
const isLoadingRef = ref(false);
const isErrorRef = ref(false);

vi.mock("~/features/dashboard/queries/use-dashboard-overview-query", () => ({
  useDashboardOverviewQuery: (): unknown => ({
    data: overviewRef,
    isLoading: isLoadingRef,
    isError: isErrorRef,
  }),
}));

/**
 * Builds a DashboardOverview fixture with sensible defaults, overridable per test.
 *
 * @param partial Partial overrides applied on top of the baseline fixture.
 * @returns A fully-populated DashboardOverview suitable for computeMetric tests.
 */
function makeOverview(partial: Partial<DashboardOverview> = {}): DashboardOverview {
  return {
    period: { key: "current_month", start: "2026-04-01", end: "2026-04-30", label: "Abril/2026" },
    summary: { income: 8000, expense: 3200, balance: 12_500, upcomingDueTotal: 1500, netWorth: 45_000 },
    comparison: {
      incomeVsPreviousMonthPercent: 5,
      expenseVsPreviousMonthPercent: -8,
      balanceVsPreviousMonthPercent: 12,
    },
    timeseries: [],
    expensesByCategory: [],
    upcomingDues: [],
    goals: [],
    portfolio: { currentValue: 0, changePercent: null },
    alerts: [],
    ...partial,
  };
}

beforeEach(() => {
  localStorage.clear();
  overviewRef.value = undefined;
  isLoadingRef.value = false;
  isErrorRef.value = false;
});

describe("useFocusMetric — selection + persistence", () => {
  it("falls back to the default metric when storage is empty", () => {
    const { selectedId } = useFocusMetric();
    expect(selectedId.value).toBe(DEFAULT_FOCUS_METRIC_ID);
  });

  it("reads a previously persisted metric id on init", () => {
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "monthlyBurnRate");
    const { selectedId } = useFocusMetric();
    expect(selectedId.value).toBe<FocusMetricId>("monthlyBurnRate");
  });

  it("ignores invalid persisted ids and falls back to default", () => {
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "not-a-real-metric");
    const { selectedId } = useFocusMetric();
    expect(selectedId.value).toBe(DEFAULT_FOCUS_METRIC_ID);
  });

  it("persists selection via selectMetric()", () => {
    const { selectMetric, selectedId } = useFocusMetric();
    selectMetric("primaryGoalProgress");
    expect(selectedId.value).toBe<FocusMetricId>("primaryGoalProgress");
    expect(localStorage.getItem(FOCUS_SELECTED_METRIC_STORAGE_KEY)).toBe("primaryGoalProgress");
  });
});

describe("useFocusMetric — computeMetric outputs", () => {
  it("marks all metrics unavailable while overview is undefined", () => {
    const { metric } = useFocusMetric();
    expect(metric.value.unavailable).toBe(true);
    expect(metric.value.value).toBe(0);
  });

  it("monthlyBurnRate uses overview.summary.expense with trend", () => {
    overviewRef.value = makeOverview();
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "monthlyBurnRate");
    const { metric } = useFocusMetric();
    expect(metric.value.value).toBe(3200);
    expect(metric.value.unit).toBe("currency");
    expect(metric.value.trend).toEqual({ delta: -8, percent: -8, direction: "down" });
    expect(metric.value.unavailable).toBe(false);
  });

  it("freeBalanceAfterFixed subtracts upcoming dues from balance", () => {
    overviewRef.value = makeOverview();
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "freeBalanceAfterFixed");
    const { metric } = useFocusMetric();
    expect(metric.value.value).toBe(11_000);
    expect(metric.value.unit).toBe("currency");
  });

  it("primaryGoalProgress picks the active goal with the earliest targetDate", () => {
    overviewRef.value = makeOverview({
      goals: [
        { id: "a", name: "Meta A", progressPercent: 10, currentAmount: 100, targetAmount: 1000, targetDate: "2027-01-01" },
        { id: "b", name: "Meta B", progressPercent: 55, currentAmount: 550, targetAmount: 1000, targetDate: "2026-06-01" },
        { id: "c", name: "Meta C", progressPercent: 100, currentAmount: 1000, targetAmount: 1000, targetDate: "2026-05-01" },
      ],
    });
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "primaryGoalProgress");
    const { metric } = useFocusMetric();
    expect(metric.value.value).toBe(55);
    expect(metric.value.unit).toBe("percent");
    expect(metric.value.unavailable).toBe(false);
  });

  it("primaryGoalProgress is unavailable when there are no goals", () => {
    overviewRef.value = makeOverview({ goals: [] });
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "primaryGoalProgress");
    const { metric } = useFocusMetric();
    expect(metric.value.unavailable).toBe(true);
  });

  it("daysUntilPrimaryGoal returns a non-negative day count", () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    overviewRef.value = makeOverview({
      goals: [
        { id: "g", name: "Meta", progressPercent: 25, currentAmount: 250, targetAmount: 1000, targetDate: future },
      ],
    });
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "daysUntilPrimaryGoal");
    const { metric } = useFocusMetric();
    expect(metric.value.unit).toBe("days");
    expect(metric.value.value).toBeGreaterThanOrEqual(6);
    expect(metric.value.value).toBeLessThanOrEqual(8);
  });

  it("daysUntilPrimaryGoal is unavailable when no goal has a targetDate", () => {
    overviewRef.value = makeOverview({
      goals: [
        { id: "g", name: "Meta", progressPercent: 0, currentAmount: 0, targetAmount: 1000, targetDate: null },
      ],
    });
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "daysUntilPrimaryGoal");
    const { metric } = useFocusMetric();
    expect(metric.value.unavailable).toBe(true);
  });

  it("savingsVsPreviousMonth is unavailable when comparison percent is null", () => {
    overviewRef.value = makeOverview({
      comparison: {
        incomeVsPreviousMonthPercent: null,
        expenseVsPreviousMonthPercent: null,
        balanceVsPreviousMonthPercent: null,
      },
    });
    localStorage.setItem(FOCUS_SELECTED_METRIC_STORAGE_KEY, "savingsVsPreviousMonth");
    const { metric } = useFocusMetric();
    expect(metric.value.unavailable).toBe(true);
  });

  it("reacts to selection changes", async () => {
    overviewRef.value = makeOverview();
    const { metric, selectMetric } = useFocusMetric();
    selectMetric("monthlyBurnRate");
    await nextTick();
    expect(metric.value.id).toBe<FocusMetricId>("monthlyBurnRate");
    selectMetric("freeBalanceAfterFixed");
    await nextTick();
    expect(metric.value.id).toBe<FocusMetricId>("freeBalanceAfterFixed");
  });
});
