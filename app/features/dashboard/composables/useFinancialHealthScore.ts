/**
 * useFinancialHealthScore — PROD-01-1
 *
 * Computes a financial health score (0–100) across 5 weighted pillars,
 * each contributing a maximum of 20 points:
 *
 *   1. Income commitment  — fixed expenses / income  (ideal < 50%)
 *   2. Emergency reserve  — portfolio value / (avg monthly expense × 6)
 *   3. Diversification    — distinct asset types in wallet
 *   4. Goal progress      — average % completion of active goals
 *   5. Investment regularity — months with investments in last 6 months
 *
 * Non-calculable pillars return null (displayed as "–") without penalising
 * the total.  The total is the sum of calculable pillar scores only.
 *
 * Issues: #563, #564 (parent PROD-01)
 */

import type { ComputedRef } from "vue";
import type { DashboardSummary, DashboardGoalSummary, DashboardTrendsMonthEntry } from "~/features/dashboard/model/dashboard-overview";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PILLAR_SCORE = 20 as const;

/** Ideal income-commitment ratio. Above this, score degrades linearly to 0 at 100%. */
const IDEAL_COMMITMENT_RATIO = 0.5;

/** Number of emergency-fund months considered fully funded. */
const EMERGENCY_MONTHS = 6;

/** Score per distinct asset type (max 5 types → 20pts). */
const SCORE_PER_ASSET_TYPE = 4;

/** Score per month with recorded investments (max 6 months → 20pts). */
const SCORE_PER_INVESTMENT_MONTH = 20 / 6;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Represents a single health pillar with its score and improvement tip.
 */
export interface HealthPillar {
  /** Pillar identifier key. */
  readonly key: string;
  /** Display label shown in the UI. */
  readonly label: string;
  /** Computed score in [0, 20], or null if data is insufficient. */
  readonly score: number | null;
  /** Maximum possible points for this pillar. */
  readonly maxScore: typeof MAX_PILLAR_SCORE;
  /** Actionable improvement tip shown in the breakdown. */
  readonly tip: string;
}

/**
 * Monthly snapshot used for the score history sparkline.
 */
export interface HealthScoreHistory {
  /** ISO year-month (YYYY-MM). */
  readonly month: string;
  /** Approximate score for that month (income commitment only). */
  readonly score: number;
}

/**
 * Full result returned by useFinancialHealthScore.
 */
export interface FinancialHealthScoreResult {
  /** Overall health score in [0, 100] (calculable pillars only). */
  readonly totalScore: number;
  /** All five individual pillars with scores and tips. */
  readonly pillars: readonly HealthPillar[];
  /** Monthly history approximation (for sparkline). */
  readonly history: readonly HealthScoreHistory[];
  /** Semantic tier: "good" ≥ 70, "fair" ≥ 40, "poor" < 40. */
  readonly tier: "good" | "fair" | "poor";
}

// ── Pillar scorers ────────────────────────────────────────────────────────────

/**
 * Scores the income-commitment pillar.
 * Returns null when income data is unavailable (income = 0 or null summary).
 *
 * @param summary Dashboard summary for the selected period.
 * @returns Score in [0, 20] or null.
 */
function scoreIncomeCommitment(summary: DashboardSummary | null): number | null {
  if (!summary || summary.income <= 0) { return null; }
  const ratio = summary.expense / summary.income;
  if (ratio <= IDEAL_COMMITMENT_RATIO) { return MAX_PILLAR_SCORE; }
  const excess = ratio - IDEAL_COMMITMENT_RATIO;
  return Math.max(0, MAX_PILLAR_SCORE * (1 - excess / IDEAL_COMMITMENT_RATIO));
}

/**
 * Scores the emergency-reserve pillar.
 * Returns null when average monthly expense cannot be computed.
 *
 * @param portfolioValue Current total portfolio value.
 * @param trends Last N months of income/expense trends.
 * @returns Score in [0, 20] or null.
 */
function scoreEmergencyReserve(
  portfolioValue: number | null,
  trends: readonly DashboardTrendsMonthEntry[],
): number | null {
  if (portfolioValue === null || trends.length === 0) { return null; }
  const avgExpense = trends.reduce((sum, t) => sum + t.expenses, 0) / trends.length;
  if (avgExpense <= 0) { return null; }
  const ratio = portfolioValue / (avgExpense * EMERGENCY_MONTHS);
  return Math.min(MAX_PILLAR_SCORE, ratio * MAX_PILLAR_SCORE);
}

/**
 * Scores the diversification pillar based on distinct asset types in wallet.
 * Returns null when wallet is empty.
 *
 * @param entries Wallet entries for the authenticated user.
 * @returns Score in [0, 20] or null.
 */
function scoreDiversification(entries: readonly WalletEntryDto[]): number | null {
  if (entries.length === 0) { return null; }
  const distinctTypes = new Set(entries.map((e) => e.asset_type)).size;
  return Math.min(MAX_PILLAR_SCORE, distinctTypes * SCORE_PER_ASSET_TYPE);
}

/**
 * Scores the goal-progress pillar as the average completion percentage.
 * Returns null when there are no active goals.
 *
 * @param goals Dashboard goal summaries for active goals.
 * @returns Score in [0, 20] or null.
 */
function scoreGoalProgress(goals: readonly DashboardGoalSummary[]): number | null {
  const active = goals.filter((g) => g.progressPercent < 100);
  if (active.length === 0) { return null; }
  const avgPercent = active.reduce((sum, g) => sum + g.progressPercent, 0) / active.length;
  return (avgPercent / 100) * MAX_PILLAR_SCORE;
}

