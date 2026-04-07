import { describe, it, expect } from "vitest";
import { computed } from "vue";
import { useFinancialHealthScore, type FinancialHealthScoreInput } from "../useFinancialHealthScore";
import type { DashboardSummary, DashboardGoalSummary, DashboardTrendsMonthEntry } from "~/features/dashboard/model/dashboard-overview";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

// ── Factories ─────────────────────────────────────────────────────────────────

/**
 * Builds a minimal DashboardSummary.
 *
 * @param overrides Fields to override from defaults.
 * @returns DashboardSummary instance.
 */
function makeSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    income: 10_000,
    expense: 4_000,
    balance: 6_000,
    upcomingDueTotal: 0,
    netWorth: 50_000,
    ...overrides,
  };
}

/**
 * Builds a DashboardGoalSummary with given progress.
 *
 * @param progressPercent Progress percentage (0–100).
 * @param id Unique identifier.
 * @returns DashboardGoalSummary instance.
 */
function makeGoal(progressPercent: number, id = "g-1"): DashboardGoalSummary {
  return {
    id,
    name: "Goal",
    progressPercent,
    currentAmount: progressPercent,
    targetAmount: 100,
    targetDate: null,
  };
}

/**
 * Builds a DashboardTrendsMonthEntry.
 *
 * @param month ISO year-month string (YYYY-MM).
 * @param income Monthly income.
 * @param expenses Monthly expenses.
 * @returns DashboardTrendsMonthEntry instance.
 */
function makeTrend(month: string, income: number, expenses: number): DashboardTrendsMonthEntry {
  return { month, income, expenses, balance: income - expenses };
}

/**
 * Builds a WalletEntryDto with specified asset_type and register_date.
 *
 * @param assetType Asset type string.
 * @param registerDate ISO date string (YYYY-MM-DD).
 * @returns WalletEntryDto instance.
 */
function makeEntry(
  assetType: WalletEntryDto["asset_type"],
  registerDate: string,
): WalletEntryDto {
  return {
    id: `${assetType}-${registerDate}`,
    name: assetType,
    ticker: null,
    quantity: null,
    current_value: 1000,
    cost_basis: null,
    register_date: registerDate,
    change_percent: null,
    asset_type: assetType,
  };
}

/**
 * Returns ISO date string N months before today.
 *
 * @param n Months to subtract.
 * @returns YYYY-MM-DD string.
 */
function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns ISO year-month N months before today.
 *
 * @param n Months to subtract.
 * @returns YYYY-MM string.
 */
function monthLabelAgo(n: number): string {
  return monthsAgo(n).slice(0, 7);
}

/**
 * Wraps input in a computed ref and runs the composable.
 *
 * @param input FinancialHealthScoreInput object.
 * @returns The score computed ref value.
 */
function run(input: FinancialHealthScoreInput): ReturnType<typeof useFinancialHealthScore>["score"]["value"] {
  const { score } = useFinancialHealthScore(computed(() => input));
  return score.value;
}

// ── Shared empty input ─────────────────────────────────────────────────────────

const EMPTY_INPUT: FinancialHealthScoreInput = {
  summary: null,
  goals: [],
  trends: [],
  portfolioValue: null,
  walletEntries: [],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useFinancialHealthScore / income commitment", () => {
  it("scores at 20 when expense/income ratio is 0.5 exactly", () => {
    const result = run({ ...EMPTY_INPUT, summary: makeSummary({ income: 10_000, expense: 5_000 }) });
    expect(result.pillars.find((p) => p.key === "incomeCommitment")!.score).toBe(20);
  });

  it("scores at 20 when ratio is below 0.5", () => {
    const result = run({ ...EMPTY_INPUT, summary: makeSummary({ income: 10_000, expense: 3_000 }) });
    expect(result.pillars.find((p) => p.key === "incomeCommitment")!.score).toBe(20);
  });

  it("scores proportionally when ratio is above 0.5", () => {
    const result = run({ ...EMPTY_INPUT, summary: makeSummary({ income: 10_000, expense: 7_500 }) });
    expect(result.pillars.find((p) => p.key === "incomeCommitment")!.score).toBeCloseTo(10, 0);
  });

  it("clamps score to 0 when ratio is >= 1.0", () => {
    const result = run({ ...EMPTY_INPUT, summary: makeSummary({ income: 5_000, expense: 6_000 }) });
    expect(result.pillars.find((p) => p.key === "incomeCommitment")!.score).toBe(0);
  });

  it("returns null when income is 0", () => {
    const result = run({ ...EMPTY_INPUT, summary: makeSummary({ income: 0, expense: 0 }) });
    expect(result.pillars.find((p) => p.key === "incomeCommitment")!.score).toBeNull();
  });

  it("returns null when summary is null", () => {
    const result = run(EMPTY_INPUT);
    expect(result.pillars.find((p) => p.key === "incomeCommitment")!.score).toBeNull();
  });
});

