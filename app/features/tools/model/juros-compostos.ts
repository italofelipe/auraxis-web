/**
 * Domain model for the Juros Compostos e Taxa Real calculator.
 *
 * Simulates compound interest growth month by month, with:
 *  - Optional monthly contributions (aportes).
 *  - Nominal-to-monthly rate conversion via (1 + annualRate)^(1/12) - 1.
 *  - Real rate calculation using the Fisher formula.
 *  - Chart data series for visualization.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Available period units. */
export const JUROS_COMPOSTOS_PERIOD_UNITS = ["months", "years"] as const;

/** Public route for the Juros Compostos calculator page. */
export const JUROS_COMPOSTOS_PUBLIC_PATH = "/tools/juros-compostos";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Time unit for the investment period. */
export type JurosCompostosPeriodUnit = "months" | "years";

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the Juros Compostos e Taxa Real calculator. */
export interface JurosCompostosFormState extends Record<string, unknown> {
  /** Initial capital in BRL (may be null if using only monthly contributions). */
  initialCapital: number | null;
  /** Monthly contribution in BRL (default 0). */
  monthlyContribution: number;
  /** Nominal annual interest rate in percentage (e.g. 12 = 12% a.a.). */
  nominalRatePct: number | null;
  /** Investment period length (depends on periodUnit). */
  period: number | null;
  /** Unit of the investment period. */
  periodUnit: JurosCompostosPeriodUnit;
  /** Estimated annual inflation rate in percentage (default 4.5 = IPCA). */
  inflationPct: number;
}

/**
 * Returns the default initial form state for the Juros Compostos calculator.
 *
 * @returns Default JurosCompostosFormState.
 */