/**
 * Scores the investment-regularity pillar using wallet entry register dates.
 * Counts distinct calendar months with at least one new entry in the last 6 months.
 * Returns null when wallet is empty.
 *
 * @param entries Wallet entries for the authenticated user.
 * @returns Score in [0, 20] or null.
 */
function scoreInvestmentRegularity(entries: readonly WalletEntryDto[]): number | null {
  if (entries.length === 0) { return null; }
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 7);
  const months = new Set(
    entries
      .map((e) => e.register_date.slice(0, 7))
      .filter((m) => m >= cutoffStr),
  );
  if (months.size === 0) { return 0; }
  return Math.min(MAX_PILLAR_SCORE, months.size * SCORE_PER_INVESTMENT_MONTH);
}

// ── History ───────────────────────────────────────────────────────────────────

/**
 * Builds monthly score history using income commitment computed per trend month.
 * Other pillars are held constant at their current values as an approximation.
 *
 * @param trends Trend entries ordered oldest → newest.
 * @param otherPillarsTotal Sum of constant pillar scores.
 * @returns Array of monthly score snapshots.
 */
function buildHistory(
  trends: readonly DashboardTrendsMonthEntry[],
  otherPillarsTotal: number,
): HealthScoreHistory[] {
  return trends.map((entry) => {
    const commitmentRatio = entry.income > 0 ? entry.expenses / entry.income : 1;
    const commitmentScore = commitmentRatio <= IDEAL_COMMITMENT_RATIO
      ? MAX_PILLAR_SCORE
      : Math.max(0, MAX_PILLAR_SCORE * (1 - (commitmentRatio - IDEAL_COMMITMENT_RATIO) / IDEAL_COMMITMENT_RATIO));
    const total = Math.round(Math.min(100, commitmentScore + otherPillarsTotal));
    return { month: entry.month, score: total };
  });
}

// ── Tier ─────────────────────────────────────────────────────────────────────

/**
 * Maps a numeric score to a semantic tier.
 *
 * @param score Health score in [0, 100].
 * @returns Tier string.
 */
function toTier(score: number): "good" | "fair" | "poor" {
  if (score >= 70) { return "good"; }
  if (score >= 40) { return "fair"; }
  return "poor";
}

// ── Inputs ────────────────────────────────────────────────────────────────────

/**
 * Input data required to compute the financial health score.
 */
export interface FinancialHealthScoreInput {
  /** Current period dashboard summary (income, expense, net worth). */
  readonly summary: DashboardSummary | null;
  /** Active goals to measure progress against. */
  readonly goals: readonly DashboardGoalSummary[];
  /** Multi-month trend data for emergency reserve and history. */
  readonly trends: readonly DashboardTrendsMonthEntry[];
  /** Total portfolio value (used for emergency reserve pillar). */
  readonly portfolioValue: number | null;
  /** Wallet entries (used for diversification + investment regularity). */
  readonly walletEntries: readonly WalletEntryDto[];
}

// ── Composable ────────────────────────────────────────────────────────────────

/**
 * Reactive composable that computes the Auraxis financial health score.
 *
 * All computation is pure and re-runs whenever reactive inputs change.
 * Non-calculable pillars return null without affecting the total score.
 *
 * @param input Reactive input data object.
 * @returns ComputedRef with the full score result.
 */
export function useFinancialHealthScore(
  input: ComputedRef<FinancialHealthScoreInput>,
): { score: ComputedRef<FinancialHealthScoreResult> } {
  const score = computed<FinancialHealthScoreResult>(() => {
    const { summary, goals, trends, portfolioValue, walletEntries } = input.value;

    const pillars: HealthPillar[] = [
      {
        key: "incomeCommitment",
        label: "Comprometimento de renda",
        score: scoreIncomeCommitment(summary),
        maxScore: MAX_PILLAR_SCORE,
        tip: "Mantenha seus gastos fixos abaixo de 50% da sua renda.",
      },
      {
        key: "emergencyReserve",
        label: "Reserva de emergência",
        score: scoreEmergencyReserve(portfolioValue, trends),
        maxScore: MAX_PILLAR_SCORE,
        tip: "Acumule pelo menos 6 meses de gastos em reserva.",
      },
      {
        key: "diversification",
        label: "Diversificação",
        score: scoreDiversification(walletEntries),
        maxScore: MAX_PILLAR_SCORE,
        tip: "Invista em pelo menos 3 classes de ativos diferentes.",
      },
      {
        key: "goalProgress",
        label: "Progresso de metas",
        score: scoreGoalProgress(goals),
        maxScore: MAX_PILLAR_SCORE,
        tip: "Avance nas suas metas financeiras regularmente.",
      },
      {
        key: "investmentRegularity",
        label: "Regularidade de aportes",
        score: scoreInvestmentRegularity(walletEntries),
        maxScore: MAX_PILLAR_SCORE,
        tip: "Invista em pelo menos 5 dos últimos 6 meses.",
      },
    ];

    const totalScore = Math.round(
      pillars.reduce((sum, p) => sum + (p.score ?? 0), 0),
    );

    const otherPillarsTotal = pillars
      .filter((p) => p.key !== "incomeCommitment")
      .reduce((sum, p) => sum + (p.score ?? 0), 0);

    const history = buildHistory(trends, otherPillarsTotal);

    return {
      totalScore,
      pillars,
      history,
      tier: toTier(totalScore),
    };
  });

  return { score };
}