describe("useFinancialHealthScore / emergency reserve", () => {
  it("scores at 20 when portfolio covers 6x avg expense", () => {
    const trends = [makeTrend("2025-01", 10_000, 5_000), makeTrend("2025-02", 10_000, 5_000)];
    const result = run({ ...EMPTY_INPUT, portfolioValue: 30_000, trends });
    expect(result.pillars.find((p) => p.key === "emergencyReserve")!.score).toBeCloseTo(20, 0);
  });

  it("scores proportionally when partially covered", () => {
    const trends = [makeTrend("2025-01", 10_000, 5_000)];
    const result = run({ ...EMPTY_INPUT, portfolioValue: 15_000, trends });
    expect(result.pillars.find((p) => p.key === "emergencyReserve")!.score).toBeCloseTo(10, 0);
  });

  it("returns null when portfolioValue is null", () => {
    const result = run({ ...EMPTY_INPUT, portfolioValue: null, trends: [makeTrend("2025-01", 10_000, 5_000)] });
    expect(result.pillars.find((p) => p.key === "emergencyReserve")!.score).toBeNull();
  });

  it("returns null when trends are empty", () => {
    const result = run({ ...EMPTY_INPUT, portfolioValue: 30_000, trends: [] });
    expect(result.pillars.find((p) => p.key === "emergencyReserve")!.score).toBeNull();
  });
});

describe("useFinancialHealthScore / diversification", () => {
  it("scores at 20 for 5+ distinct asset types", () => {
    const entries = ["stock", "fii", "crypto", "fixed_income", "other"].map(
      (t) => makeEntry(t as WalletEntryDto["asset_type"], "2025-01-01"),
    );
    const result = run({ ...EMPTY_INPUT, walletEntries: entries });
    expect(result.pillars.find((p) => p.key === "diversification")!.score).toBe(20);
  });

  it("scores at 8 for 2 distinct asset types", () => {
    const entries = [makeEntry("stock", "2025-01-01"), makeEntry("fii", "2025-01-01")];
    const result = run({ ...EMPTY_INPUT, walletEntries: entries });
    expect(result.pillars.find((p) => p.key === "diversification")!.score).toBe(8);
  });

  it("returns null when wallet is empty", () => {
    const result = run(EMPTY_INPUT);
    expect(result.pillars.find((p) => p.key === "diversification")!.score).toBeNull();
  });
});

describe("useFinancialHealthScore / goal progress", () => {
  it("scores based on average completion", () => {
    const goals = [makeGoal(60, "g-1"), makeGoal(80, "g-2")];
    const result = run({ ...EMPTY_INPUT, goals });
    expect(result.pillars.find((p) => p.key === "goalProgress")!.score).toBeCloseTo(14, 0);
  });

  it("excludes completed goals (100%) from calculation", () => {
    const goals = [makeGoal(100, "done"), makeGoal(50, "active")];
    const result = run({ ...EMPTY_INPUT, goals });
    expect(result.pillars.find((p) => p.key === "goalProgress")!.score).toBeCloseTo(10, 0);
  });

  it("returns null when all goals are completed", () => {
    const result = run({ ...EMPTY_INPUT, goals: [makeGoal(100)] });
    expect(result.pillars.find((p) => p.key === "goalProgress")!.score).toBeNull();
  });

  it("returns null when there are no goals", () => {
    const result = run(EMPTY_INPUT);
    expect(result.pillars.find((p) => p.key === "goalProgress")!.score).toBeNull();
  });
});