export function createDefaultJurosCompostosFormState(): JurosCompostosFormState {
  return {
    initialCapital: null,
    monthlyContribution: 0,
    nominalRatePct: null,
    period: null,
    periodUnit: "years",
    inflationPct: 4.5,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validation error shape for Juros Compostos form. */
export interface JurosCompostosValidationError {
  field: keyof JurosCompostosFormState;
  messageKey: string;
}

/**
 * Validates the Juros Compostos form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateJurosCompostosForm(
  form: JurosCompostosFormState,
): JurosCompostosValidationError[] {
  const errors: JurosCompostosValidationError[] = [];

  const hasCapital = form.initialCapital !== null && form.initialCapital > 0;
  const hasContribution = form.monthlyContribution > 0;

  if (!hasCapital && !hasContribution) {
    errors.push({
      field: "initialCapital",
      messageKey: "errors.capitalOrContributionRequired",
    });
  }

  if (form.nominalRatePct === null || form.nominalRatePct <= 0) {
    errors.push({ field: "nominalRatePct", messageKey: "errors.rateRequired" });
  }

  if (form.period === null || form.period < 1) {
    errors.push({ field: "period", messageKey: "errors.periodRequired" });
  }

  return errors;
}

// ─── Chart data ───────────────────────────────────────────────────────────────

/** A single data point in the compound interest evolution chart. */
export interface JurosCompostosChartPoint {
  /** Month number (1-based). */
  month: number;
  /** Nominal accumulated amount at this month. */
  nominalAmount: number;
  /** Real accumulated amount (inflation-adjusted) at this month. */
  realAmount: number;
  /** Total contributed (initial + monthly contributions) up to this month. */
  contributed: number;
}

// ─── Result ───────────────────────────────────────────────────────────────────

/** Calculation result for the Juros Compostos e Taxa Real calculator. */
export interface JurosCompostosResult {
  /** Final nominal amount at end of period. */
  finalAmountNominal: number;
  /** Final real amount (discounted for inflation) at end of period. */
  finalAmountReal: number;
  /** Total amount contributed (initial capital + all monthly contributions). */
  totalContributed: number;
  /** Total interest earned = finalAmountNominal − totalContributed. */
  totalInterest: number;
  /** Effective annual real rate (Fisher formula) in percentage. */
  realRatePct: number;
  /** Month-by-month data points for chart rendering. */
  chartData: JurosCompostosChartPoint[];
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates compound interest growth month by month with optional contributions.
 *
 * Rate conversion:
 *  - If periodUnit is "years": total months = period * 12.
 *  - Annual rate → monthly: monthlyRate = (1 + annualRate)^(1/12) − 1.
 *  - Real rate (Fisher): realAnnual = ((1 + nominal) / (1 + inflation)) − 1.
 *
 * @param form Validated form state.
 * @returns Complete result with chart data.
 */
export function calculateJurosCompostos(form: JurosCompostosFormState): JurosCompostosResult {
  const nominalAnnualRate = (form.nominalRatePct ?? 0) / 100;
  const inflationAnnualRate = form.inflationPct / 100;
  const monthlyRate = Math.pow(1 + nominalAnnualRate, 1 / 12) - 1;
  const monthlyInflationRate = Math.pow(1 + inflationAnnualRate, 1 / 12) - 1;
  const totalMonths = resolveTotalMonths(form);
  const rates: SimRates = { nominal: monthlyRate, inflation: monthlyInflationRate };
  const chartData = buildChartData(form, totalMonths, rates);
  return buildResult(chartData, nominalAnnualRate, inflationAnnualRate);
}

/**
 * Resolves the total number of simulation months from the form period/unit.
 *
 * @param form Current form state.
 * @returns Total months as a rounded integer.
 */
function resolveTotalMonths(form: JurosCompostosFormState): number {
  const raw = form.period ?? 0;
  return form.periodUnit === "years" ? Math.round(raw * 12) : Math.round(raw);
}

/** Computed monthly rates for simulation. */
interface SimRates {
  /** Monthly nominal interest rate (decimal). */
  nominal: number;
  /** Monthly inflation rate (decimal). */
  inflation: number;
}

/**
 * Builds month-by-month chart data for the simulation.
 *
 * @param form Current form state.
 * @param totalMonths Number of months to simulate.
 * @param rates Monthly nominal and inflation rates.
 * @returns Array of chart data points.
 */
function buildChartData(
  form: JurosCompostosFormState,
  totalMonths: number,
  rates: SimRates,
): JurosCompostosChartPoint[] {
  const { nominal: monthlyRate, inflation: monthlyInflationRate } = rates;
  const chartData: JurosCompostosChartPoint[] = [];
  let nominalAmount = form.initialCapital ?? 0;
  let realAmount = form.initialCapital ?? 0;
  let contributed = form.initialCapital ?? 0;

  for (let month = 1; month <= totalMonths; month++) {
    nominalAmount = nominalAmount * (1 + monthlyRate) + form.monthlyContribution;
    realAmount = realAmount * (1 + monthlyRate) / (1 + monthlyInflationRate) + form.monthlyContribution;
    contributed += form.monthlyContribution;
    chartData.push({
      month,
      nominalAmount: round2(nominalAmount),
      realAmount: round2(realAmount),
      contributed: round2(contributed),
    });
  }

  return chartData;
}

/**
 * Assembles the final result object from chart data and rates.
 *
 * @param chartData Month-by-month chart points.
 * @param nominalAnnualRate Annual nominal rate (decimal).
 * @param inflationAnnualRate Annual inflation rate (decimal).
 * @returns Complete JurosCompostosResult.
 */
function buildResult(
  chartData: JurosCompostosChartPoint[],
  nominalAnnualRate: number,
  inflationAnnualRate: number,
): JurosCompostosResult {
  const last = chartData[chartData.length - 1];
  const finalAmountNominal = last?.nominalAmount ?? 0;
  const finalAmountReal = last?.realAmount ?? 0;
  const totalContributed = last?.contributed ?? 0;
  const totalInterest = round2(finalAmountNominal - totalContributed);
  const realRatePct = round2(((1 + nominalAnnualRate) / (1 + inflationAnnualRate) - 1) * 100);
  return { finalAmountNominal, finalAmountReal, totalContributed, totalInterest, realRatePct, chartData };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Rounds a number to 2 decimal places (currency precision).
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