describe("useFinancialHealthScore / investment regularity", () => {
  it("scores at 20 for entries in all 6 of last 6 months", () => {
    const entries = [0, 1, 2, 3, 4, 5].map((n) => makeEntry("stock", monthsAgo(n)));
    const result = run({ ...EMPTY_INPUT, walletEntries: entries });
    expect(result.pillars.find((p) => p.key === "investmentRegularity")!.score).toBeCloseTo(20, 0);
  });

  it("scores proportionally for 3 of 6 months", () => {
    const entries = [0, 2, 4].map((n) => makeEntry("stock", monthsAgo(n)));
    const result = run({ ...EMPTY_INPUT, walletEntries: entries });
    expect(result.pillars.find((p) => p.key === "investmentRegularity")!.score).toBeCloseTo(10, 0);
  });

  it("scores at 0 when all entries are older than 6 months", () => {
    const entries = [makeEntry("stock", monthsAgo(8))];
    const result = run({ ...EMPTY_INPUT, walletEntries: entries });
    expect(result.pillars.find((p) => p.key === "investmentRegularity")!.score).toBe(0);
  });

  it("returns null when wallet is empty", () => {
    const result = run(EMPTY_INPUT);
    expect(result.pillars.find((p) => p.key === "investmentRegularity")!.score).toBeNull();
  });
});

describe("useFinancialHealthScore / total and tier", () => {
  it("sums only calculable pillar scores for total", () => {
    const result = run({ ...EMPTY_INPUT, summary: makeSummary({ income: 10_000, expense: 4_000 }) });
    expect(result.totalScore).toBe(20);
  });

  it("returns 0 when no data is available for any pillar", () => {
    expect(run(EMPTY_INPUT).totalScore).toBe(0);
  });

  it("reaches >= 80 when 4 pillars score maximum", () => {
    const entries = [0, 1, 2, 3, 4, 5].map((n) => makeEntry("stock", monthsAgo(n)));
    const diverseEntries = ["fii", "crypto", "fixed_income", "other"].map(
      (t) => makeEntry(t as WalletEntryDto["asset_type"], monthsAgo(0)),
    );
    const trends = Array.from({ length: 6 }, (_, i) => makeTrend(monthLabelAgo(5 - i), 10_000, 4_000));
    const result = run({
      summary: makeSummary({ income: 10_000, expense: 4_000 }),
      goals: [makeGoal(100)],
      trends,
      portfolioValue: 1_000_000,
      walletEntries: [...entries, ...diverseEntries],
    });
    expect(result.totalScore).toBeGreaterThanOrEqual(80);
  });

  it("classifies score < 40 as poor", () => {
    const result = run({ ...EMPTY_INPUT, summary: makeSummary({ income: 10_000, expense: 4_000 }) });
    expect(result.tier).toBe("poor");
  });

  it("classifies combined score as fair or good when multiple pillars are active", () => {
    const entries = [makeEntry("stock", monthsAgo(0)), makeEntry("fii", monthsAgo(0))];
    const trends = [makeTrend("2025-01", 10_000, 5_000)];
    const result = run({
      summary: makeSummary({ income: 10_000, expense: 5_000 }),
      goals: [],
      trends,
      portfolioValue: 15_000,
      walletEntries: entries,
    });
    expect(["fair", "good"]).toContain(result.tier);
  });

  it("always returns exactly 5 pillars", () => {
    expect(run(EMPTY_INPUT).pillars).toHaveLength(5);
  });

  it("each pillar has maxScore of 20", () => {
    run(EMPTY_INPUT).pillars.forEach((p) => expect(p.maxScore).toBe(20));
  });
});

describe("useFinancialHealthScore / history", () => {
  it("builds one entry per trend month", () => {
    const trends = [makeTrend("2025-01", 10_000, 4_000), makeTrend("2025-02", 10_000, 5_000)];
    const result = run({ ...EMPTY_INPUT, trends });
    expect(result.history).toHaveLength(2);
    expect(result.history[0]!.month).toBe("2025-01");
    expect(result.history[1]!.month).toBe("2025-02");
  });

  it("produces lower history score for months with higher expense ratio", () => {
    const trends = [makeTrend("2025-01", 10_000, 4_000), makeTrend("2025-02", 10_000, 9_000)];
    const result = run({ ...EMPTY_INPUT, trends });
    expect(result.history[0]!.score).toBeGreaterThan(result.history[1]!.score);
  });

  it("returns empty history when trends are empty", () => {
    expect(run(EMPTY_INPUT).history).toHaveLength(0);
  });
});
